import WebSocket from 'ws';
import { ChainlinkAuth } from './auth';
import { WebSocketError, ConnectionError } from './errors';
import { Report } from './client';

export interface WebSocketConfig {
  apiKey: string;
  apiSecret: string;
  wsUrl?: string;
}

export interface StreamMessage {
  type: 'report' | 'error' | 'heartbeat';
  report?: Report;
  error?: string;
  timestamp?: number;
}

export interface SubscriptionRequest {
  type: 'subscribe' | 'unsubscribe';
  feedIds: string[];
}

export class ChainlinkWebSocket {
  private auth: ChainlinkAuth;
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribedFeeds: Set<string> = new Set();
  private connectedFeedIds: string[] = [];
  
  private onMessage?: (message: StreamMessage) => void;
  private onError?: (error: Error) => void;
  private onConnect?: () => void;
  private onDisconnect?: () => void;

  constructor(config: WebSocketConfig) {
    this.auth = new ChainlinkAuth({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
    this.wsUrl = config.wsUrl || 'wss://ws.testnet-dataengine.chain.link/api/v1/ws';
  }

  async connect(feedIds?: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Store feed IDs for reconnection
        if (feedIds) {
          this.connectedFeedIds = feedIds;
        }
        
        let connectUrl = this.wsUrl;
        
        // Add feed IDs to URL if provided
        const feedsToConnect = feedIds || this.connectedFeedIds;
        if (feedsToConnect && feedsToConnect.length > 0) {
          const urlObj = new URL(this.wsUrl);
          urlObj.searchParams.set('feedIDs', feedsToConnect.join(','));
          connectUrl = urlObj.toString();
        }

        const urlObj = new URL(connectUrl);
        const path = urlObj.pathname + urlObj.search;
        const authHeaders = this.auth.generateWebSocketAuthHeaders(path);

        this.ws = new WebSocket(connectUrl, {
          headers: authHeaders,
        });

        this.ws.on('open', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
          this.onConnect?.();
          
          // Resubscribe to feeds after reconnection
          if (this.subscribedFeeds.size > 0) {
            this.subscribe(Array.from(this.subscribedFeeds));
          }
          
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString()) as StreamMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
            this.onError?.(new WebSocketError('Failed to parse message'));
          }
        });

        this.ws.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          this.onError?.(error);
          reject(new ConnectionError(`WebSocket error: ${error.message}`));
        });

        this.ws.on('close', (code: number, reason: string) => {
          console.log(`WebSocket closed: ${code} - ${reason}`);
          this.cleanup();
          this.onDisconnect?.();
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        });

        this.ws.on('ping', () => {
          this.ws?.pong();
        });

      } catch (error) {
        reject(new ConnectionError(`Failed to create WebSocket: ${error}`));
      }
    });
  }

  private handleMessage(message: StreamMessage): void {
    switch (message.type) {
      case 'report':
        if (message.report) {
          this.onMessage?.(message);
        }
        break;
      case 'error':
        this.onError?.(new WebSocketError(message.error || 'Unknown error'));
        break;
      case 'heartbeat':
        // Handle heartbeat if needed
        break;
      default:
        console.warn('Unknown message type:', message);
    }
  }

  subscribe(feedIds: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new WebSocketError('WebSocket is not connected');
    }

    const request: SubscriptionRequest = {
      type: 'subscribe',
      feedIds: feedIds,
    };

    this.ws.send(JSON.stringify(request));
    feedIds.forEach(id => this.subscribedFeeds.add(id));
  }

  unsubscribe(feedIds: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new WebSocketError('WebSocket is not connected');
    }

    const request: SubscriptionRequest = {
      type: 'unsubscribe',
      feedIds: feedIds,
    };

    this.ws.send(JSON.stringify(request));
    feedIds.forEach(id => this.subscribedFeeds.delete(id));
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async reconnect(): Promise<void> {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.subscribedFeeds.clear();
  }

  onMessageReceived(callback: (message: StreamMessage) => void): void {
    this.onMessage = callback;
  }

  onErrorReceived(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  onConnected(callback: () => void): void {
    this.onConnect = callback;
  }

  onDisconnected(callback: () => void): void {
    this.onDisconnect = callback;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}