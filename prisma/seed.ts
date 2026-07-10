import { PrismaClient, Roles, Gender } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

/** Easy email + password logins for dashboard access */
const seedUsers = [
  {
    role: Roles.SUPERADMIN,
    username: 'superadmin',
    email: 'superadmin@difarm.com',
    phone: '+250700000001',
    password: 'Difarm123',
    fullname: 'Super Administrator',
    gender: Gender.MALE,
  },
  {
    role: Roles.ADMIN,
    username: 'admin',
    email: 'admin@difarm.com',
    phone: '+250700000002',
    password: 'Difarm123',
    fullname: 'Farm Administrator',
    gender: Gender.MALE,
  },
  {
    role: Roles.MANAGER,
    username: 'manager',
    email: 'manager@difarm.com',
    phone: '+250700000003',
    password: 'Difarm123',
    fullname: 'Farm Manager',
    gender: Gender.MALE,
  },
];

async function main() {
  console.log('Seeding users by role...');

  for (const u of seedUsers) {
    const existing = await prisma.account.findFirst({
      where: {
        OR: [{ username: u.username }, { email: u.email }],
      },
    });

    const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: {
          email: u.email,
          password: hashedPassword,
          status: true,
        },
      });
      console.log(`  Updated ${u.role}: ${u.email} (password: ${u.password})`);
      continue;
    }

    const account = await prisma.account.create({
      data: {
        username: u.username,
        email: u.email,
        phone: u.phone,
        role: u.role,
        password: hashedPassword,
        status: true,
      },
    });

    await prisma.user.create({
      data: {
        accountId: account.id,
        fullname: u.fullname,
        gender: u.gender,
      },
    });

    console.log(`  Created ${u.role}: ${u.email} (password: ${u.password})`);
  }

  console.log('Seeding demo farm...');
  const superAccount = await prisma.account.findUnique({
    where: { username: 'superadmin' },
  });
  const superUser = superAccount
    ? await prisma.user.findFirst({ where: { accountId: superAccount.id } })
    : null;

  if (superUser) {
    const demoFarm = await prisma.farm.findUnique({ where: { name: 'Demo Farm' } });
    if (demoFarm) {
      await prisma.farm.update({
        where: { id: demoFarm.id },
        data: { status: true, ownerId: superUser.id },
      });
      console.log('  Updated demo farm: Demo Farm');
    } else {
      await prisma.farm.create({
        data: {
          name: 'Demo Farm',
          location: 'Kigali, Rwanda',
          size: 50,
          type: 'Livestock',
          ownerId: superUser.id,
          status: true,
        },
      });
      console.log('  Created demo farm: Demo Farm');
    }
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
