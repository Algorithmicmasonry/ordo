# Ghanaian Order Form Testing Guide

## 🧪 Test Checklist

### Prerequisites
Before testing, ensure:
1. ✅ Database migration completed (`pnpm db:push`)
2. ✅ Data migration script ran (`npx tsx prisma/migrations/migrate-product-prices.ts`)
3. ✅ At least one product has a GHS package configured

---

## Test 1: Access Ghanaian Order Form

### URL Format
```
http://localhost:3000/order-form/embed?product=PRODUCT_ID&currency=GHS
```

**Replace `PRODUCT_ID`** with an actual product ID from your database.

### How to Get Product ID
Option 1 - From Admin Dashboard:
1. Go to Admin → Inventory
2. Click on a product
3. Copy the ID from the URL or page

Option 2 - From Database:
```sql
SELECT id, name FROM products WHERE "isActive" = true LIMIT 5;
```

### Expected Results
- ✅ Form loads successfully
- ✅ Currency selector shows "Ghana" or regions (not states)
- ✅ Package prices show **GH₵** symbol (not ₦)
- ✅ Only GHS packages appear (if product has multiple currency packages)

---

## Test 2: Package Price Display

### What to Check
1. **Package Selector:**
   - Should show: `= GH₵120` (not `= ₦120`)
   - Currency symbol matches GHS: **GH₵**

2. **Package Options:**
   - Each package should display correct GHS price
   - Format: "Silver: GH₵120 for 12 items"

### Expected Behavior
```
✅ CORRECT:
   Regular Package
   = GH₵120

❌ WRONG:
   Regular Package
   = ₦120
```

---

## Test 3: Form Submission

### Steps
1. Fill in customer information:
   - Name: Test Customer
   - Phone: +233 XX XXX XXXX (Ghana format)
   - WhatsApp: Same or different
   - Delivery Address: Test address
   - Region: Select a Ghanaian region
   - City: Enter city name

2. Select a package (GHS package)

3. Click "Submit Order" or "Place Order"

### Expected Results
- ✅ Order submits successfully
- ✅ Success message appears
- ✅ Form resets

### Database Verification
```sql
-- Check the created order
SELECT
  "orderNumber",
  "customerName",
  currency,
  "totalAmount",
  state,
  city
FROM orders
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Expected:**
- `currency` = `'GHS'`
- `totalAmount` = GHS price (e.g., 120)
- `state` = Ghanaian region (e.g., "Greater Accra")

---

## Test 4: Order Display in Dashboard

### Steps
1. Log in as Admin
2. Go to Dashboard → Orders
3. Find the newly created Ghanaian order

### What to Check
1. **Order List:**
   - Amount column shows: **GH₵120** (not ₦120)
   - Currency badge/indicator shows GHS

2. **Order Details Modal/Page:**
   - Customer location shows Ghana region
   - Order items show **GH₵** symbol
   - Total amount shows **GH₵120**
   - All prices use GH₵ throughout

### Expected Display
```
Order Details - #cml9xyz

Customer Information
Name: Test Customer
Phone: +233 XX XXX XXXX
Location: Accra, Greater Accra

Order Items
Product         Quantity  Price      Total
Bubble Hair Dye    12     GH₵10      GH₵120

Total Amount                GH₵120
```

---

## Test 5: Sales Rep View

### Steps
1. Log in as the assigned Sales Rep
2. Go to My Orders
3. Find the Ghanaian order

### What to Check
- ✅ Order shows **GH₵120**
- ✅ Not mixed with NGN orders
- ✅ Currency symbol correct throughout
- ✅ Customer details show Ghanaian location

---

## Test 6: Dashboard Currency Filter

### Steps
1. Log in as Admin
2. Go to Dashboard
3. Change currency filter to **GHS**

### Expected Behavior
- ✅ Revenue shows only GHS orders
- ✅ Displays: "Currency: Ghanaian Cedi"
- ✅ Stats show GHS amounts only
- ✅ No NGN data mixed in

### Test Both Currencies
1. **Filter: NGN**
   - Shows only Nigerian orders
   - Revenue in ₦

2. **Filter: GHS**
   - Shows only Ghanaian orders
   - Revenue in GH₵

---

## Test 7: Multiple Currency Packages

### Prerequisites
Product must have both NGN and GHS packages.

### Steps
1. **Test NGN Form:**
   ```
   /order-form/embed?product=PRODUCT_ID&currency=NGN
   ```
   - Should show only NGN packages
   - Prices in ₦

2. **Test GHS Form:**
   ```
   /order-form/embed?product=PRODUCT_ID&currency=GHS
   ```
   - Should show only GHS packages
   - Prices in GH₵

### Expected Behavior
**Package Filtering:**
- ✅ NGN form shows NGN packages only
- ✅ GHS form shows GHS packages only
- ✅ No mixing of currencies in package options

---

## Test 8: Edge Cases

### Test 8.1: Product with No GHS Packages
1. Access form with `currency=GHS` for product without GHS packages
2. **Expected:** Error or empty message
3. **Message:** "No packages available for Ghanaian Cedi"

### Test 8.2: No Currency Parameter
1. Access form without `&currency=` parameter
2. **Expected:** Defaults to NGN
3. **Verify:** Shows ₦ symbol and Nigerian states

### Test 8.3: Invalid Currency
1. Access form with `currency=INVALID`
2. **Expected:** Falls back to NGN

---

## Common Issues & Solutions

### Issue 1: Still Showing ₦ for GHS Orders
**Cause:** Browser cache or old Prisma client

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
pnpm db:generate

# Restart dev server
pnpm dev
```

### Issue 2: No Packages Show for GHS
**Cause:** Product has no GHS packages

**Solution:**
1. Go to Admin → Inventory → Product
2. Click "Packages" tab
3. Create package with currency = GHS

### Issue 3: Order Created with Wrong Currency
**Cause:** Currency parameter not being passed correctly

**Solution:**
1. Check URL includes `&currency=GHS`
2. Verify `parseCurrency()` function in `lib/currency.ts`
3. Check order creation in `app/actions/orders.ts`

### Issue 4: Mixed Currency in Dashboard
**Cause:** Currency filter not working

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check URL has `?currency=GHS` parameter
3. Verify dashboard queries filter by currency

---

## Success Criteria ✅

The Ghanaian order form is working correctly when ALL of these are true:

- [ ] GHS form URL loads without errors
- [ ] Packages show **GH₵** symbol (not ₦)
- [ ] Only GHS packages appear in GHS form
- [ ] Ghana regions/cities appear (not Nigeria states)
- [ ] Order submits successfully
- [ ] Created order has `currency = 'GHS'` in database
- [ ] Order displays GH₵120 in admin dashboard
- [ ] Order displays GH₵120 in sales rep dashboard
- [ ] Dashboard filter shows GHS orders separately from NGN
- [ ] No currency mixing anywhere in the system

---

## Quick Test Commands

### Database Checks
```sql
-- Check if product has GHS packages
SELECT p.name, pp.currency, pp.price, pp.quantity
FROM product_packages pp
JOIN products p ON p.id = pp."productId"
WHERE pp.currency = 'GHS' AND pp."isActive" = true;

-- Check recent GHS orders
SELECT
  "orderNumber",
  "customerName",
  currency,
  "totalAmount",
  state,
  "createdAt"
FROM orders
WHERE currency = 'GHS'
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check if ProductPrice migration worked
SELECT
  p.name,
  p.currency as "Primary Currency",
  COUNT(pp.id) as "Price Count",
  STRING_AGG(pp.currency::text, ', ') as "Available Currencies"
FROM products p
LEFT JOIN product_prices pp ON pp."productId" = p.id
WHERE p."isDeleted" = false
GROUP BY p.id, p.name, p.currency;
```

---

## Need Help?

If tests fail:
1. Check console for errors (F12 in browser)
2. Check server logs in terminal
3. Verify database migration completed
4. Review `CURRENCY_FIX_SUMMARY.md` for troubleshooting

---

**Start testing with Test 1 and work through each test sequentially!**
