import prisma from "../db/prisma";

const getSingleInsemination = async (id: string) => {
  const result = await prisma.insemination.findUnique({
    where: { id },
    include: { farm:true, cattle: true },
  });
  return result;
};

export default { getSingleInsemination };
