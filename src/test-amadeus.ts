/**
 * Test script for Amadeus MCP Server
 * Run with: npm run build && node build/test-amadeus.js
 */

import axios from "axios";

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const BASE_URL = "https://test.api.amadeus.com";

async function getAccessToken(): Promise<string> {
  console.log("🔑 Getting access token...");
  
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

  console.log("✅ Token obtained successfully");
  return response.data.access_token;
}

async function testFlights(token: string) {
  console.log("\n📍 Testing Flight Search...");
  
  try {
    const response = await axios.get(`${BASE_URL}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: "LAX",
        destinationLocationCode: "JFK",
        departureDate: "2026-06-01",
        adults: 1,
        max: 3,
        currencyCode: "USD"
      },
    });

    console.log("✅ Flight search successful");
    console.log(`   Found ${response.data.data.length} flights`);
    
    if (response.data.data.length > 0) {
      const flight = response.data.data[0];
      console.log(`   Sample flight: ${flight.price.currency} ${flight.price.total}`);
    }
  } catch (error: any) {
    console.error("❌ Flight search failed:", error.response?.data || error.message);
  }
}

async function testCity(token: string) {
  console.log("\n📍 Testing City Search...");
  
  try {
    const response = await axios.get(
      `${BASE_URL}/v1/reference-data/locations/cities`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          keyword: "Paris",
          max: 5,
        },
      }
    );

    console.log("✅ City search successful");
    console.log(`   Found ${response.data.data.length} cities`);
    
    if (response.data.data.length > 0) {
      const city = response.data.data[0];
      console.log(`   ${city.name}, ${city.address.countryName}`);
      console.log(`   IATA: ${city.iataCode}`);
      console.log(`   Coordinates: ${city.geoCode.latitude}, ${city.geoCode.longitude}`);
    }
  } catch (error: any) {
    console.error("❌ City search failed:", error.response?.data || error.message);
  }
}

async function testActivities(token: string) {
  console.log("\n📍 Testing Activities Search...");
  
  try {
    const response = await axios.get(`${BASE_URL}/v1/shopping/activities`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        latitude: 48.8566,
        longitude: 2.3522,
        radius: 1,
      },
    });

    console.log("✅ Activities search successful");
    console.log(`   Found ${response.data.data.length} activities`);
    
    if (response.data.data.length > 0) {
      const activity = response.data.data[0];
      console.log(`   Sample: ${activity.name}`);
      if (activity.price) {
        const price = activity.price;
        if (price.usdAmount) {
          console.log(`   Price: USD ${price.usdAmount} (original: ${price.originalCurrency} ${price.originalAmount})`);
        } else {
          console.log(`   Price: ${price.currencyCode || 'N/A'} ${price.amount || 'N/A'}`);
        }
      } else {
        console.log(`   Price: N/A`);
      }
    }
  } catch (error: any) {
    console.error("❌ Activities search failed:", error.response?.data || error.message);
  }
}

async function testHotels(token: string) {
  console.log("\n📍 Testing Hotel Search...");
  
  try {
    const response = await axios.get(
      `${BASE_URL}/v1/reference-data/locations/hotels/by-city`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          cityCode: "PAR",
        },
      }
    );

    console.log("✅ Hotel search successful");
    console.log(`   Found ${response.data.data.length} hotels`);
    
    if (response.data.data.length > 0) {
      const hotel = response.data.data[0];
      console.log(`   Sample: ${hotel.name}`);
      console.log(`   Hotel ID: ${hotel.hotelId}`);
    }
  } catch (error: any) {
    console.error("❌ Hotel search failed:", error.response?.data || error.message);
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 Amadeus API Test Suite");
  console.log("=".repeat(60));

  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.error("\n❌ Error: AMADEUS_API_KEY and AMADEUS_API_SECRET must be set");
    console.error("   Set them with:");
    console.error("   export AMADEUS_API_KEY='your_key'");
    console.error("   export AMADEUS_API_SECRET='your_secret'");
    process.exit(1);
  }

  try {
    const token = await getAccessToken();
    
    await testFlights(token);
    await testCity(token);
    await testActivities(token);
    await testHotels(token);
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests completed!");
    console.log("=".repeat(60));
    console.log("\nYour MCP server should work correctly.");
    console.log("Next step: Configure it in Claude Desktop\n");
    
  } catch (error: any) {
    console.error("\n❌ Test suite failed:", error.message);
    process.exit(1);
  }
}

runTests();