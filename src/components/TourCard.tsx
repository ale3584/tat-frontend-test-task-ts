import type { Hotel } from '../types/geo';
import type { SearchPrice } from '../types/search';

interface TourCardProps {
  hotel: Hotel;
  price: SearchPrice;
}

export const TourCard: React.FC<TourCardProps> = ({ hotel, price }) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('uk-UA');
  };

  return (
    <div className='tour-card'>
      <img className='tour-card__image' src={hotel.img} alt={hotel.name} />
      <h3 className='tour-card__title'>{hotel.name}</h3>
      <div className='tour-card__location'>
        <img
          src={`https://flagcdn.com/w20/${hotel.countryId === '43' ? 'eg' : hotel.countryId === '115' ? 'tr' : 'gr'}.png`}
          className='tour-card__flag'
        />
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
      <a href='#' className='tour-card__link'>
        Відкрити ціну
      </a>
    </div>
  );
};
