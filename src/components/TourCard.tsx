import type { Hotel, Country } from '../types/geo';
import type { SearchPrice } from '../types/search';
import { Link } from 'react-router-dom';

interface TourCardProps {
  hotel: Hotel;
  price: SearchPrice;
  country: Country;
  searchQuery?: string;
}

export const TourCard: React.FC<TourCardProps> = ({
  hotel,
  price,
  country,
  searchQuery,
}) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('uk-UA');
  };

  const buildDetailsLink = () => {
    const params = new URLSearchParams(searchQuery || undefined);
    params.set('hotel', price.hotelID);
    const queryString = params.toString();

    return queryString ? `/tour/${price.id}?${queryString}` : `/tour/${price.id}`;
  };

  return (
    <div className='tour-card'>
      <img className='tour-card__image' src={hotel.img} alt={hotel.name} />
      <h3 className='tour-card__title'>{hotel.name}</h3>
      <div className='tour-card__location'>
        <img src={country.flag} className='tour-card__flag' />
        <span>
          {hotel.countryName}, {hotel.cityName}
        </span>
      </div>
      <p className='tour-card__label'>Старт туру</p>
      <p className='tour-card__dates'>
        {formatDate(price.startDate)} - {formatDate(price.endDate)}
      </p>
      <p className='tour-card__price'>
        {price.amount.toLocaleString('uk-UA')} {price.currency}
      </p>
      <Link className='tour-card__link' to={buildDetailsLink()}>
        Відкрити ціну
      </Link>
    </div>
  );
};
