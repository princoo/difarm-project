/**
 * Location hierarchy: Country / Province / District / Sector / Cell / Village
 * African countries + Rwanda full data (loaded async).
 */
export interface LocationOption {
  id: string;
  name: string;
}

export type VillageOption = LocationOption;
export interface CellOption extends LocationOption {
  villages: VillageOption[];
}
export interface SectorOption extends LocationOption {
  cells: CellOption[];
}
export interface DistrictOption extends LocationOption {
  sectors: SectorOption[];
}
export interface ProvinceOption extends LocationOption {
  districts: DistrictOption[];
}
export interface CountryOption extends LocationOption {
  provinces: ProvinceOption[];
}

export { AFRICAN_COUNTRIES } from "./africanCountries";
export { loadRwandaHierarchy } from "./rwandaDataLoader";
