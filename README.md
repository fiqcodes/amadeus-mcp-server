# Amadeus MCP Server

A Model Context Protocol (MCP) server that provides access to Amadeus Travel API functionality, including flights, hotels, tours, and city information.

## Features

- **Flight Search**: Search for flights with detailed information (prices, airlines, duration, stops)
- **City Information**: Get city details including coordinates and IATA codes
- **Tours & Activities**: Discover activities and tours by location
- **Hotel Search**: Find hotels with ratings and pricing

## Prerequisites

- Node.js 18 or higher
- Amadeus API credentials (get them from [Amadeus for Developers](https://developers.amadeus.com/))

## Installation

### Option 1: Install from npm (after publishing)

```bash
npm install -g amadeus-mcp-server
```

### Option 2: Install from source

```bash
# Clone the repository
git clone https://github.com/yourusername/amadeus-mcp-server.git
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

### 2. Set Environment Variables

Create a `.env` file in your project root or set environment variables:

```bash
export AMADEUS_API_KEY="your_api_key_here"
export AMADEUS_API_SECRET="your_api_secret_here"
```

### 3. Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**On macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**On Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "amadeus": {
      "command": "node",
      "args": ["/path/to/amadeus-mcp-server/build/index.js"],
      "env": {
        "AMADEUS_API_KEY": "your_api_key_here",
        "AMADEUS_API_SECRET": "your_api_secret_here"
      }
    }
  }
}
```

Or if installed globally via npm:

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

## Available Tools

### 1. get_flights

Search for flight offers between cities.

**Parameters**:
- `origin` (required): Origin airport IATA code (e.g., "JFK")
- `destination` (required): Destination airport IATA code (e.g., "LAX")
- `departureDate` (required): Departure date (YYYY-MM-DD)
- `returnDate` (optional): Return date for round trips
- `adults` (optional): Number of adults (default: 1)
- `travelClass` (optional): ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
- `maxResults` (optional): Max results to return (default: 5)

**Example**:
```
Find me flights from New York (JFK) to Los Angeles (LAX) on 2024-03-15
```

### 2. get_city

Get information about a city including coordinates.

**Parameters**:
- `cityName` (required): Name of the city

**Example**:
```
Get information about Paris
```

### 3. get_tours_activities

Search for tours and activities by location.

**Parameters**:
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radius` (optional): Search radius in km (default: 1)

**Example**:
```
Find activities near coordinates 48.8566, 2.3522 (Paris)
```

### 4. get_hotels

Search for hotels in a city.

**Parameters**:
- `cityCode` (required): City IATA code (e.g., "PAR")
- `checkInDate` (optional): Check-in date (YYYY-MM-DD)
- `checkOutDate` (optional): Check-out date (YYYY-MM-DD)
- `adults` (optional): Number of guests (default: 1)
- `radius` (optional): Search radius (default: 5)
- `radiusUnit` (optional): KM or MILE (default: KM)
- `ratings` (optional): Filter by ratings (e.g., "3,4,5")
- `priceRange` (optional): Price range (e.g., "50-200")

**Example**:
```
Find hotels in Paris for check-in on 2024-03-15 and check-out on 2024-03-20
```

## Development

### Running in development mode

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Testing the server

You can test the server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Project Structure

```
amadeus-mcp-server/
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## Troubleshooting

### "Authentication failed"
- Verify your API key and secret are correct
- Check if the environment variables are properly set
- Ensure you're using the test environment credentials for test API

### "Tool not found"
- Make sure the server is properly configured in Claude Desktop
- Restart Claude Desktop after configuration changes
- Check the server logs for errors

### "Rate limit exceeded"
- Amadeus has rate limits on their test API
- Wait a few minutes before retrying
- Consider upgrading to production API for higher limits

## API Documentation

For more details about the Amadeus API:
- [Flight Offers Search](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search)
- [Hotel Search](https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search)
- [Tours and Activities](https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/tours-and-activities)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- GitHub Issues: [your-repo-url]
- Amadeus Support: [https://developers.amadeus.com/support](https://developers.amadeus.com/support)