import { useState, useEffect, useRef } from 'react';
import { SearchForm } from '../components/SearchForm';
import { TourCard } from '../components/TourCard';
import { normalizeSearchResult } from '../services/normalize';
import { fetchPricesWithPolling } from '../services/fetchPrices';

import {
  startSearchPrices,
  getHotels,
  getCountries,
  stopSearchPrices,
} from '../api';

import type { Hotel, Country } from '../types/geo';
import type {
  ApiErrorResponse,
  SearchPrice,
  SearchResultState,
  StartSearchResponse,
} from '../types/search';

import '../styles/main.scss';

export default function SearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<
    Record<string, SearchResultState>
  >({});
  const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);

  const [hotelsCache, setHotelsCache] = useState<
    Record<string, Record<string, Hotel>>
  >({});
  const [countries, setCountries] = useState<Record<string, Country>>({});
  const activeSearchRef = useRef<{
    token: string;
    controller: AbortController;
  } | null>(null);
  const submitLockIdRef = useRef(0);

  const currentResult = activeCountryId
    ? searchResults[activeCountryId]
    : undefined;

  const shouldShowEmptyState =
    hasSearched &&
    !isLoading &&
    !error &&
    currentResult?.priceIds?.length === 0;

  const statusMessage = (() => {
    if (isLoading) {
      return (
        <p className='search-form__message search-form__message--loading'>
          Пошук турів триває...
        </p>
      );
    }

    if (error) {
      return (
        <p className='search-form__message search-form__message--error'>
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

  useEffect(() => {
    const loadCountries = async () => {
      const resp = await getCountries();
      const data: Record<string, Country> = await resp.json();
      setCountries(data);
    };

    loadCountries();
  }, []);

  const isAbortError = (err: unknown): err is DOMException =>
    err instanceof DOMException && err.name === 'AbortError';

  const cancelActiveSearch = async () => {
    const activeSearch = activeSearchRef.current;
    if (!activeSearch) return;

    activeSearch.controller.abort();

    try {
      await stopSearchPrices(activeSearch.token);
    } catch {
      // Ignore errors when stopping previous searches
    } finally {
      if (activeSearchRef.current?.token === activeSearch.token) {
        activeSearchRef.current = null;
      }
    }
  };

  const handleSearchError = async (err: unknown) => {
    if (err instanceof Response) {
      let payload: ApiErrorResponse = {};

      try {
        payload = (await err.json()) as ApiErrorResponse;
      } catch {}

      setError(
        payload.message ??
          'Сталася помилка при запуску пошуку турів. Спробуйте знову.'
      );
      return;
    }

    if (err instanceof Error) {
      setError(err.message);
      return;
    }

    setError('Сталася помилка при пошуку турів. Спробуйте пізніше.');
  };

  const releaseSubmitLock = (lockId: number) => {
    if (submitLockIdRef.current === lockId) {
      setIsSubmitLocked(false);
    }
  };

  const startSearchCycle = async (countryId: string) => {
    setIsLoading(true);

    const abortController = new AbortController();
    let startPayload: StartSearchResponse;

    try {
      const response = await startSearchPrices(countryId);
      startPayload = (await response.json()) as StartSearchResponse;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }

    const { token, waitUntil } = startPayload;
    activeSearchRef.current = {
      token,
      controller: abortController,
    };
    try {
      const prices = await fetchPricesWithPolling(token, waitUntil, {
        signal: abortController.signal,
      });

      if (activeSearchRef.current?.token !== token) {
        return;
      }

      const normalizedResult = normalizeSearchResult(token, prices);

      setSearchResults((prev) => ({
        ...prev,
        [countryId]: normalizedResult,
      }));

      getHotelsForCountry(countryId);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      throw err;
    } finally {
      if (activeSearchRef.current?.token === token) {
        activeSearchRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const runSearchFlow = async (countryId: string) => {
    submitLockIdRef.current += 1;
    const lockId = submitLockIdRef.current;
    setIsSubmitLocked(true);

    try {
      await cancelActiveSearch();
      await startSearchCycle(countryId);
    } catch (err) {
      await handleSearchError(err);
    } finally {
      releaseSubmitLock(lockId);
    }
  };

  const handleSearch = (countryId: string) => {
    setActiveCountryId(countryId);
    setHasSearched(true);
    setError(null);

    setSearchResults((prev) => {
      if (!prev[countryId]) return prev;

      const next = { ...prev };
      delete next[countryId];
      return next;
    });

    void runSearchFlow(countryId);
  };

  const handleCountrySelectionChange = (countryId: string | null) => {
    if (!isSubmitLocked) return;

    const isDifferentCountry =
      countryId && activeCountryId && countryId !== activeCountryId;

    if (!isDifferentCountry) return;

    setIsSubmitLocked(false);
    setIsLoading(false);
    setError(null);

    setSearchResults((prev) => {
      if (!activeCountryId || !prev[activeCountryId]) {
        return prev;
      }

      const next = { ...prev };
      delete next[activeCountryId];
      return next;
    });

    void cancelActiveSearch();
  };

  const getHotelsForCountry = async (countryId: string) => {
    if (hotelsCache[countryId]) return hotelsCache[countryId];

    const resp = await getHotels(countryId);
    const hotelsData: Record<string, Hotel> = await resp.json();
    setHotelsCache((prev) => ({ ...prev, [countryId]: hotelsData }));
    return hotelsData;
  };

  const getToursForRender = () => {
    if (!currentResult || !activeCountryId) return [];

    const hotels = hotelsCache[activeCountryId];
    if (!hotels) return [];

    return Object.values(currentResult.pricesById)
      .map((price) => {
        const hotel = hotels[price.hotelID];
        if (!hotel) return null;

        return {
          price,
          hotel,
          country: countries[hotel.countryId],
        };
      })
      .filter(
        (
          item
        ): item is { price: SearchPrice; hotel: Hotel; country: Country } =>
          item !== null
      );
  };

  const tours = getToursForRender();

  return (
    <div className='app-container'>
      <SearchForm
        onSubmit={handleSearch}
        isSearching={isLoading}
        isSubmitDisabled={isSubmitLocked}
        onSelectedCountryChange={handleCountrySelectionChange}
        footer={statusMessage}
      />

      {currentResult && (
        <div className='tours-grid'>
          {tours.map(({ price, hotel, country }) => (
            <TourCard
              key={price.id}
              price={price}
              hotel={hotel}
              country={country}
            />
          ))}
        </div>
      )}
    </div>
  );
}
