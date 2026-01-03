#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Amadeus API Configuration
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const BASE_URL = "https://test.api.amadeus.com";

// Cache for access token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Exchange rates cache
let exchangeRates: { [key: string]: number } = {
  EUR: 1.10,
  GBP: 1.27,
  JPY: 0.0071,
  IDR: 0.000063,
  USD: 1.0,
};
let ratesLastUpdated: number = 0;

/**
 * Fetch live exchange rates from exchangerate-api.com (free tier)
 */
async function updateExchangeRates(): Promise<void> {
  // Update rates every 24 hours
  if (Date.now() - ratesLastUpdated < 24 * 60 * 60 * 1000) {
    return;
  }

  try {
    const response = await axios.get(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    
    if (response.data && response.data.rates) {
      // Convert rates to USD base (invert the rates)
      const rates = response.data.rates;
      exchangeRates = {
        USD: 1.0,
        EUR: 1 / rates.EUR,
        GBP: 1 / rates.GBP,
        JPY: 1 / rates.JPY,
        IDR: 1 / rates.IDR,
      };
      ratesLastUpdated = Date.now();
      console.error("✅ Exchange rates updated successfully");
    }
  } catch (error) {
    console.error("⚠️ Failed to fetch exchange rates, using cached values");
  }
}

/**
 * Convert price to USD
 */
function convertToUSD(amount: number, fromCurrency: string): number {
  const rate = exchangeRates[fromCurrency] || 1.0;
  return amount * rate;
}

/**
 * Add USD prices to response data
 */
function addUSDPrices(data: any): any {
  if (!data || !data.data) return data;

  if (Array.isArray(data.data)) {
    data.data = data.data.map((item: any) => {
      if (item.price && item.price.amount && item.price.currencyCode) {
        const originalAmount = parseFloat(item.price.amount);
        const originalCurrency = item.price.currencyCode;
        const usdAmount = convertToUSD(originalAmount, originalCurrency);
        
        item.price.usdAmount = parseFloat(usdAmount.toFixed(2));
        item.price.originalAmount = originalAmount;
        item.price.originalCurrency = originalCurrency;
      }
      return item;
    });
  }

  return data;
}

/**
 * Get OAuth access token for Amadeus API
 */
async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_API_KEY!,
        client_secret: AMADEUS_API_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const token = response.data.access_token;
    if (!token) {
      throw new Error("No access token received from Amadeus API");
    }
    
    accessToken = token;
    tokenExpiry = Date.now() + 25 * 60 * 1000;
    
    return token;
  } catch (error) {
    throw new Error(`Failed to get access token: ${error}`);
  }
}

/**
 * Search for flights
 */
async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  travelClass?: string;
  maxResults?: number;
}) {
  const token = await getAccessToken();
  
  const queryParams: any = {
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: params.adults || 1,
    max: params.maxResults || 5,
    currencyCode: "USD",
  };

  if (params.returnDate) {
    queryParams.returnDate = params.returnDate;
  }

  if (params.travelClass) {
    queryParams.travelClass = params.travelClass;
  }

  try {
    const response = await axios.get(`${BASE_URL}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: queryParams,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      `Flight search failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`
    );
  }
}

/**
 * Search for city information
 */
async function searchCity(cityName: string) {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `${BASE_URL}/v1/reference-data/locations/cities`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          keyword: cityName,
          max: 5,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      `City search failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`
    );
  }
}

/**
 * Search for tours and activities
 */
async function searchToursActivities(params: {
  latitude: number;
  longitude: number;
  radius?: number;
}) {
  const token = await getAccessToken();

  try {
    const response = await axios.get(`${BASE_URL}/v1/shopping/activities`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius || 1,
      },
    });

    return addUSDPrices(response.data);
  } catch (error: any) {
    throw new Error(
      `Activities search failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`
    );
  }
}

/**
 * Search for hotels by city
 */
async function searchHotels(params: {
  cityCode: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  radius?: number;
  radiusUnit?: string;
  ratings?: string;
  priceRange?: string;
}) {
  const token = await getAccessToken();

  const queryParams: any = {
    cityCode: params.cityCode,
  };

  if (params.checkInDate) queryParams.checkInDate = params.checkInDate;
  if (params.checkOutDate) queryParams.checkOutDate = params.checkOutDate;
  if (params.adults) queryParams.adults = params.adults;
  if (params.radius) queryParams.radius = params.radius;
  if (params.radiusUnit) queryParams.radiusUnit = params.radiusUnit;
  if (params.ratings) queryParams.ratings = params.ratings;
  if (params.priceRange) queryParams.priceRange = params.priceRange;

  try {
    const response = await axios.get(
      `${BASE_URL}/v1/reference-data/locations/hotels/by-city`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams,
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      `Hotel search failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`
    );
  }
}

const server = new Server(
  {
    name: "amadeus-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_flights",
        description:
          "Search for flight offers between two cities. Returns flight details including airlines, prices in USD, flight IDs, duration, stops, and travel class.",
        inputSchema: {
          type: "object",
          properties: {
            origin: {
              type: "string",
              description: "Origin airport IATA code (e.g., 'JFK', 'LAX')",
            },
            destination: {
              type: "string",
              description: "Destination airport IATA code (e.g., 'LHR', 'CDG')",
            },
            departureDate: {
              type: "string",
              description: "Departure date in YYYY-MM-DD format",
            },
            returnDate: {
              type: "string",
              description: "Optional return date in YYYY-MM-DD format for round trips",
            },
            adults: {
              type: "number",
              description: "Number of adult passengers (default: 1)",
            },
            travelClass: {
              type: "string",
              description: "Travel class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results to return (default: 5)",
            },
          },
          required: ["origin", "destination", "departureDate"],
        },
      },
      {
        name: "get_city",
        description:
          "Search for city information including name, country, region, IATA code, and geographic coordinates.",
        inputSchema: {
          type: "object",
          properties: {
            cityName: {
              type: "string",
              description: "Name of the city to search for",
            },
          },
          required: ["cityName"],
        },
      },
      {
        name: "get_tours_activities",
        description:
          "Search for tours and activities in a specific location using latitude and longitude coordinates. Prices are converted to USD.",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude of the location",
            },
            longitude: {
              type: "number",
              description: "Longitude of the location",
            },
            radius: {
              type: "number",
              description: "Search radius in kilometers (default: 1)",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "get_hotels",
        description:
          "Search for hotels in a city using the city's IATA code. Returns hotel information including names, ratings, and locations.",
        inputSchema: {
          type: "object",
          properties: {
            cityCode: {
              type: "string",
              description: "City IATA code (e.g., 'PAR' for Paris, 'NYC' for New York)",
            },
            checkInDate: {
              type: "string",
              description: "Check-in date in YYYY-MM-DD format",
            },
            checkOutDate: {
              type: "string",
              description: "Check-out date in YYYY-MM-DD format",
            },
            adults: {
              type: "number",
              description: "Number of adult guests (default: 1)",
            },
            radius: {
              type: "number",
              description: "Search radius (default: 5)",
            },
            radiusUnit: {
              type: "string",
              description: "Unit for radius: KM or MILE (default: KM)",
            },
            ratings: {
              type: "string",
              description: "Filter by ratings (e.g., '3,4,5')",
            },
            priceRange: {
              type: "string",
              description: "Price range filter (e.g., '50-200')",
            },
          },
          required: ["cityCode"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
      throw new Error(
        "AMADEUS_API_KEY and AMADEUS_API_SECRET environment variables must be set"
      );
    }

    // Update exchange rates if needed
    await updateExchangeRates();

    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_flights": {
        const result = await searchFlights(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_city": {
        const result = await searchCity((args as any).cityName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_tours_activities": {
        const result = await searchToursActivities(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_hotels": {
        const result = await searchHotels(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Amadeus MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});