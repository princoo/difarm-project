import prisma from "../db/prisma";

const getSingleVet = async (id: string) => {
  const result = await prisma.veterinarian.findUnique({
    where: { id },
    include: { farm:true },
  });
  return result;
};

export default { getSingleVet };
