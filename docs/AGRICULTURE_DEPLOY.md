# Agriculture module deployment

After pulling the agriculture module changes, run on the server:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm start
```

## What changed

- **Account** `farmingMode`: `LIVESTOCK`, `AGRICULTURE`, or `HYBRID` (set when super admin creates a farm admin).
- **Farm** `farmCategory`: `LIVESTOCK` or `AGRICULTURE` (set during farm registration).
- New tables: `CropType`, `GrowField`, `Planting`, `CropTreatment`, `Harvest`.

Existing accounts default to `LIVESTOCK`; existing farms default to `LIVESTOCK`.

## Hybrid accounts

1. Super admin creates farm admin with **Hybrid** farming mode.
2. Farm admin registers a **livestock farm** and/or an **agriculture farm** via `/register-farm`.
3. On `/choose-farm`, pick which farm to work in; sidebar and dashboard adapt to the farm type.

## API routes

- `/api/v1/crop-types/farm/:farmId`
- `/api/v1/fields/farm/:farmId`
- `/api/v1/plantings/farm/:farmId`
- `/api/v1/treatments/planting/:plantingId`
- `/api/v1/harvests/farm/:farmId` and `/harvests/planting/:plantingId`
- `/api/v1/crop-plan/farm/:farmId`
