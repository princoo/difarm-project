import type { LivestockSpecies } from "@/hooks/api/livestock";
import {
  LIVESTOCK_SPECIES,
  speciesEmoji,
  speciesLabel,
} from "../livestock/livestockMeta";

/**
 * Health forms pick a concrete animal type (cattle, goat, sheep, …). Each type
 * drives its own animal list so the user only sees matching records.
 */
export type AnimalType = "CATTLE" | LivestockSpecies;

export const ANIMAL_TYPE_VALUES = [
  "CATTLE",
  ...LIVESTOCK_SPECIES,
] as const satisfies readonly AnimalType[];

export const ANIMAL_TYPE_OPTIONS = ANIMAL_TYPE_VALUES.map((value) => ({
  value,
  label: value === "CATTLE" ? "Cattle" : speciesLabel(value),
}));

type Option = { value: string; label: string };

const activeLivestock = (a: any) =>
  a.status !== "SOLD" &&
  a.status !== "PROCESSED" &&
  a.status !== "DECEASED";

export const isCattleType = (type?: string) =>
  String(type || "").toUpperCase() === "CATTLE";

export const isLivestockType = (type?: string) => !isCattleType(type);

export const animalPayloadKey = (type: AnimalType) =>
  isCattleType(type) ? "cattleId" : "livestockId";

export const buildCattleOptions = (rows: any[] = []): Option[] =>
  (rows ?? [])
    .filter((c: any) => c.status !== "SOLD" && c.status !== "PROCESSED")
    .map((c: any) => ({
      value: c.id,
      label: c.breed ? `${c.tagNumber} (${c.breed})` : c.tagNumber,
    }));

export const buildLivestockOptions = (
  rows: any[] = [],
  species?: AnimalType
): Option[] =>
  (rows ?? [])
    .filter(activeLivestock)
    .filter(
      (a: any) =>
        !species ||
        isCattleType(species) ||
        String(a.species).toUpperCase() === String(species).toUpperCase()
    )
    .map((a: any) => ({
      value: a.id,
      label: a.breed
        ? `${speciesEmoji(a.species)} ${a.tagNumber} (${a.breed})`
        : `${speciesEmoji(a.species)} ${a.tagNumber}`,
    }));

/** Options for the currently selected animal type. */
export const buildAnimalOptions = (
  animalType?: AnimalType | string,
  cattleRows: any[] = [],
  livestockRows: any[] = []
): Option[] => {
  const type = (String(animalType || "CATTLE").toUpperCase() ||
    "CATTLE") as AnimalType;
  return isCattleType(type)
    ? buildCattleOptions(cattleRows)
    : buildLivestockOptions(livestockRows, type);
};

/** Concrete type stored on a vaccination or medicine-usage row. */
export const animalTypeOf = (row: any): AnimalType => {
  if (row?.livestockId || row?.livestock) {
    const species = String(row?.livestock?.species || "OTHER").toUpperCase();
    return (ANIMAL_TYPE_VALUES.includes(species as AnimalType)
      ? species
      : "OTHER") as AnimalType;
  }
  if (row?.cattleId || row?.cattle) {
    return "CATTLE";
  }
  return "CATTLE";
};

/** Tag number of the animal, whichever side is set. */
export const animalTag = (row: any): string =>
  row?.cattle?.tagNumber || row?.livestock?.tagNumber || "—";

/** Species for other livestock, breed for cattle. */
export const animalDetail = (row: any): string => {
  if (row?.livestock) return speciesLabel(row.livestock.species);
  return row?.cattle?.breed || "Cattle";
};

export const animalTypeLabel = (type?: string) => {
  const key = String(type || "CATTLE").toUpperCase();
  return (
    ANIMAL_TYPE_OPTIONS.find((o) => o.value === key)?.label ?? "Animal"
  );
};
