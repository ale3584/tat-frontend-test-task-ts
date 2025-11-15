import type { SearchPrice, SearchResultState } from '../types/search';

export const normalizeSearchResult = (
  token: string,
  prices: Record<string, SearchPrice> = {}
): SearchResultState => {
  const priceIds: string[] = [];
  const pricesById: Record<string, SearchPrice> = {};

  Object.entries(prices).forEach(([priceId, price]) => {
    const normalizedPrice: SearchPrice = {
      ...price,
      id: price.id ?? priceId,
    };

    priceIds.push(priceId);
    pricesById[priceId] = normalizedPrice;
  });

  return {
    token,
    receivedAt: Date.now(),
    priceIds,
    pricesById,
  };
};