import type { LivestockSpecies, LivestockStatus } from "@/hooks/api/livestock";

export const LIVESTOCK_SPECIES: LivestockSpecies[] = [
  "GOAT",
  "SHEEP",
  "PIG",
  "POULTRY",
  "RABBIT",
  "OTHER",
];

export const LIVESTOCK_STATUSES: LivestockStatus[] = [
  "HEALTHY",
  "SICK",
  "SOLD",
  "PROCESSED",
  "DECEASED",
];

const SPECIES_LABELS: Record<string, string> = {
  GOAT: "Goat",
  SHEEP: "Sheep",
  PIG: "Pig",
  POULTRY: "Poultry",
  RABBIT: "Rabbit",
  OTHER: "Other",
};

const SPECIES_PLURALS: Record<string, string> = {
  GOAT: "Goats",
  SHEEP: "Sheep",
  PIG: "Pigs",
  POULTRY: "Poultry",
  RABBIT: "Rabbits",
  OTHER: "Other animals",
};

const SPECIES_EMOJI: Record<string, string> = {
  GOAT: "🐐",
  SHEEP: "🐑",
  PIG: "🐖",
  POULTRY: "🐔",
  RABBIT: "🐇",
  OTHER: "🐾",
};

export function speciesLabel(species?: string) {
  return SPECIES_LABELS[String(species || "").toUpperCase()] || "Other";
}

export function speciesPlural(species?: string) {
  return SPECIES_PLURALS[String(species || "").toUpperCase()] || "Other animals";
}

export function speciesEmoji(species?: string) {
  return SPECIES_EMOJI[String(species || "").toUpperCase()] || "🐾";
}

export function statusLabel(status?: string) {
  switch (status) {
    case "HEALTHY":
      return "Healthy";
    case "SICK":
      return "Sick (under treatment)";
    case "SOLD":
      return "Sold";
    case "PROCESSED":
      return "Processed for meat";
    case "DECEASED":
      return "Deceased";
    default:
      return "Unknown";
  }
}

export function statusColor(status?: string) {
  switch (status) {
    case "HEALTHY":
      return "bg-success-light text-success dark:bg-success-dark-light dark:text-success";
    case "SICK":
      return "bg-warning-light text-warning dark:bg-warning-dark-light dark:text-warning";
    case "SOLD":
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    case "PROCESSED":
      return "bg-info-light text-info dark:bg-info-dark-light dark:text-info";
    case "DECEASED":
      return "bg-danger-light text-danger dark:bg-danger-dark-light dark:text-danger";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }
}

export function statusDotColor(status?: string) {
  switch (status) {
    case "HEALTHY":
      return "#22c55e";
    case "SICK":
      return "#f59e0b";
    case "SOLD":
      return "#9ca3af";
    case "PROCESSED":
      return "#3b82f6";
    case "DECEASED":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export function genderLabel(gender?: string, species?: string) {
  const male = String(gender || "").toUpperCase() === "MALE";
  switch (String(species || "").toUpperCase()) {
    case "GOAT":
      return male ? "Buck (male)" : "Doe (female)";
    case "SHEEP":
      return male ? "Ram (male)" : "Ewe (female)";
    case "PIG":
      return male ? "Boar (male)" : "Sow (female)";
    case "POULTRY":
      return male ? "Cock (male)" : "Hen (female)";
    default:
      return male ? "Male" : "Female";
  }
}
