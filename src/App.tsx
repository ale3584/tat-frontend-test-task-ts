import { useState } from 'react';
import { SearchForm } from './components/SearchForm';
import { getSearchPrices, startSearchPrices } from './api';
import type {
  ApiErrorResponse,
  SearchPrice,
  SearchPricesResponse,
  SearchResultState,
  StartSearchResponse,
} from './types/search';
import './styles/main.scss';

const MAX_ERROR_RETRIES = 2;

const getDefaultRetryTimestamp = (): string =>
  new Date(Date.now() + 1000).toISOString();

const waitFor = async (waitUntil?: string): Promise<void> => {
  if (!waitUntil) return;

  const targetTimestamp = Date.parse(waitUntil);

  if (Number.isNaN(targetTimestamp)) {
    return;
  }

  const delay = targetTimestamp - Date.now();

  if (delay <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delay);
  });
};

const normalizeSearchResult = (
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

const fetchPricesWithPolling = async (
  token: string,
  initialWaitUntil?: string
): Promise<Record<string, SearchPrice>> => {
  let attempts = 0;
  let nextWaitUntil = initialWaitUntil;

  while (true) {
    if (nextWaitUntil) {
      await waitFor(nextWaitUntil);
      nextWaitUntil = undefined;
    }

    try {
      const response = await getSearchPrices(token);
      const data = (await response.json()) as SearchPricesResponse;

      return data.prices ?? {};
    } catch (error) {
      if (error instanceof Response) {
        let payload: ApiErrorResponse = {};

        try {
          payload = (await error.json()) as ApiErrorResponse;
        } catch {
          // Ignore JSON parse errors and use defaults below.
        }

        if (error.status === 425) {
          nextWaitUntil = payload.waitUntil;
          continue;
        }

        attempts += 1;

        if (attempts > MAX_ERROR_RETRIES) {
          throw new Error(
            payload.message ?? 'Не вдалося отримати результати пошуку турів.'
          );
        }

        nextWaitUntil = payload.waitUntil ?? getDefaultRetryTimestamp();
        continue;
      }

      attempts += 1;

      if (attempts > MAX_ERROR_RETRIES) {
        throw new Error('Сталася помилка мережі. Спробуйте пізніше.');
      }

      nextWaitUntil = getDefaultRetryTimestamp();
    }
  }
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Record<string, SearchResultState>>({});
  const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const currentResult = activeCountryId ? searchResults[activeCountryId] : undefined;
  const shouldShowEmptyState =
    hasSearched && !isLoading && !error && currentResult?.priceIds?.length === 0;

  const statusMessage = (() => {
    if (isLoading) {
      return (
        <p className='search-form__message search-form__message--loading' role='status'>
          Пошук турів триває...
        </p>
      );
    }

    if (error) {
      return (
        <p className='search-form__message search-form__message--error' role='alert'>
          {error}
        </p>
      );
    }

    if (shouldShowEmptyState) {
      return (
        <p className='search-form__message search-form__message--empty'>
          За вашим запитом турів не знайдено
        </p>
      );
    }

    return null;
  })();

  const handleSearch = async (countryId: string) => {
    setActiveCountryId(countryId);
    setHasSearched(true);
    setError(null);

    if (searchResults[countryId]) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await startSearchPrices(countryId);
      const { token, waitUntil } = (await response.json()) as StartSearchResponse;

      const prices = await fetchPricesWithPolling(token, waitUntil);
      const normalizedResult = normalizeSearchResult(token, prices);

      setSearchResults((prev) => ({
        ...prev,
        [countryId]: normalizedResult,
      }));
      setError(null);
    } catch (err) {
      if (err instanceof Response) {
        let payload: ApiErrorResponse = {};

        try {
          payload = (await err.json()) as ApiErrorResponse;
        } catch {
          // Ignore JSON parse errors and use fallback message below.
        }

        setError(
          payload.message ?? 'Сталася помилка при запуску пошуку турів. Спробуйте знову.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Сталася помилка при пошуку турів. Спробуйте пізніше.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='app-container'>
      <SearchForm
        onSubmit={handleSearch}
        isSearching={isLoading}
        footer={statusMessage}
      />
    </div>
  );
}

export default App;