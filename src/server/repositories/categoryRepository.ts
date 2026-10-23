import { prisma } from '../utils/prisma.js';

export const DEFAULT_KIRANA_CATEGORIES = [
  { name: 'Inventory / Stock', description: 'Core wholesale grocery stock, pulses, rice, flour, oil, spices' },
  { name: 'Dairy Products', description: 'Milk, butter, ghee, paneer, curd, cheese, dairy drinks' },
  { name: 'Packaged Goods', description: 'Biscuits, chips, noodles, namkeen, confectionery, chocolates' },
  { name: 'Food and Beverages', description: 'Tea, coffee, soft drinks, juices, instant food' },
  { name: 'Household Supplies', description: 'Mosquito repellents, light bulbs, matches, batteries' },
  { name: 'Personal Care', description: 'Soaps, shampoo, toothpaste, skin creams, hair oil' },
  { name: 'Cleaning Supplies', description: 'Detergents, dishwash bars, floor cleaners, phenyl, brooms' },
  { name: 'Packaging', description: 'Carry bags, carton boxes, packing tape, paper rolls' },
  { name: 'Utilities', description: 'Shop electricity, water, internet, generator fuel' },
  { name: 'Transportation', description: 'Auto rickshaw delivery, tempo freight, market commute' },
  { name: 'Other', description: 'Miscellaneous petty expenses' },
  { name: 'Uncategorized', description: 'Items requiring manual categorization' },
];

export class CategoryRepository {
  public async seedDefaultCategories(businessId: string): Promise<void> {
    for (const cat of DEFAULT_KIRANA_CATEGORIES) {
      await prisma.category.upsert({
        where: {
          businessId_name: {
            businessId,
            name: cat.name,
          },
        },
        update: {
          description: cat.description,
        },
        create: {
          businessId,
          name: cat.name,
          description: cat.description,
        },
      });
    }
  }

  public async getCategories(businessId: string) {
    return prisma.category.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  public async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
  }
}

export const categoryRepository = new CategoryRepository();
