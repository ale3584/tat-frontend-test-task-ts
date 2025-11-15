import { useState, useEffect } from 'react';
import { SearchForm } from '../components/SearchForm';
import { TourCard } from '../components/TourCard';
import { normalizeSearchResult } from '../services/normalize';
import { fetchPricesWithPolling } from '../services/fetchPrices';

import { startSearchPrices, getHotels, getCountries } from '../api';

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

  const [hotelsCache, setHotelsCache] = useState<
    Record<string, Record<string, Hotel>>
  >({});
  const [countries, setCountries] = useState<Record<string, Country>>({});

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

  const handleSearch = async (countryId: string) => {
    setActiveCountryId(countryId);
    setHasSearched(true);
    setError(null);

    if (searchResults[countryId]) return;

    setIsLoading(true);

    try {
      const response = await startSearchPrices(countryId);
      const { token, waitUntil } =
        (await response.json()) as StartSearchResponse;

      const prices = await fetchPricesWithPolling(token, waitUntil);
      const normalizedResult = normalizeSearchResult(token, prices);

      setSearchResults((prev) => ({
        ...prev,
        [countryId]: normalizedResult,
      }));

      getHotelsForCountry(countryId);
    } catch (err) {
      if (err instanceof Response) {
        let payload: ApiErrorResponse = {};

        try {
          payload = (await err.json()) as ApiErrorResponse;
        } catch {}

        setError(
          payload.message ??
            'Сталася помилка при запуску пошуку турів. Спробуйте знову.'
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
