import { Prisma } from "@prisma/client";

export const searchUtil = (searchTerm: any, searchableFields: string[]) => {
  if (!searchTerm) return {};
  const searchConditions: Prisma.CattleWhereInput = {
    OR: searchableFields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: "insensitive",
      },
    })),
  };

  return searchConditions;
};
