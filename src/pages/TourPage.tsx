import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getPrice, getHotel } from '../api';
import type { SearchPrice } from '../types/search';
import type { Hotel } from '../types/geo';
import { formatDate } from '../utils/formatDate';
import { GlobeIcon } from '../utils/icons/GlobeIcon';
import { CityIcon } from '../utils/icons/CityIcon';
import { getServiceIcon, getServiceName } from '../utils/getServiceIcon';
import { CalendarIcon } from '../utils/icons/CalendarIcon';

export default function TourPage() {
  const { priceId } = useParams<{ priceId: string }>();
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get('hotel');
  const backParams = new URLSearchParams(searchParams);
  backParams.delete('hotel');
  const backQuery = backParams.toString();
  const backLinkHref = backQuery ? `/?${backQuery}` : '/';

  const [price, setPrice] = useState<SearchPrice | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!priceId || !hotelId) {
      setError('Не вдалося визначити тур для перегляду.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const priceResp = await getPrice(priceId);
        const priceData: SearchPrice = await priceResp.json();
        setPrice(priceData);

        const hotelResp = await getHotel(Number(hotelId));
        const hotelData: Hotel = await hotelResp.json();
        setHotel(hotelData);
      } catch {
        setError('Не вдалося завантажити дані туру.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [priceId, hotelId]);

  if (loading) return <p className='tour-page__loading'>Завантаження...</p>;
  if (error || !price || !hotel)
    return <p className='tour-page__error'>{error ?? 'Щось пішло не так.'}</p>;

  return (
    <div className='tour-page'>
      <Link to={backLinkHref} className='tour-page__back'>
        ← Назад
      </Link>

      <div className='tour-page__card'>
        <h1 className='tour-page__title'>{hotel.name}</h1>

        <div className='tour-page__location'>
          <span className='tour-page__loc-item'>
            <GlobeIcon />
            {hotel.countryName}
          </span>

          <span className='tour-page__loc-item'>
            <CityIcon />
            {hotel.cityName}
          </span>
        </div>

        <img className='tour-page__image' src={hotel.img} alt={hotel.name} />

        <h3 className='tour-page__section-title'>Опис</h3>

        <p className='tour-page__description'>
          {hotel.description || 'Опис відсутній.'}
        </p>

        {hotel.services && (
          <>
            <h3 className='tour-page__section-title'>Сервіси</h3>
            <ul className='tour-page__services'>
              {Object.entries(hotel.services)
                .filter(([_, value]) => value === 'yes')
                .map(([key]) => {
                  const label = getServiceName(key);
                  if (!label) return null;

                  return (
                    <li key={key} className='tour-page__service-item'>
                      {getServiceIcon(key)}
                      <span>{label}</span>
                    </li>
                  );
                })}
            </ul>
          </>
        )}

        <hr className='tour-page__divider' />

        <div className='tour-page__info-block'>
          <p className='tour-page__date'>
            <CalendarIcon />
            {formatDate(price.startDate)} — {formatDate(price.endDate)}
          </p>

          <div className='tour-page__info-row'>
            <p className='tour-page__amount'>
              {price.amount.toLocaleString('uk-UA')}{' '}
              {price.currency.toLowerCase()}
            </p>

            <button className='tour-page__button'>Відкрити ціну</button>
          </div>
        </div>
      </div>
    </div>
  );
}
