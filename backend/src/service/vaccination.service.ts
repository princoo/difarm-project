import prisma from "../db/prisma";

const getSingleVaccination = async (id: string) => {
  const result = await prisma.vaccination.findUnique({
    where: { id },
    include: { farm:true, cattle: true },
  });
  return result;
};

export default { getSingleVaccination };
