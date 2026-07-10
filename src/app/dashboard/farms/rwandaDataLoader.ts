/**
 * Fetches Rwanda's full administrative hierarchy (provinces, districts, sectors, cells, villages)
 * from GitHub and transforms it to our location hierarchy format.
 */

const RWANDA_JSON_URL =
  "https://raw.githubusercontent.com/ShejaEddy/Rwanda-Provinces-Districts-Sectors-Cell-Villages/main/data.json";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const PROVINCE_NAME_MAP: Record<string, string> = {
  East: "Eastern Province",
  Eastern: "Eastern Province",
  West: "Western Province",
  Western: "Western Province",
  North: "Northern Province",
  Northern: "Northern Province",
  South: "Southern Province",
  Southern: "Southern Province",
  Kigali: "City of Kigali",
};

export interface VillageOption {
  id: string;
  name: string;
}
export interface CellOption {
  id: string;
  name: string;
  villages: VillageOption[];
}
export interface SectorOption {
  id: string;
  name: string;
  cells: CellOption[];
}
export interface DistrictOption {
  id: string;
  name: string;
  sectors: SectorOption[];
}
export interface ProvinceOption {
  id: string;
  name: string;
  districts: DistrictOption[];
}
export interface CountryOption {
  id: string;
  name: string;
  provinces: ProvinceOption[];
}

interface GhCell {
  type: string;
  name: string;
  villages: string[];
}
interface GhSector {
  type: string;
  name: string;
  cells: GhCell[];
}
interface GhDistrict {
  type: string;
  name: string;
  sectors: GhSector[];
}
interface GhProvince {
  type: string;
  name: string;
  districts: GhDistrict[];
}
interface GhData {
  items: GhProvince[];
}

let cachedRwanda: CountryOption | null = null;

function transformRwandaData(gh: GhData): CountryOption {
  const provinces: ProvinceOption[] = (gh.items || []).map((p) => {
    const provinceName = PROVINCE_NAME_MAP[p.name] || p.name;
    const districts: DistrictOption[] = (p.districts || []).map((d) => {
      const districtId = slugify(d.name);
      const sectors: SectorOption[] = (d.sectors || []).map((s) => {
        const sectorId = slugify(s.name);
        const cells: CellOption[] = (s.cells || []).map((c) => {
          const cellId = slugify(c.name);
          const villages: VillageOption[] = (c.villages || []).map((v, i) => ({
            id: slugify(v) + "-" + i,
            name: v,
          }));
          return { id: cellId, name: c.name, villages };
        });
        return { id: sectorId, name: s.name, cells };
      });
      return { id: districtId, name: d.name, sectors };
    });
    return {
      id: slugify(provinceName),
      name: provinceName,
      districts,
    };
  });

  return {
    id: "rwanda",
    name: "Rwanda",
    provinces,
  };
}

export async function loadRwandaHierarchy(): Promise<CountryOption> {
  if (cachedRwanda) return cachedRwanda;
  const res = await fetch(RWANDA_JSON_URL);
  if (!res.ok) throw new Error("Failed to load Rwanda location data");
  const json: GhData = await res.json();
  cachedRwanda = transformRwandaData(json);
  return cachedRwanda;
}
