# Amadeus MCP Server

[![npm version](https://badge.fury.io/js/amadeus-mcp-server.svg)](https://www.npmjs.com/package/amadeus-mcp-server)

A Model Context Protocol (MCP) server that provides access to Amadeus Travel API functionality, including flights, hotels, tours, and city information with automatic USD currency conversion.

## Features

- **Flight Search**: Search for flights with detailed information (prices in USD, airlines, duration, stops)
- **City Information**: Get city details including coordinates and IATA codes
- **Tours & Activities**: Discover activities and tours by location with USD pricing
- **Hotel Search**: Find hotels with ratings and locations
- **Live Exchange Rates**: Automatic currency conversion to USD for all prices

## Prerequisites

- Node.js 18 or higher
- Amadeus API credentials (get them from [Amadeus for Developers](https://developers.amadeus.com/))

## Installation

### Install from npm

```bash
npm install -g @fiqcodes/amadeus-mcp-server
```

### Install from source

```bash
# Clone the repository
git clone https://github.com/fiqcodes/amadeus-mcp-server.git
cd amadeus-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Configuration

### 1. Get Amadeus API Credentials

1. Go to [Amadeus for Developers](https://developers.amadeus.com/)
2. Sign up or log in
3. Create a new app in the dashboard
4. Copy your API Key and API Secret

### 2. Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**On macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**On Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**On Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "amadeus": {
      "command": "amadeus-mcp-server",
      "env": {
        "AMADEUS_API_KEY": "your_api_key_here",
        "AMADEUS_API_SECRET": "your_api_secret_here"
      }
    }
  }
}
```

Or if running from source:

```json
{
  "mcpServers": {
    "amadeus": {
      "command": "node",
      "args": ["/absolute/path/to/amadeus-mcp-server/build/index.js"],
      "env": {
        "AMADEUS_API_KEY": "your_api_key_here",
        "AMADEUS_API_SECRET": "your_api_secret_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Completely quit and reopen Claude Desktop for the changes to take effect.

## Available Tools

### 1. get_flights

Search for flight offers between cities. All prices returned in USD.

**Parameters**:
- `origin` (required): Origin airport IATA code (e.g., "JFK", "CGK")
- `destination` (required): Destination airport IATA code (e.g., "LAX", "DPS")
- `departureDate` (required): Departure date (YYYY-MM-DD)
- `returnDate` (optional): Return date for round trips (YYYY-MM-DD)
- `adults` (optional): Number of adults (default: 1)
- `travelClass` (optional): ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
- `maxResults` (optional): Max results to return (default: 5)

**Example with Claude**:
```
Find me flights from Jakarta (CGK) to Bali (DPS) on January 20, 2026
```

### 2. get_city

Get information about a city including name, country, IATA code, and geographic coordinates.

**Parameters**:
- `cityName` (required): Name of the city

**Example with Claude**:
```
Get information about Tokyo
```

### 3. get_tours_activities

Search for tours and activities by location. Prices automatically converted to USD.

**Parameters**:
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radius` (optional): Search radius in km (default: 1)

**Example with Claude**:
```
Find activities in Paris at coordinates 48.8566, 2.3522
```

### 4. get_hotels

Search for hotels in a city using IATA code.

**Parameters**:
- `cityCode` (required): City IATA code (e.g., "PAR", "NYC", "LON")
- `checkInDate` (optional): Check-in date (YYYY-MM-DD)
- `checkOutDate` (optional): Check-out date (YYYY-MM-DD)
- `adults` (optional): Number of guests (default: 1)
- `radius` (optional): Search radius (default: 5)
- `radiusUnit` (optional): KM or MILE (default: KM)
- `ratings` (optional): Filter by ratings (e.g., "3,4,5")
- `priceRange` (optional): Price range (e.g., "50-200")

**Example with Claude**:
```
Find hotels in Paris for March 15-20, 2026
```

## Usage with Claude

Once configured, you can ask Claude naturally:

- "Find cheap flights from New York to London next month"
- "Show me activities in Tokyo"
- "What hotels are available in Paris for my trip?"
- "Get me flight options from Jakarta to Singapore on January 25th"

Claude will automatically use the appropriate tools and present the results in a user-friendly format.

## Development

### Running in development mode

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Testing the server

Test the API integration:

```bash
export AMADEUS_API_KEY="your_key"
export AMADEUS_API_SECRET="your_secret"
npm run build && node build/test-amadeus.js
```

### Using MCP Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Currency Conversion

The server automatically fetches live exchange rates from exchangerate-api.com and caches them for 24 hours. All non-USD prices are converted and returned with both original and USD amounts:

```json
{
  "price": {
    "amount": "199.0",
    "currencyCode": "EUR",
    "usdAmount": 218.90,
    "originalAmount": 199.0,
    "originalCurrency": "EUR"
  }
}
```

## Project Structure

```
amadeus-mcp-server/
├── src/
│   ├── index.ts          # Main server implementation
│   └── test-amadeus.ts   # Test script
├── build/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## Troubleshooting

### "Authentication failed"
- Verify your API key and secret are correct
- Check if the environment variables are properly set in Claude config
- Ensure you're using valid Amadeus credentials (test or production)

### "Tool not found" or tools not showing
- Make sure the server is properly configured in `claude_desktop_config.json`
- Verify the path is absolute (not relative)
- Restart Claude Desktop completely (quit and reopen)
- Check Claude logs: Help → View Logs

### "Rate limit exceeded"
- Amadeus test API has rate limits (free tier)
- Wait a few minutes before retrying
- Consider upgrading to production API for higher limits

### Build errors
```bash
rm -rf node_modules package-lock.json build
npm install
npm run build
```

## API Documentation

For more details about the Amadeus API:
- [Flight Offers Search](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search)
- [Hotel Search](https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search)
- [Tours and Activities](https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/tours-and-activities)
- [City Search](https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/city-search)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This MCP server uses the Amadeus Test API by default. For production use, update the `BASE_URL` in the code to `https://api.amadeus.com` and use production credentials.