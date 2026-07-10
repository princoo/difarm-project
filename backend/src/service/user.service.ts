import prisma from "../db/prisma";

async function getUserByEmail(email: string) {
  const emailExist = await prisma.account.findUnique({ where: { email } });
  return emailExist;
}
async function getAccountById(id: string) {
  const result = await prisma.account.findUnique({ where: { id }, include:{users: true} });
  return result;
}
async function getUserById(id: string) {
  const emailExist = await prisma.user.findUnique({
    where: { id },
    include: { farms: true, account: true },
  });
  return emailExist;
}

async function resetPassword(email: string, newPassword: string) {
console.log(email)
  const result = await prisma.account.update({
    where: { email },
    data: { password: newPassword },
  });
  return result;
}

export default { getUserByEmail, resetPassword, getUserById, getAccountById };
