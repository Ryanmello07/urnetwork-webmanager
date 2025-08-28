export interface AuthResponse {
  by_jwt?: string;
  error?: {
    message: string;
  };
}

export interface PasswordLoginResponse {
  verification_required?: {
    user_auth: string;
  };
  network?: {
    by_jwt: string;
    name: string;
  };
  error?: {
    message: string;
  };
}

export interface NetworkUser {
  user_id: string;
  user_auth: string;
  verified: boolean;
  auth_type: string;
  network_name: string;
}

export interface NetworkUserResponse {
  network_user?: NetworkUser;
  error?: {
    message: string;
  };
}

export interface Client {
  client_id: string;
  device_id: string;
  network_id: string;
  description: string;
  device_name: string;
  device_spec: string;
  create_time: string;
  auth_time: string;
  resident: {
    client_id: string;
    instance_id: string;
    resident_id: string;
    resident_host: string;
    resident_service: string;
    resident_block: string;
    resident_internal_ports: number[];
  };
  provide_mode: number;
  connections: Array<{
    client_id: string;
    connection_id: string;
    connect_time: string;
    disconnect_time: string;
    connection_host: string;
    connection_service: string;
    connection_block: null;
  }>;
}

export interface ClientsResponse {
  clients: Client[];
  error?: {
    message: string;
  };
}

export interface RemoveClientResponse {
  error?: {
    message: string;
    isAborted: boolean;
  };
}

export interface ProviderEvent {
  event_time: string;
  connected: boolean;
}

export interface Provider {
  client_id: string;
  connected: boolean;
  connected_events_last_24h: ProviderEvent[];
  uptime_last_24h: number;
  transfer_data_last_24h: number;
  payout_last_24h: number;
  search_interest_last_24h: number;
  contracts_last_24h: number;
  clients_last_24h: number;
  provide_mode: number;
}

export interface StatsResponse {
  created_time: string;
  providers: Provider[];
  error?: {
    message: string;
  };
}

export interface LeaderboardEntry {
  network_id: string;
  network_name: string;
  net_mib_count: number;
  is_public: boolean;
}

export interface LeaderboardResponse {
  earners: LeaderboardEntry[];
  error?: {
    message: string;
  };
}

export interface NetworkRanking {
  network_ranking: {
    net_mib_count: number;
    leaderboard_rank: number;
    leaderboard_public: boolean;
  };
  error?: {
    message: string;
  };
}

export interface LocationSpec {
  location_id: string;
  location_group_id: string;
  client_id: string;
  best_available: boolean;
}

export interface LocationGroup {
  location_group_id: string;
  name: string;
  provider_count: number;
  promoted: boolean;
  match_distance: number;
}

export interface ProviderLocation {
  location_id: string;
  location_type: string;
  name: string;
  city: string;
  city_location_id: string;
  region: string;
  region_location_id: string;
  country: string;
  country_location_id: string;
  country_code: string;
  provider_count: number;
  match_distance: number;
}

export interface Device {
  client_id: string;
  device_name: string;
}

export interface ProviderLocationsResponse {
  specs: LocationSpec[];
  groups: LocationGroup[];
  locations: ProviderLocation[];
  devices: Device[];
  error?: {
    message: string;
  };
}

export interface WalletStats {
  paid_bytes_provided: number;
  unpaid_bytes_provided: number;
}

export interface WalletStatsResponse {
  paid_bytes_provided: number;
  unpaid_bytes_provided: number;
  error?: {
    message: string;
  };
}

export interface WalletStatsEntry {
  timestamp: string;
  paid_mb: number;
  unpaid_mb: number;
}

export interface CreateAuthCodeResponse {
  auth_code?: string;
  duration_minutes?: number;
  uses?: number;
  error?: {
    auth_code_limit_exceeded?: boolean;
    message: string;
  };
}

export interface AccountPayment {
  payment_id: string;
  payment_plan_id: string;
  wallet_id: string;
  network_id: string;
  payout_byte_count: number;
  payout_nano_cents: number;
  subsidy_payout_nano_cents: number;
  reliability_subsidy_nano_cents: number;
  min_sweep_time: string;
  create_time: string;
  payment_record: string;
  token_type: string;
  token_amount: number;
  payment_time: string;
  payment_receipt: string;
  wallet_address: string;
  blockchain: string;
  tx_hash: string;
  completed: boolean;
  complete_time: string | null;
  canceled: boolean;
  cancel_time: string | null;
}

export interface AccountPaymentsResponse {
  account_payments: AccountPayment[];
  error?: {
    message: string;
  };
}
