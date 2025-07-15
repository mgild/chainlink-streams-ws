import { createHmac, createHash } from 'crypto';

export interface AuthConfig {
  apiKey: string;
  apiSecret: string;
}

export class ChainlinkAuth {
  private apiKey: string;
  private apiSecret: string;

  constructor(config: AuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  generateAuthHeaders(method: string, path: string, body: string = ''): Record<string, string> {
    const timestamp = Date.now();
    const bodyHash = this.hashBody(body);
    const stringToSign = `${method} ${path} ${bodyHash} ${this.apiKey} ${timestamp}`;
    
    // Generate signature AFTER creating the string to sign
    const signature = this.createSignature(stringToSign);

    return {
      'Authorization': this.apiKey,
      'X-Authorization-Timestamp': timestamp.toString(),
      'X-Authorization-Signature-SHA256': signature,
    };
  }

  private hashBody(body: string): string {
    return createHash('sha256').update(body).digest('hex');
  }

  private createSignature(stringToSign: string): string {
    return createHmac('sha256', this.apiSecret)
      .update(stringToSign)
      .digest('hex');
  }

  generateWebSocketAuthHeaders(path: string): Record<string, string> {
    const timestamp = Date.now();
    const bodyHash = this.hashBody(''); // Empty body for WebSocket
    const stringToSign = `GET ${path} ${bodyHash} ${this.apiKey} ${timestamp}`;
    const signature = this.createSignature(stringToSign);

    return {
      'Authorization': this.apiKey,
      'X-Authorization-Timestamp': timestamp.toString(),
      'X-Authorization-Signature-SHA256': signature,
    };
  }
}