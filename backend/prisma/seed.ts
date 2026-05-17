import {
  PrismaClient,
  Role,
  TransactionType,
  TransactionStatus,
  UserPackageStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const [autoPost, generateImage, analyzeData] = await Promise.all([
    prisma.feature.upsert({
      where: { codeName: 'auto_post' },
      update: {},
      create: {
        codeName: 'auto_post',
        description: 'Automatically schedule and publish social media posts',
        creditCost: 1,
      },
    }),
    prisma.feature.upsert({
      where: { codeName: 'generate_image' },
      update: {},
      create: {
        codeName: 'generate_image',
        description: 'Generate AI-powered images from text prompts',
        creditCost: 3,
      },
    }),
    prisma.feature.upsert({
      where: { codeName: 'analyze_data' },
      update: {},
      create: {
        codeName: 'analyze_data',
        description: 'Deep analytics and insight generation from your data',
        creditCost: 5,
      },
    }),
  ]);

  console.log('✅ Features seeded');

  const basicPkg = await prisma.package.upsert({
    where: { id: 'pkg-basic-v1' },
    update: {},
    create: {
      id: 'pkg-basic-v1',
      name: 'Basic',
      description: 'Perfect for individuals and small projects',
      price: 9.99,
      creditAmount: 100,
      isActive: true,
      packageFeatures: {
        create: [{ featureId: autoPost.id }],
      },
    },
  });

  const proPkg = await prisma.package.upsert({
    where: { id: 'pkg-pro-v1' },
    update: {},
    create: {
      id: 'pkg-pro-v1',
      name: 'Pro',
      description: 'Ideal for growing teams and businesses',
      price: 29.99,
      creditAmount: 500,
      isActive: true,
      packageFeatures: {
        create: [{ featureId: autoPost.id }, { featureId: generateImage.id }],
      },
    },
  });

  await prisma.package.upsert({
    where: { id: 'pkg-enterprise-v1' },
    update: {},
    create: {
      id: 'pkg-enterprise-v1',
      name: 'Enterprise',
      description: 'Full-featured solution for large organizations',
      price: 99.99,
      creditAmount: 2000,
      isActive: true,
      packageFeatures: {
        create: [
          { featureId: autoPost.id },
          { featureId: generateImage.id },
          { featureId: analyzeData.id },
        ],
      },
    },
  });

  console.log('✅ Packages seeded');

  const adminHash = await bcrypt.hash('Admin@1234', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      currentCredits: 9999,
      role: Role.ADMIN,
    },
  });

  const testHash = await bcrypt.hash('Test@1234', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: testHash,
      currentCredits: 50,
      role: Role.USER,
    },
  });

  await prisma.userPackage.upsert({
    where: { id: 'up-test-pro-v1' },
    update: {},
    create: {
      id: 'up-test-pro-v1',
      userId: testUser.id,
      packageId: proPkg.id,
      status: UserPackageStatus.ACTIVE,
    },
  });

  await prisma.transaction.upsert({
    where: { referenceId: 'seed-init-tx-v1' },
    update: {},
    create: {
      userId: testUser.id,
      packageId: proPkg.id,
      amount: 50,
      transactionType: TransactionType.CREDIT_IN,
      status: TransactionStatus.COMPLETED,
      description: 'Initial credits — Pro package',
      balanceBefore: 0,
      balanceAfter: 50,
      referenceId: 'seed-init-tx-v1',
    },
  });

  console.log('✅ Test users seeded');
  console.log('');
  console.log('─────────────────────────────────────');
  console.log('  Test Accounts');
  console.log('─────────────────────────────────────');
  console.log('  Admin : admin@example.com / Admin@1234');
  console.log('  User  : test@example.com  / Test@1234  (50 credits · Pro)');
  console.log('─────────────────────────────────────');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
