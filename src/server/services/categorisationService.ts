import { prisma } from '../utils/prisma.js';

export interface CategoryMapping {
  id: string;
  name: string;
}

export class CategorisationService {
  private categoryCache: Map<string, CategoryMapping[]> = new Map();

  /**
   * Loads and caches categories for a business.
   */
  public async getCategoriesForBusiness(businessId: string): Promise<CategoryMapping[]> {
    const cached = this.categoryCache.get(businessId);
    if (cached) return cached;

    const categories = await prisma.category.findMany({
      where: { businessId },
      select: { id: true, name: true },
    });

    const mapped = categories.map((c) => ({ id: c.id, name: c.name }));
    this.categoryCache.set(businessId, mapped);
    return mapped;
  }

  /**
   * Clears category cache (e.g. after adding a new category).
   */
  public invalidateCache(businessId?: string): void {
    if (businessId) {
      this.categoryCache.delete(businessId);
    } else {
      this.categoryCache.clear();
    }
  }

  /**
   * Matches an AI suggested category or item name to a valid database category ID.
   */
  public async resolveCategoryId(
    businessId: string,
    suggestedCategory?: string | null,
    itemName?: string
  ): Promise<string | null> {
    const categories = await this.getCategoriesForBusiness(businessId);
    if (!categories.length) return null;

    // 1. Direct match on suggestedCategory
    if (suggestedCategory && suggestedCategory.trim()) {
      const normalizedSuggested = suggestedCategory.trim().toLowerCase();
      const directMatch = categories.find(
        (c) => c.name.toLowerCase() === normalizedSuggested
      );
      if (directMatch) return directMatch.id;

      // Partial match
      const partialMatch = categories.find(
        (c) =>
          c.name.toLowerCase().includes(normalizedSuggested) ||
          normalizedSuggested.includes(c.name.toLowerCase())
      );
      if (partialMatch) return partialMatch.id;
    }

    // 2. Keyword matching based on item name (Kirana common terms)
    if (itemName && itemName.trim()) {
      const lowerItem = itemName.toLowerCase();

      // Dairy
      if (/milk|doodh|curd|dahi|paneer|butter|makhan|cheese|ghee|chaas|lassi|cream/i.test(lowerItem)) {
        const dairy = categories.find((c) => c.name.toLowerCase().includes('dairy'));
        if (dairy) return dairy.id;
      }

      // Food & Beverages / Packaged Goods
      if (/biscuit|parle|britannia|maggi|noodle|chips|kurkure|namkeen|bhujia|lays|chitale|snack|chocolate|cadbury/i.test(lowerItem)) {
        const pkg = categories.find((c) => c.name.toLowerCase().includes('packaged') || c.name.toLowerCase().includes('food'));
        if (pkg) return pkg.id;
      }

      // Staples / Inventory
      if (/rice|chawal|atta|flour|dal|moong|toor|urad|chana|sugar|cheeni|oil|tel|mustard|fortune|salt|namak|spices|masala/i.test(lowerItem)) {
        const inv = categories.find((c) => c.name.toLowerCase().includes('inventory') || c.name.toLowerCase().includes('stock'));
        if (inv) return inv.id;
      }

      // Cleaning / Household
      if (/soap|detergent|surf|rin|tide|vim|dishwash|phenyl|harpic|broom|duster|colin|bleach/i.test(lowerItem)) {
        const clean = categories.find((c) => c.name.toLowerCase().includes('cleaning') || c.name.toLowerCase().includes('household'));
        if (clean) return clean.id;
      }

      // Personal care
      if (/shampoo|colgate|paste|toothpaste|brush|oil|dettol|lifebuoy|nivea|cream|fair|talc|sanitary/i.test(lowerItem)) {
        const personal = categories.find((c) => c.name.toLowerCase().includes('personal'));
        if (personal) return personal.id;
      }

      // Packaging
      if (/polythene|carry bag|polybag|carton|tape|box|wrapper|pouch|panni|envelope/i.test(lowerItem)) {
        const packaging = categories.find((c) => c.name.toLowerCase().includes('packaging'));
        if (packaging) return packaging.id;
      }
    }

    // Fallback to "Uncategorized" if available, else null
    const uncategorized = categories.find((c) => c.name.toLowerCase() === 'uncategorized');
    return uncategorized ? uncategorized.id : null;
  }
}

export const categorisationService = new CategorisationService();
