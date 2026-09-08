import { z } from "zod";

export const AGRICULTURE_FARM_TYPES = [
  "Row Crops",
  "Vegetables",
  "Fruits & Orchard",
  "Mixed Crops",
  "Greenhouse",
  "Other",
] as const;

export const CROP_OPTIONS = [
  "Maize",
  "Beans",
  "Irish Potato",
  "Sweet Potato",
  "Cassava",
  "Rice",
  "Wheat",
  "Sorghum",
  "Tomatoes",
  "Cabbage",
  "Onions",
  "Banana",
  "Coffee",
  "Tea",
  "Other",
] as const;

export const IRRIGATION_TYPES = [
  "Rain-fed",
  "Drip irrigation",
  "Sprinkler",
  "Furrow / flood",
  "Manual watering",
  "Other",
] as const;

export const SOIL_TYPES = [
  "Clay",
  "Sandy",
  "Loam",
  "Volcanic",
  "Mixed",
  "Unknown",
] as const;

export const agricultureOnboardingSchema = z.object({
  name: z.string().min(3, "Farm name is required (min 3 characters)"),
  registrationNo: z.string().optional(),
  type: z.string().min(1, "Select farm type"),
  yearEstablished: z.string().optional(),
  description: z.string().optional(),

  locationText: z.string().min(3, "Complete the location section"),

  size: z.string().min(1, "Total land size is required"),
  cultivatedArea: z.string().optional(),
  waterSource: z.string().optional(),
  hasElectricity: z.boolean().optional(),
  irrigationType: z.string().optional(),
  soilType: z.string().optional(),
  landmarks: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  primaryCrops: z.array(z.string()).min(1, "Select at least one crop"),
  fieldCountEstimate: z.string().optional(),

  contactPhone: z.string().min(5, "Farm contact phone is required"),
  contactEmail: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  emergencyContact: z.string().optional(),
});

export type AgricultureOnboardingValues = z.infer<typeof agricultureOnboardingSchema>;

export const AG_ONBOARDING_STEPS = [
  { id: 1, key: "identity", title: "Farm identity", subtitle: "Name, type & overview" },
  { id: 2, key: "location", title: "Location", subtitle: "Address & geography" },
  { id: 3, key: "land", title: "Land & irrigation", subtitle: "Size, water & soil" },
  { id: 4, key: "crops", title: "Crop profile", subtitle: "Crops & fields" },
  { id: 5, key: "contact", title: "Contact & review", subtitle: "Reach you & submit" },
] as const;

export function buildAgricultureFarmPayload(
  values: AgricultureOnboardingValues,
  ownerId?: string
) {
  const parseOptionalInt = (v?: string) => {
    if (!v?.trim()) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };
  const parseOptionalFloat = (v?: string) => {
    if (!v?.trim()) return undefined;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    name: values.name.trim(),
    location: values.locationText.trim(),
    size: parseFloat(values.size),
    type: values.type,
    farmCategory: "AGRICULTURE" as const,
    ownerId,
    registrationNo: values.registrationNo?.trim() || undefined,
    description: values.description?.trim() || undefined,
    yearEstablished: parseOptionalInt(values.yearEstablished),
    cultivatedArea: parseOptionalFloat(values.cultivatedArea),
    waterSource: values.waterSource || undefined,
    hasElectricity: values.hasElectricity ?? false,
    irrigationType: values.irrigationType || undefined,
    soilType: values.soilType || undefined,
    landmarks: values.landmarks?.trim() || undefined,
    latitude: values.latitude?.trim() || undefined,
    longitude: values.longitude?.trim() || undefined,
    primaryCrops: values.primaryCrops.join(", "),
    fieldCountEstimate: parseOptionalInt(values.fieldCountEstimate),
    contactPhone: values.contactPhone.trim(),
    contactEmail: values.contactEmail?.trim() || undefined,
    emergencyContact: values.emergencyContact?.trim() || undefined,
  };
}
