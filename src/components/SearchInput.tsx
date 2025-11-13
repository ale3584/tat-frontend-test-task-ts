import { useState, useEffect, useRef, useCallback } from 'react';
import type { GeoEntity, CountriesMap, GeoType } from '../types/geo.ts';
import { searchGeo, getCountries } from '../api.ts';
import { getGeoIcon } from '../utils/icons.tsx';
import { ClearIcon } from '../utils/icons/ClearIcon.tsx';

interface SearchInputProps {
  placeholder: string;
  onSelect: (item: GeoEntity | null) => void;
  selectedItem: GeoEntity | null;
  name?: string;
  disabled?: boolean;
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  onSelect,
  selectedItem,
  name = 'searchDirection',
  disabled = false,
}) => {
  const [query, setQuery] = useState(selectedItem?.name || '');
  const [results, setResults] = useState<GeoEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 300);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadInitialCountries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getCountries();
      const data: CountriesMap = await response.json();

      const items = Object.values(data).map((country) => ({
        ...country,
        type: 'country',
      })) as GeoEntity[];

      setResults(items);
      setHighlightedIndex(items.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Error loading initial countries:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchResults = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await searchGeo(searchQuery);
      const data = await response.json();

      const items = Object.values(data) as GeoEntity[];
      setResults(items);
      setHighlightedIndex(items.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredFetchResults = useCallback(
    async (searchQuery: string, requiredType: GeoType) => {
      setIsLoading(true);
      try {
        const response = await searchGeo(searchQuery);
        const data = await response.json();

        let items = Object.values(data) as GeoEntity[];

        const queryLower = searchQuery.toLowerCase();
        
        items = items.filter(
            (item) => item.type === requiredType && 
            item.name.toLowerCase().includes(queryLower)
        );

        setResults(items);
        setHighlightedIndex(items.length > 0 ? 0 : -1);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedItem && selectedItem.name !== query) {
      setQuery(selectedItem.name);
    }
  }, [selectedItem, query]);

  useEffect(() => {
    if (!selectedItem) {
      loadInitialCountries();
    }
  }, [selectedItem, loadInitialCountries]);

  useEffect(() => {
    const currentQueryLength = debouncedQuery.length;
    if (currentQueryLength > 0 && debouncedQuery !== selectedItem?.name) {
      if (currentQueryLength >= 2) {
        fetchResults(debouncedQuery);
      } else {
        loadInitialCountries();
      }
    } else if (currentQueryLength === 0 && selectedItem) {
      loadInitialCountries();
    }
  }, [debouncedQuery, selectedItem, fetchResults, loadInitialCountries]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: GeoEntity) => {
    setQuery(item.name);
    onSelect(item);
    setResults([]);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (selectedItem && newQuery !== selectedItem.name) {
      onSelect(null);
    }
  };

  const handleFocus = () => {
    setIsDropdownOpen(true);

    if (query.length === 0) {
      loadInitialCountries();
      return;
    }

    switch (selectedItem?.type) {
      case 'country':
        loadInitialCountries();
        break;
      case 'city':
        filteredFetchResults(query, 'city');
        break;
      case 'hotel':
        filteredFetchResults(query, 'hotel');
        break;
      default:
        if (query.length > 0) {
          fetchResults(query);
        }
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    onSelect(null);
    setResults([]);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        if (highlightedIndex > -1) {
          e.preventDefault();
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const shouldShowDropdown =
    isDropdownOpen &&
    (isLoading ||
      results.length > 0 ||
      query.length >= 2 ||
      query.length === 0);

  return (
    <div
      className='search-container'
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <div className='search__input-wrapper'>
        <input
          ref={inputRef}
          type='text'
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          name={name}
          autoComplete='off'
          aria-label='Оберіть напрямок подорожі'
          className='search__input'
          disabled={disabled}
        />

        {query.length > 0 && (
          <button
            type='button'
            className='search__clear-btn'
            onClick={handleClear}
          >
            <ClearIcon className='search__clear-icon' />
          </button>
        )}
      </div>

      {shouldShowDropdown && (
        <div className='search__dropdown'>
          {isLoading && <div className='search__status'>Завантаження...</div>}

          {!isLoading && results.length === 0 && query.length >= 2 && (
            <div className='search__status'>Нічого не знайдено.</div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className='search__results-list'>
              {results.map((item, index) => (
                <li
                  key={`${item.type}-${String(item.id)}`}
                  className={`search__item ${
                    index === highlightedIndex
                      ? 'search__item--highlighted'
                      : ''
                  }`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className='search__icon-wrapper'>{getGeoIcon(item)}</div>
                  <div className='search__text-content'>
                    <span className='search__name'>{item.name}</span>
                    <span className={`search__type search__type--${item.type}`}>
                      (
                      {item.type === 'country'
                        ? 'Країна'
                        : item.type === 'city'
                          ? 'Місто'
                          : 'Готель'}
                      )
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
