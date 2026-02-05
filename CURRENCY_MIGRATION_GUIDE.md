# Multi-Currency Migration Guide

## Overview
This guide will help you migrate from single-currency products to multi-currency ProductPrice system.

## What Changed

### Before (Single Currency):
```typescript
Product {
  price: 6000     // Single price
  cost: 3000      // Single cost
  currency: NGN   // Single currency
}
```

### After (Multi-Currency):
```typescript
Product {
  price: 6000         // Deprecated (kept for backward compatibility)
  cost: 3000          // Deprecated
  currency: NGN       // Primary currency
  productPrices: [    // NEW: Multi-currency pricing
    { currency: NGN, price: 6000, cost: 3000 },
    { currency: GHS, price: 120, cost: 60 }
  ]
}
```

## Migration Steps

### Step 1: Generate Prisma Client
```bash
pnpm db:generate
```

### Step 2: Push Schema Changes
```bash
# For development (quick, no migration files)
pnpm db:push

# OR for production (creates migration files)
pnpm db:migrate
```

This creates the `product_prices` table.

### Step 3: Migrate Existing Data
```bash
npx tsx prisma/migrations/migrate-product-prices.ts
```

This script:
- ✅ Reads all existing products
- ✅ Creates ProductPrice record for each product's current price/cost/currency
- ✅ Skips products that already have prices migrated
- ✅ Safe to run multiple times (idempotent)

### Step 4: Verify Migration
```sql
-- Check that all products have at least one price
SELECT
  p.id,
  p.name,
  p.currency as "Primary Currency",
  COUNT(pp.id) as "Price Count"
FROM products p
LEFT JOIN product_prices pp ON pp."productId" = p.id
WHERE p."isDeleted" = false
GROUP BY p.id, p.name, p.currency
ORDER BY "Price Count" ASC;

-- Should show Price Count >= 1 for all products
```

## Adding Multi-Currency Prices

### Admin UI (Recommended)
1. Go to Admin Dashboard → Inventory
2. Click on a product
3. Navigate to "Pricing" tab
4. Click "Add Currency Price"
5. Select currency (GHS, USD, etc.)
6. Enter price and cost
7. Save

### Directly in Database (Development Only)
```sql
-- Add GHS pricing to a product
INSERT INTO product_prices (id, "productId", currency, price, cost, "createdAt", "updatedAt")
VALUES (
  'cuid_' || gen_random_uuid()::text, -- Generate unique ID
  'your_product_id',
  'GHS',
  120.00,  -- GHS price
  60.00,   -- GHS cost
  NOW(),
  NOW()
);
```

## Package Validation

After migration, packages are validated to ensure:
- ✅ Cannot create GHS package if product has no GHS price
- ✅ Cannot create USD package if product has no USD price
- ✅ Package creation shows only currencies with configured pricing

## Rollback (If Needed)

If you need to rollback:

```sql
-- 1. Drop ProductPrice table
DROP TABLE IF EXISTS product_prices CASCADE;

-- 2. Revert schema.prisma to previous version
-- 3. Run: pnpm db:push
```

**Note:** Rollback will lose all multi-currency price data!

## Testing Checklist

After migration, test:

- [ ] Existing products display correctly
- [ ] Orders show correct currency symbols
- [ ] Dashboard filters by currency (NGN/GHS separately)
- [ ] Can add new currency prices to products
- [ ] Package creation validates currency availability
- [ ] Order form shows packages only for selected currency
- [ ] Ghanaian orders show GH₵ symbol, not ₦
- [ ] Revenue calculations are currency-specific

## Troubleshooting

### "No price found for currency X"
**Solution:** Add ProductPrice for that currency to the product.

### "Cannot create package in GHS"
**Solution:** Product needs GHS pricing first. Add via Admin UI → Product → Pricing.

### Orders still showing ₦ for GHS orders
**Solution:** Clear browser cache, verify order.currency field is set correctly.

### Dashboard showing "0" revenue
**Solution:** Check currency filter - may be filtered to currency with no orders.

## Support

For issues or questions:
- Check logs: `pnpm db:studio` to inspect data
- Run migration script again (safe, idempotent)
- Review CLAUDE.md for architecture details
