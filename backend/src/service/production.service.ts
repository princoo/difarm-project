import prisma from "../db/prisma";

const getSingleproduction = async (id: string) => {
    console.log(id)
    const result = await prisma.production.findUnique({ where: { id }, include:{farm: true,cattle: true} });
    return result;
  };

  export default {getSingleproduction}