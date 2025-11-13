export interface Country {
    id: string;
    name: string;
    flag: string;
}

export interface City {
    id: number;
    name: string;
    countryId: string;
}

export interface Hotel {
    id: number;
    name: string;
    img: string;
    cityId: number;
    cityName: string;
    countryId: string;
    countryName: string;
    description?: string;
    services?: Record<string, string>;
}

interface CountryGeo extends Country {
    type: 'country';
}

interface CityGeo extends City {
    type: 'city';
}

interface HotelGeo extends Hotel {
    type: 'hotel';
}

export type GeoEntity = CountryGeo | CityGeo | HotelGeo;

export type CountriesMap = Record<string, Country>;

export type HotelsMap = Record<string, Hotel>;

export type GeoResponseMap = Record<string, GeoEntity>;

export type GeoType = 'country' | 'city' | 'hotel';