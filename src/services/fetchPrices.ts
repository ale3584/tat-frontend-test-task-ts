import type { SearchPrice, SearchPricesResponse } from '../types/search';
import type { ApiErrorResponse } from '../types/search';
import { getSearchPrices } from '../api';
import { waitFor, getDefaultRetryTimestamp } from './time';

const MAX_ERROR_RETRIES = 2;

interface FetchPricesOptions {
  signal?: AbortSignal;
}

const isAbortError = (error: unknown): error is DOMException =>
  error instanceof DOMException && error.name === 'AbortError';

export const fetchPricesWithPolling = async (
  token: string,
  initialWaitUntil?: string,
  options: FetchPricesOptions = {}
): Promise<Record<string, SearchPrice>> => {
  let attempts = 0;
  let nextWaitUntil = initialWaitUntil;
  const { signal } = options;

  const ensureNotAborted = () => {
    if (signal?.aborted) {
      throw new DOMException('Search was aborted', 'AbortError');
    }
  };

  while (true) {
    ensureNotAborted();

    if (nextWaitUntil) {
      await waitFor(nextWaitUntil, signal);
      nextWaitUntil = undefined;
    }

    ensureNotAborted();

    try {
      const response = await getSearchPrices(token);
      const data = (await response.json()) as SearchPricesResponse;

      return data.prices ?? {};
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      if (error instanceof Response) {
        let payload: ApiErrorResponse = {};

        try {
          payload = (await error.json()) as ApiErrorResponse;
        } catch {}

        if (error.status === 425) {
          nextWaitUntil = payload.waitUntil;
          continue;
        }

        attempts++;
        if (attempts > MAX_ERROR_RETRIES) {
          throw new Error(
            payload.message ?? 'Не вдалося отримати результати пошуку турів.'
          );
        }

        nextWaitUntil = payload.waitUntil ?? getDefaultRetryTimestamp();
        continue;
      }

      attempts++;
      if (attempts > MAX_ERROR_RETRIES) {
        throw new Error('Сталася помилка мережі. Спробуйте пізніше.');
      }

      nextWaitUntil = getDefaultRetryTimestamp();
    }
  }
};