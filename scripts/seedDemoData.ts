import { seedDemoData } from '../src/server/services/seedService.js';
import { prisma } from '../src/server/utils/prisma.js';

export { seedDemoData };

if (process.argv[1]?.endsWith('seedDemoData.ts')) {
  seedDemoData()
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
