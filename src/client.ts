import axios, { AxiosInstance, AxiosError } from 'axios';
import { ChainlinkAuth } from './auth';
import {
  InvalidCredentialsError,
  SignatureMismatchError,
  InvalidResponseError,
  ConnectionError
} from './errors';

export interface ClientConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

export interface Report {
  feedID: string;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: string;
  linkFee: string;
  expiresAt: number;
  price: string;
  bid: string;
  ask: string;
  benchmarkPrice?: string;
  liquidityPrice?: string;
}

export interface ReportsResponse {
  reports: Report[];
}

export class ChainlinkClient {
  private auth: ChainlinkAuth;
  private httpClient: AxiosInstance;

  constructor(config: ClientConfig) {
    this.auth = new ChainlinkAuth({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });

    this.httpClient = axios.create({
      baseURL: config.baseUrl || 'https://api.testnet-dataengine.chain.link',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/api/v1/reports/latest');
      return response.status === 200;
    } catch (error) {
      console.error('Test connection error:', error);
      if (error instanceof InvalidCredentialsError) {
        return false;
      }
      throw error;
    }
  }

  async getLatestReport(feedId: string): Promise<Report> {
    const response = await this.makeRequest('GET', `/api/v1/reports/latest?feedID=${feedId}`);
    const data = response.data as ReportsResponse;
    
    if (!data.reports || data.reports.length === 0) {
      throw new InvalidResponseError(`No report found for feed ID: ${feedId}`);
    }
    
    return data.reports[0];
  }

  async getBulkReports(feedIds: string[]): Promise<Report[]> {
    const response = await this.makeRequest('GET', '/api/v1/reports/bulk', {
      feedIDs: feedIds.join(','),
    });
    const data = response.data as ReportsResponse;
    
    if (!data.reports) {
      throw new InvalidResponseError('Invalid bulk reports response');
    }
    
    return data.reports;
  }

  private async makeRequest(method: string, path: string, params?: any, body?: any) {
    const authHeaders = this.auth.generateAuthHeaders(
      method,
      path,
      body ? JSON.stringify(body) : ''
    );

    try {
      const response = await this.httpClient.request({
        method,
        url: path,
        params,
        data: body,
        headers: authHeaders,
      });
      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 401:
            throw new InvalidCredentialsError(
              error.response?.data?.message || 'Invalid API credentials'
            );
          case 403:
            throw new SignatureMismatchError(
              error.response?.data?.message || 'Signature verification failed'
            );
          default:
            throw new InvalidResponseError(
              error.response?.data?.message || `HTTP error: ${error.response?.status}`
            );
        }
      }
      throw new ConnectionError(`Network error: ${error}`);
    }
  }
}