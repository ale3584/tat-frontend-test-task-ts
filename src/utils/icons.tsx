import type { GeoEntity } from '../types/geo.ts';
import { GlobeIcon } from './icons/GlobeIcon.tsx';
import { CityIcon } from './icons/CityIcon.tsx';
import { HotelIcon } from './icons/HotelIcon.tsx';


export const getCountryFlag = (flagUrl: string, name: string): React.ReactElement => {
    return flagUrl 
        ? <img src={flagUrl} alt={`${name} flag`} className="geo-search__flag" /> 
        : <GlobeIcon />;
};

export const getGeoIcon = (entity: GeoEntity | null): React.ReactElement | null => {
    if (!entity) return null;

    if (entity.type === 'country') {
        return getCountryFlag(entity.flag, entity.name);
    }
    if (entity.type === 'city') return <CityIcon />;
    if (entity.type === 'hotel') return <HotelIcon />;
    
    return null;
}