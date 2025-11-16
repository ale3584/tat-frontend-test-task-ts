import { useState, type ReactNode } from 'react';
import type { GeoEntity } from '../types/geo.ts';
import { SearchInput } from './SearchInput.tsx';
import type { Country, City, Hotel } from '../types/geo.ts';
import { Toast } from './Toast.tsx';

interface SearchFormProps {
  onSubmit: (countryId: string) => void;
  isSearching: boolean;
  footer?: ReactNode;
  isSubmitDisabled?: boolean;
}

const getCountryId = (geo: GeoEntity): string | undefined => {
  if (geo.type === 'country') {
    return (geo as Country).id;
  }
  if (geo.type === 'city') {
    return (geo as City).countryId;
  }
  if (geo.type === 'hotel') {
    return (geo as Hotel).countryId;
  }
  return undefined;
};

export const SearchForm: React.FC<SearchFormProps> = ({
  onSubmit,
  isSearching,
  footer,
  isSubmitDisabled = false,
}) => {
  const [selectedGeo, setSelectedGeo] = useState<GeoEntity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeoSelect = (item: GeoEntity | null) => {
    setSelectedGeo(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitDisabled) return;

    if (!selectedGeo) {
      setError('Будь ласка, оберіть напрямок для пошуку.');
      return;
    }

    const countryIdToSearch = getCountryId(selectedGeo);

    if (countryIdToSearch) {
      onSubmit(countryIdToSearch);
    } else {
      setError('Не вдалося визначити країну для пошуку.');
    }
  };

  const isSearchEnabled = !!selectedGeo && !isSubmitDisabled;

  return (
    <section className='search-section'>
      <div className='search-form__card'>
        <h2 className='search-form__title'>Форма пошуку турів</h2>
        <form onSubmit={handleSubmit} className='search-form'>
          <SearchInput
            name='searchFrom'
            placeholder='Оберіть напрямок подорожі'
            onSelect={handleGeoSelect}
            selectedItem={selectedGeo}
          />
          <button
            type='submit'
            className='search-form__submit-btn'
            disabled={!isSearchEnabled}
          >
            {isSearching ? 'Пошук...' : 'Знайти'}
          </button>
        </form>
        {error && <Toast message={error} onClose={() => setError(null)} />}
        {footer && <div className='search-form__footer'>{footer}</div>}
      </div>
    </section>
  );
};
