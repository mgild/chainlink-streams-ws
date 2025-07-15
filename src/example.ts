import * as dotenv from 'dotenv';
import { ChainlinkClient, ChainlinkWebSocket, StreamMessage } from './index';

dotenv.config();

async function main() {
  const apiKey = process.env.CHAINLINK_API_KEY!;
  const apiSecret = process.env.CHAINLINK_API_SECRET!;
  const feedId = process.env.CHAINLINK_FEED_ID!;
  const wsUrl = process.env.CHAINLINK_WS_URL || 'wss://ws.testnet-dataengine.chain.link/api/v1/ws';

  if (!apiKey || !apiSecret) {
    console.error('Please set CHAINLINK_API_KEY and CHAINLINK_API_SECRET environment variables');
    process.exit(1);
  }

  console.log('=== Chainlink Data Streams SDK Example ===\n');

  // WebSocket Streaming Example
  console.log('\n2. Testing WebSocket Streaming...');
  const wsClient = new ChainlinkWebSocket({
    apiKey,
    apiSecret,
    wsUrl,
  });

  // Set up event handlers
  wsClient.onConnected(() => {
    console.log('   WebSocket connected successfully');
    if (feedId) {
      console.log(`   Streaming updates for feed: ${feedId}`);
    }
  });

  wsClient.onMessageReceived((message: StreamMessage) => {
    if (message.type === 'report' && message.report) {
      console.log('\n   Received real-time update:');
      console.log(`   Feed ID: ${message.report.feedID}`);
      console.log(`   Price: ${message.report.price}`);
      console.log(`   Bid: ${message.report.bid}`);
      console.log(`   Ask: ${message.report.ask}`);
      console.log(`   Timestamp: ${new Date(message.report.observationsTimestamp * 1000).toISOString()}`);
    }
  });

  wsClient.onErrorReceived((error: Error) => {
    console.error('   WebSocket error:', error.message);
  });

  wsClient.onDisconnected(() => {
    console.log('   WebSocket disconnected');
  });

  try {
    // Connect to WebSocket with feed IDs
    await wsClient.connect(feedId ? [feedId] : undefined);

    // Keep the example running for 30 seconds to receive updates
    console.log('\n   Listening for real-time updates for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Disconnect gracefully
    console.log('\n   Disconnecting...');
    wsClient.disconnect();
  } catch (error) {
    console.error('   WebSocket connection error:', error);
  }

  console.log('\n=== Example completed ===');
}

// Run the example
main().catch(console.error);
