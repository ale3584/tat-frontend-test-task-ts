export interface StartSearchResponse {
  token: string;
  waitUntil?: string;
}

export interface ApiErrorResponse {
  code?: number;
  error?: boolean;
  message?: string;
  waitUntil?: string;
}

export interface SearchPrice {
  id: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  hotelID: string;
}

export interface SearchPricesResponse {
  prices?: Record<string, SearchPrice>;
}

export interface SearchResultState {
  token: string;
  receivedAt: number;
  priceIds: string[];
  pricesById: Record<string, SearchPrice>;
}
