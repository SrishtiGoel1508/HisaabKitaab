export interface SyntheticReceiptDefinition {
  id: string;
  filename: string;
  vendorName: string | null;
  receiptDate: string | null; // YYYY-MM-DD
  subtotalInr: number | null;
  taxAmountInr: number | null;
  totalAmountInr: number | null;
  status: 'draft' | 'needs_review' | 'confirmed';
  notes?: string;
  categoryHint?: string;
  specialCondition?:
    | 'normal'
    | 'blurry'
    | 'missing_date'
    | 'duplicate_file'
    | 'spelling_variation'
    | 'math_discrepancy'
    | 'unclear_category'
    | 'missing_total';
  items: Array<{
    itemName: string;
    quantity?: number | null;
    unit?: string | null;
    unitPriceInr?: number | null;
    lineTotalInr?: number | null;
    categoryName: string;
  }>;
}

export const SYNTHETIC_RECEIPTS: SyntheticReceiptDefinition[] = [
  // 1. Normal Readable Receipt — Wholesale Dairy
  {
    id: 'syn-rec-001',
    filename: 'amul_dairy_wholesaler_oct01.svg',
    vendorName: 'Amul Dairy Distributors & Agency',
    receiptDate: '2026-10-01',
    subtotalInr: 3200.0,
    taxAmountInr: 160.0,
    totalAmountInr: 3360.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Amul Taaza Milk 500ml Pouch (x50)', quantity: 50, unit: 'pkt', unitPriceInr: 27.0, lineTotalInr: 1350.0, categoryName: 'Dairy Products' },
      { itemName: 'Amul Butter 100g (x20)', quantity: 20, unit: 'pcs', unitPriceInr: 54.0, lineTotalInr: 1080.0, categoryName: 'Dairy Products' },
      { itemName: 'Amul Paneer 200g (x11)', quantity: 11, unit: 'pcs', unitPriceInr: 84.55, lineTotalInr: 930.0, categoryName: 'Dairy Products' },
    ],
  },

  // 2. Normal Wholesale Grocery Stock
  {
    id: 'syn-rec-002',
    filename: 'shree_ganesh_grains_oct03.svg',
    vendorName: 'Shree Ganesh Grain & Oil Merchants',
    receiptDate: '2026-10-03',
    subtotalInr: 8450.0,
    taxAmountInr: 0.0,
    totalAmountInr: 8450.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Fortune Sunlite Refined Oil 15L Tin', quantity: 1, unit: 'tin', unitPriceInr: 2150.0, lineTotalInr: 2150.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Aashirvaad Shudh Chakki Atta 10kg (x3)', quantity: 3, unit: 'bag', unitPriceInr: 420.0, lineTotalInr: 1260.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Kolam Rice 25kg Bag', quantity: 2, unit: 'bag', unitPriceInr: 1650.0, lineTotalInr: 3300.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Madhur Pure Sugar 50kg Sack', quantity: 1, unit: 'sack', unitPriceInr: 1740.0, lineTotalInr: 1740.0, categoryName: 'Inventory / Stock' },
    ],
  },

  // 3. Normal Packaged Goods & Snacks
  {
    id: 'syn-rec-003',
    filename: 'parle_britannia_snacks_oct05.svg',
    vendorName: 'Balaji & Parle Confectionery Depot',
    receiptDate: '2026-10-05',
    subtotalInr: 4120.0,
    taxAmountInr: 206.0,
    totalAmountInr: 4326.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Parle-G Biscuit Box (120 pkts)', quantity: 1, unit: 'box', unitPriceInr: 1100.0, lineTotalInr: 1100.0, categoryName: 'Packaged Goods' },
      { itemName: 'Good Day Butter Cookies Case', quantity: 1, unit: 'case', unitPriceInr: 1350.0, lineTotalInr: 1350.0, categoryName: 'Packaged Goods' },
      { itemName: 'Kurkure Masala Munch Jar Pack', quantity: 2, unit: 'box', unitPriceInr: 480.0, lineTotalInr: 960.0, categoryName: 'Packaged Goods' },
      { itemName: 'Maggi 2-Minute Noodles Carton (72 pkts)', quantity: 1, unit: 'carton', unitPriceInr: 916.0, lineTotalInr: 916.0, categoryName: 'Food and Beverages' },
    ],
  },

  // 4. Normal Cleaning Supplies
  {
    id: 'syn-rec-004',
    filename: 'hindustan_unilever_cleaning_oct07.svg',
    vendorName: 'Hindustan FMCG Wholesale Supplies',
    receiptDate: '2026-10-07',
    subtotalInr: 5200.0,
    taxAmountInr: 260.0,
    totalAmountInr: 5460.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Surf Excel Quick Wash 1kg (x12)', quantity: 12, unit: 'pcs', unitPriceInr: 145.0, lineTotalInr: 1740.0, categoryName: 'Cleaning Supplies' },
      { itemName: 'Vim Dishwash Bar Carton (x48)', quantity: 1, unit: 'carton', unitPriceInr: 920.0, lineTotalInr: 920.0, categoryName: 'Cleaning Supplies' },
      { itemName: 'Harpic Power Plus 500ml (x12)', quantity: 12, unit: 'pcs', unitPriceInr: 85.0, lineTotalInr: 1020.0, categoryName: 'Cleaning Supplies' },
      { itemName: 'Dettol Antiseptic Liquid 250ml (x10)', quantity: 10, unit: 'pcs', unitPriceInr: 178.0, lineTotalInr: 1780.0, categoryName: 'Personal Care' },
    ],
  },

  // 5. Normal Packaging Supplies
  {
    id: 'syn-rec-005',
    filename: 'sharma_packaging_oct09.svg',
    vendorName: 'Sharma Packaging & Plastic Industries',
    receiptDate: '2026-10-09',
    subtotalInr: 1850.0,
    taxAmountInr: 92.5,
    totalAmountInr: 1942.5,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Biodegradable Carry Bags (Medium 10kg pack)', quantity: 5, unit: 'pkt', unitPriceInr: 260.0, lineTotalInr: 1300.0, categoryName: 'Packaging' },
      { itemName: 'Brown Packing Tape 2-inch (x6 rolls)', quantity: 6, unit: 'roll', unitPriceInr: 45.0, lineTotalInr: 270.0, categoryName: 'Packaging' },
      { itemName: 'Plastic Pouches 1kg Size (Bundle)', quantity: 1, unit: 'bundle', unitPriceInr: 372.5, lineTotalInr: 372.5, categoryName: 'Packaging' },
    ],
  },

  // 6. Normal Utilities - Electricity bill
  {
    id: 'syn-rec-006',
    filename: 'mahavitaran_power_bill_oct10.svg',
    vendorName: 'MSEDCL Electricity Board',
    receiptDate: '2026-10-10',
    subtotalInr: 2850.0,
    taxAmountInr: 0.0,
    totalAmountInr: 2850.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Commercial Power Consumption Meter #58921', quantity: 1, unit: 'month', unitPriceInr: 2850.0, lineTotalInr: 2850.0, categoryName: 'Utilities' },
    ],
  },

  // 7. Normal Transport & Logistics (Tempo Freight)
  {
    id: 'syn-rec-007',
    filename: 'choudhary_tempo_transport_oct11.svg',
    vendorName: 'Choudhary Roadlines & Tempo Service',
    receiptDate: '2026-10-11',
    subtotalInr: 1200.0,
    taxAmountInr: 0.0,
    totalAmountInr: 1200.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'APMC Market to Shop Grain Tempo Freight', quantity: 1, unit: 'trip', unitPriceInr: 1200.0, lineTotalInr: 1200.0, categoryName: 'Transportation' },
    ],
  },

  // 8. Normal Household Supplies
  {
    id: 'syn-rec-008',
    filename: 'national_hardware_oct12.svg',
    vendorName: 'National General Store & Electricals',
    receiptDate: '2026-10-12',
    subtotalInr: 1680.0,
    taxAmountInr: 84.0,
    totalAmountInr: 1764.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'AllOut Mosquito Refill Pack (x12)', quantity: 12, unit: 'pcs', unitPriceInr: 75.0, lineTotalInr: 900.0, categoryName: 'Household Supplies' },
      { itemName: 'Ship Matchbox Bundle (100 small boxes)', quantity: 2, unit: 'bundle', unitPriceInr: 120.0, lineTotalInr: 240.0, categoryName: 'Household Supplies' },
      { itemName: 'Eveready AA Batteries Carton (x20)', quantity: 1, unit: 'carton', unitPriceInr: 624.0, lineTotalInr: 624.0, categoryName: 'Household Supplies' },
    ],
  },

  // 9. DELIBERATE EDGE CASE 1: Blurry Receipt (Low confidence flags, needs review)
  {
    id: 'syn-rec-009',
    filename: 'blurry_faded_thermal_bill_oct13.svg',
    vendorName: 'Kaveri Provisions & Spices',
    receiptDate: '2026-10-13',
    subtotalInr: 2400.0,
    taxAmountInr: null,
    totalAmountInr: 2400.0,
    status: 'needs_review',
    specialCondition: 'blurry',
    notes: 'Thermal paper severely faded; line item quantities partially obscured.',
    items: [
      { itemName: 'Jeera Powder 500g (Quantity smudged)', quantity: null, unit: 'pkt', unitPriceInr: null, lineTotalInr: 1100.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Haldi Turmeric Whole Bag (Blurry text)', quantity: null, unit: 'kg', unitPriceInr: null, lineTotalInr: 1300.0, categoryName: 'Inventory / Stock' },
    ],
  },

  // 10. DELIBERATE EDGE CASE 2: Missing Date Receipt (needs_review, blocking confirmation)
  {
    id: 'syn-rec-010',
    filename: 'kedia_flour_mill_missing_date.svg',
    vendorName: 'Kedia Steam Flour Mills',
    receiptDate: null, // DELIBERATELY MISSING
    subtotalInr: 3600.0,
    taxAmountInr: 0.0,
    totalAmountInr: 3600.0,
    status: 'needs_review',
    specialCondition: 'missing_date',
    notes: 'Invoice date stamp blank; needs manual entry before confirmation.',
    items: [
      { itemName: 'Besan Fine Gram Flour 50kg Bag', quantity: 1, unit: 'bag', unitPriceInr: 3600.0, lineTotalInr: 3600.0, categoryName: 'Inventory / Stock' },
    ],
  },

  // 11. DELIBERATE EDGE CASE 3: Duplicate of Receipt syn-rec-001 (Level 1 & Level 2 Match)
  {
    id: 'syn-rec-011',
    filename: 'amul_dairy_wholesaler_duplicate_upload.svg',
    vendorName: 'Amul Dairy Distributors & Agency',
    receiptDate: '2026-10-01',
    subtotalInr: 3200.0,
    taxAmountInr: 160.0,
    totalAmountInr: 3360.0,
    status: 'needs_review',
    specialCondition: 'duplicate_file',
    notes: 'Deliberate duplicate upload of syn-rec-001 to test duplicate detection engine.',
    items: [
      { itemName: 'Amul Taaza Milk 500ml Pouch (x50)', quantity: 50, unit: 'pkt', unitPriceInr: 27.0, lineTotalInr: 1350.0, categoryName: 'Dairy Products' },
      { itemName: 'Amul Butter 100g (x20)', quantity: 20, unit: 'pcs', unitPriceInr: 54.0, lineTotalInr: 1080.0, categoryName: 'Dairy Products' },
      { itemName: 'Amul Paneer 200g (x11)', quantity: 11, unit: 'pcs', unitPriceInr: 84.55, lineTotalInr: 930.0, categoryName: 'Dairy Products' },
    ],
  },

  // 12. DELIBERATE EDGE CASE 4: Inconsistent Vendor Spelling (Fuzzy match test)
  {
    id: 'syn-rec-012',
    filename: 'parle_agenci_spelling_mismatch_oct14.svg',
    vendorName: 'Parle Agenci Distrbutor', // Misspelled name
    receiptDate: '2026-10-14',
    subtotalInr: 2150.0,
    taxAmountInr: 107.5,
    totalAmountInr: 2257.5,
    status: 'draft',
    specialCondition: 'spelling_variation',
    notes: 'Vendor name spelled with typos by billing clerk.',
    items: [
      { itemName: 'Monaco Salted Biscuits Case', quantity: 1, unit: 'case', unitPriceInr: 980.0, lineTotalInr: 980.0, categoryName: 'Packaged Goods' },
      { itemName: 'Krackjack Biscuits Box', quantity: 1, unit: 'box', unitPriceInr: 1277.5, lineTotalInr: 1277.5, categoryName: 'Packaged Goods' },
    ],
  },

  // 13. DELIBERATE EDGE CASE 5: Math Discrepancy (Items sum != Printed Total)
  {
    id: 'syn-rec-013',
    filename: 'laxmi_traders_math_discrepancy_oct15.svg',
    vendorName: 'Laxmi Wholesale Traders',
    receiptDate: '2026-10-15',
    subtotalInr: 4500.0,
    taxAmountInr: 0.0,
    totalAmountInr: 5000.0, // PRINTED TOTAL IS ₹5000, BUT ITEMS SUM TO ₹4500 (Discrepancy: ₹500)
    status: 'needs_review',
    specialCondition: 'math_discrepancy',
    notes: 'Handwritten bill calculation error: items sum to ₹4,500 but bill total was written as ₹5,000.',
    items: [
      { itemName: 'Toor Dal Premium 25kg Bag', quantity: 1, unit: 'bag', unitPriceInr: 3200.0, lineTotalInr: 3200.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Kabuli Chana 10kg Bag', quantity: 1, unit: 'bag', unitPriceInr: 1300.0, lineTotalInr: 1300.0, categoryName: 'Inventory / Stock' },
    ],
  },

  // 14. DELIBERATE EDGE CASE 6: Unclear Item Category (Uncategorized test)
  {
    id: 'syn-rec-014',
    filename: 'unknown_sundry_bazaar_oct16.svg',
    vendorName: 'City Sundry Bazaar',
    receiptDate: '2026-10-16',
    subtotalInr: 890.0,
    taxAmountInr: 0.0,
    totalAmountInr: 890.0,
    status: 'draft',
    specialCondition: 'unclear_category',
    notes: 'Ambiguous sundry retail items that require manual kirana categorization.',
    items: [
      { itemName: 'Special Festival Decorative Toran & Diyas', quantity: 4, unit: 'pcs', unitPriceInr: 120.0, lineTotalInr: 480.0, categoryName: 'Uncategorized' },
      { itemName: 'Brass Puja Bell & Incense Stand', quantity: 1, unit: 'set', unitPriceInr: 410.0, lineTotalInr: 410.0, categoryName: 'Uncategorized' },
    ],
  },

  // 15. DELIBERATE EDGE CASE 7: Missing Total (Blocking review flag)
  {
    id: 'syn-rec-015',
    filename: 'torn_corner_missing_total_oct17.svg',
    vendorName: 'Mahalaxmi Pulses Depot',
    receiptDate: '2026-10-17',
    subtotalInr: null,
    taxAmountInr: null,
    totalAmountInr: null, // DELIBERATELY MISSING (TORN RECEIPT BOTTOM)
    status: 'needs_review',
    specialCondition: 'missing_total',
    notes: 'Bottom corner of receipt torn off; total amount missing from document.',
    items: [
      { itemName: 'Moong Dal 15kg Bag', quantity: 1, unit: 'bag', unitPriceInr: 1800.0, lineTotalInr: 1800.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Masoor Dal 10kg Bag', quantity: 1, unit: 'bag', unitPriceInr: 950.0, lineTotalInr: 950.0, categoryName: 'Inventory / Stock' },
    ],
  },

  // 16. Normal Spices Wholesale
  {
    id: 'syn-rec-016',
    filename: 'everest_spices_oct18.svg',
    vendorName: 'Everest & MDH Masala Agency',
    receiptDate: '2026-10-18',
    subtotalInr: 3450.0,
    taxAmountInr: 172.5,
    totalAmountInr: 3622.5,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Garam Masala 100g Carton (x20)', quantity: 20, unit: 'pcs', unitPriceInr: 68.0, lineTotalInr: 1360.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Chana Masala 100g Carton (x15)', quantity: 15, unit: 'pcs', unitPriceInr: 62.0, lineTotalInr: 930.0, categoryName: 'Inventory / Stock' },
      { itemName: 'Kashmiri Mirch Powder 500g (x5)', quantity: 5, unit: 'pkt', unitPriceInr: 266.5, lineTotalInr: 1332.5, categoryName: 'Inventory / Stock' },
    ],
  },

  // 17. Normal Cold Drinks & Beverages
  {
    id: 'syn-rec-017',
    filename: 'coca_cola_beverages_oct19.svg',
    vendorName: 'Hindustan Beverages Bottling Depot',
    receiptDate: '2026-10-19',
    subtotalInr: 4200.0,
    taxAmountInr: 336.0,
    totalAmountInr: 4536.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Thums Up 250ml Glass Crate (24 bottles)', quantity: 2, unit: 'crate', unitPriceInr: 480.0, lineTotalInr: 960.0, categoryName: 'Food and Beverages' },
      { itemName: 'Sprite 750ml PET Case (24 bottles)', quantity: 2, unit: 'case', unitPriceInr: 840.0, lineTotalInr: 1680.0, categoryName: 'Food and Beverages' },
      { itemName: 'Maaza Mango Drink 600ml Case', quantity: 2, unit: 'case', unitPriceInr: 948.0, lineTotalInr: 1896.0, categoryName: 'Food and Beverages' },
    ],
  },

  // 18. Normal Personal Care (Toothpaste & Soaps)
  {
    id: 'syn-rec-018',
    filename: 'colgate_palmolive_oct20.svg',
    vendorName: 'Colgate & Godrej Personal Care Dist',
    receiptDate: '2026-10-20',
    subtotalInr: 3780.0,
    taxAmountInr: 189.0,
    totalAmountInr: 3969.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Colgate Strong Teeth 200g (x18)', quantity: 18, unit: 'pcs', unitPriceInr: 110.0, lineTotalInr: 1980.0, categoryName: 'Personal Care' },
      { itemName: 'Lifebuoy Total Soap Multipack (x12)', quantity: 12, unit: 'pack', unitPriceInr: 120.0, lineTotalInr: 1440.0, categoryName: 'Personal Care' },
      { itemName: 'Parachute Coconut Oil 200ml (x6)', quantity: 6, unit: 'pcs', unitPriceInr: 91.5, lineTotalInr: 549.0, categoryName: 'Personal Care' },
    ],
  },

  // 19. Normal Tea & Coffee Wholesaler
  {
    id: 'syn-rec-019',
    filename: 'wagh_bakri_tea_oct21.svg',
    vendorName: 'Wagh Bakri & Tata Tea Wholesalers',
    receiptDate: '2026-10-21',
    subtotalInr: 4800.0,
    taxAmountInr: 240.0,
    totalAmountInr: 5040.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Wagh Bakri Premium CTC Tea 1kg (x6)', quantity: 6, unit: 'kg', unitPriceInr: 490.0, lineTotalInr: 2940.0, categoryName: 'Food and Beverages' },
      { itemName: 'Tata Tea Gold 500g (x6)', quantity: 6, unit: 'pkt', unitPriceInr: 350.0, lineTotalInr: 2100.0, categoryName: 'Food and Beverages' },
    ],
  },

  // 20. Normal Bakery & Bread Delivery
  {
    id: 'syn-rec-020',
    filename: 'metro_bakery_bread_oct22.svg',
    vendorName: 'Metro Daily Bakery & Pav Suppliers',
    receiptDate: '2026-10-22',
    subtotalInr: 1420.0,
    taxAmountInr: 0.0,
    totalAmountInr: 1420.0,
    status: 'confirmed',
    specialCondition: 'normal',
    items: [
      { itemName: 'Daily White Sandwich Bread (x30 loaves)', quantity: 30, unit: 'loaf', unitPriceInr: 32.0, lineTotalInr: 960.0, categoryName: 'Packaged Goods' },
      { itemName: 'Fresh Pav Ladi (x20 packs)', quantity: 20, unit: 'pack', unitPriceInr: 23.0, lineTotalInr: 460.0, categoryName: 'Packaged Goods' },
    ],
  },
];
