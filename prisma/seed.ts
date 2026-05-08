import { PrismaClient, KycStatus, Plan, Environment, AdminRole, MembershipRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { loadSeedConfig } from './seed.config';

const prisma = new PrismaClient();

const BANKS = [
  { code: 'BMP', name: 'Banco Itau Paraguay S.A.' },
  { code: 'BCI', name: 'Banco Continental S.A.E.C.A.' },
  { code: 'GNB', name: 'Banco GNB Paraguay S.A.' },
  { code: 'BBVA', name: 'BBVA Paraguay S.A.' },
  { code: 'SANTANDER', name: 'Banco Santander Paraguay S.A.' },
  { code: 'VIS', name: 'Banco Visa Paraguay S.A.' },
];

async function main() {
  const cfg = loadSeedConfig(process.env);

  // Bancos
  for (const b of BANKS) {
    await prisma.bank.upsert({ where: { code: b.code }, update: {}, create: b });
  }
  console.log(`Seeded banks: ${BANKS.length}`);

  // Demo user con merchant + membership(OWNER)
  let demoUser = await prisma.user.findUnique({ where: { email: cfg.demo.email } });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: cfg.demo.email,
        name: cfg.demo.name,
        passwordHash: await bcrypt.hash(cfg.demo.password, 10),
      },
    });

    const merchant = await prisma.merchant.create({
      data: {
        businessName: 'Comercio Demo CobraPy',
        ruc: cfg.demoRuc,
        email: cfg.demo.email,
        phone: cfg.demoPhone,
        kycStatus: KycStatus.APPROVED,
        plan: Plan.FREE,
      },
    });

    await prisma.membership.create({
      data: {
        userId: demoUser.id,
        merchantId: merchant.id,
        role: MembershipRole.OWNER,
        acceptedAt: new Date(),
      },
    });

    const secret = randomBytes(24).toString('base64url');
    const fullKey = `ck_test_${secret}`;
    await prisma.apiKey.create({
      data: {
        merchantId: merchant.id,
        name: 'Default test key',
        keyPrefix: 'ck_test_',
        keyHash: await bcrypt.hash(fullKey, 10),
        environment: Environment.TEST,
      },
    });

    console.log(`Seeded demo user: ${cfg.demo.email}`);
    console.log(`   API KEY: ${fullKey}`);

    // ADMIN, OPERATOR, READONLY del mismo merchant — uno por cada rol distinto del OWNER.
    const memberSeeds: Array<{ spec: typeof cfg.manager; role: MembershipRole; label: string }> = [
      { spec: cfg.manager, role: MembershipRole.ADMIN, label: 'manager (ADMIN)' },
      { spec: cfg.operator, role: MembershipRole.OPERATOR, label: 'operator (OPERATOR)' },
      { spec: cfg.accountant, role: MembershipRole.READONLY, label: 'accountant (READONLY)' },
    ];
    for (const m of memberSeeds) {
      const u = await prisma.user.create({
        data: {
          email: m.spec.email,
          name: m.spec.name,
          passwordHash: await bcrypt.hash(m.spec.password, 10),
        },
      });
      await prisma.membership.create({
        data: {
          userId: u.id,
          merchantId: merchant.id,
          role: m.role,
          invitedBy: demoUser.id,
          acceptedAt: new Date(),
        },
      });
      console.log(`Seeded ${m.label}: ${m.spec.email}`);
    }
  } else {
    console.log(`Demo user ya existe: ${cfg.demo.email}`);
  }

  // Admin del staff portal
  const adminExists = await prisma.admin.findUnique({ where: { email: cfg.admin.email } });
  if (!adminExists) {
    await prisma.admin.create({
      data: {
        email: cfg.admin.email,
        name: cfg.admin.name,
        passwordHash: await bcrypt.hash(cfg.admin.password, 10),
        role: AdminRole.SUPERADMIN,
      },
    });
    console.log(`Seeded admin: ${cfg.admin.email}`);
  } else {
    console.log(`Admin ya existe: ${cfg.admin.email}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
