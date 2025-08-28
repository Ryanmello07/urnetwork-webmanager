// Type definitions for the application

export interface WalletStatsSettings {
  refreshInterval: number;
  timezone: string;
  isAutoRefreshEnabled: boolean;
  maxDataPoints: number;
  showDataPoints: boolean;
}

export interface StorageInfo {
  totalRecords: number;
  storageSize: string;
}