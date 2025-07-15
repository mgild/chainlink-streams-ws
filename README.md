# Chainlink Data Streams TypeScript SDK

TypeScript SDK for Chainlink Data Streams with WebSocket support for real-time price feeds.

## Features

- ✅ HMAC-SHA256 authentication
- ✅ REST API client for fetching reports
- ✅ WebSocket client for real-time streaming
- ✅ Automatic reconnection with exponential backoff
- ✅ TypeScript with full type definitions
- ✅ Comprehensive error handling

## Installation

```bash
cd typescript-sdk
npm install
```

## Configuration

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Chainlink API credentials:
```
CHAINLINK_API_KEY=your-api-key-here
CHAINLINK_API_SECRET=your-api-secret-here
CHAINLINK_FEED_ID=0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782
```

## Usage

### REST API Client

```typescript
import { ChainlinkClient } from 'chainlink-streams-sdk';

const client = new ChainlinkClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
});

// Test connection
const isConnected = await client.testConnection();

// Get latest report
const report = await client.getLatestReport('feedId');
console.log(`Price: ${report.price}`);
```

### WebSocket Streaming

```typescript
import { ChainlinkWebSocket } from 'chainlink-streams-sdk';

const wsClient = new ChainlinkWebSocket({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
});

// Set up event handlers
wsClient.onConnected(() => {
  console.log('Connected to WebSocket');
  wsClient.subscribe(['feedId1', 'feedId2']);
});

wsClient.onMessageReceived((message) => {
  if (message.type === 'report' && message.report) {
    console.log(`Price update: ${message.report.price}`);
  }
});

// Connect
await wsClient.connect();
```

## Running the Example

```bash
npm run dev
```

## Building

```bash
npm run build
```

## API Reference

### ChainlinkClient

- `testConnection()`: Test API connectivity
- `getLatestReport(feedId)`: Get latest price report for a feed
- `getBulkReports(feedIds)`: Get reports for multiple feeds

### ChainlinkWebSocket

- `connect()`: Establish WebSocket connection
- `disconnect()`: Close connection
- `subscribe(feedIds)`: Subscribe to price feeds
- `unsubscribe(feedIds)`: Unsubscribe from feeds
- `onMessageReceived(callback)`: Handle incoming messages
- `onConnected(callback)`: Handle connection events
- `onDisconnected(callback)`: Handle disconnection
- `onErrorReceived(callback)`: Handle errors

## Error Handling

The SDK provides typed errors for different scenarios:

- `InvalidCredentialsError`: Invalid API key/secret
- `SignatureMismatchError`: HMAC signature verification failed
- `WebSocketError`: WebSocket-specific errors
- `ConnectionError`: Network connection issues# chainlink-streams-ws
