import { PrismaClient, KycStatus, Plan, Environment, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Merchant demo
  const merchant = await prisma.merchant.upsert({
    where: { id: 'merchant_demo' },
    update: {},
    create: {
      id: 'merchant_demo',
      businessName: 'Comercio Demo CobraPy',
      ruc: '80000000-1',
      email: 'demo@cobrapy.test',
      phone: '+595981000000',
      kycStatus: KycStatus.APPROVED,
      plan: Plan.FREE,
    },
  });

  const existingKey = await prisma.apiKey.findFirst({
    where: { merchantId: merchant.id, environment: Environment.TEST, revokedAt: null },
  });
  if (!existingKey) {
    const secret = randomBytes(24).toString('base64url');
    const fullKey = `ck_test_${secret}`;
    await prisma.apiKey.create({
      data: {
        merchantId: merchant.id,
        name: 'Seed test key',
        keyPrefix: 'ck_test_',
        keyHash: await bcrypt.hash(fullKey, 10),
        environment: Environment.TEST,
      },
    });
    console.log('Seeded merchant:', merchant.id);
    console.log('   API KEY (guardala): ' + fullKey);
  } else {
    console.log('Merchant ya existe:', merchant.id);
  }

  // Admin user
  const adminEmail = 'admin@cobrapy.test';
  const adminPassword = 'cobrapy123';
  const adminExists = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.admin.create({
      data: {
        email: adminEmail,
        name: 'Super Admin',
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: AdminRole.SUPERADMIN,
      },
    });
    console.log(`Seeded admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin ya existe:', adminEmail);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
