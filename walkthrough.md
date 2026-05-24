# Walkthrough: Transition to UTR-based Automatic Payment Verification

I have completed the code modifications to fully support the secure transition from the decimal trick pricing model to the automated, UTR-based, exact-amount matching system using Cloudflare Email Workers and the new **alphanumeric Order ID format**.

---

## 🛠️ Changes Implemented

### 1. Updated Order Generation API
- **File modified:** [route.js](file:///d:/Payment-Page/upi-payment-gateway/app/api/orders/route.js)
- **Key changes:**
  - Integrated custom alphanumeric Order ID generation in the format `ORD-XXXXXXXX` (e.g., `ORD-A1B2C3D4`).
  - Extracted 8 unique uppercase/numeric characters using a robust character mapping loop.
  - Inserted the generated ID directly as the primary key `id` for PostgreSQL, ensuring a highly reliable transaction note length (< 12 characters total) that fits well within the 50-character limit of UPI apps.

### 2. Validated Frontend UPI Deep Linking & QR Codes
- **File validated:** [page.jsx](file:///d:/Payment-Page/upi-payment-gateway/app/pay/page.jsx)
- **Key validation:**
  - Confirmed that the `buildParams` generator maps the custom `orderId` directly into the `tn` (transaction note) field.
  - Verified that mobile deep-linking and desktop QR codes use this custom alphanumeric ID seamlessly, completely eliminating any dependency on fractional paisa decimals.

### 3. Configured & Fixed Cloudflare Worker Script
- **File modified:** [worker.js](file:///d:/Payment-Page/upi-payment-gateway/cloudflare-worker/worker.js)
- **Key changes:**
  - **Regex Expansion:** Updated the Order ID extraction regex to dynamically parse the new `ORD-XXXXXXXX` format while retaining a fallback match for legacy UUID-based orders:
    ```javascript
    const orderId = raw.match(/(ORD-[a-zA-Z0-9]{8})/i)?.[1] || raw.match(/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i)?.[1]
    ```
  - **Status Mismatch Fixed:** Changed the worker update payload to use `status: 'verified'` and `verified_at` instead of `'paid'` and `'paid_at'`. This aligns the worker perfectly with your database schema and the live checkout polling page (`app/status/[orderId]/page.jsx`), preventing endless loading screen spinners.

---

## ⚠️ Action Required: Supabase Database Migration

Because the initial schema setup created the primary key `id` column of the `orders` table as a `uuid` data type, trying to insert an alphanumeric string like `ORD-A1B2C3D4` will result in a PostgreSQL format syntax error. 

To fix this, you must convert the `id` column to a standard `TEXT` datatype. 

Please navigate to your **[Supabase Console SQL Editor](https://supabase.com)**, select your project, and execute the following query:

```sql
-- 1. Drop the primary key constraint temporarily
ALTER TABLE orders DROP CONSTRAINT orders_pkey;

-- 2. Alter the 'id' column datatype from UUID to TEXT
ALTER TABLE orders ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 3. Restore the primary key constraint
ALTER TABLE orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
```

> [!IMPORTANT]
> Running this migration query is safe and will preserve all your existing transaction logs in the database.

---

## 🚀 Verification and Deployment Plan

### 1. Verification of the Order Generation Endpoint
Once you execute the SQL migration query above, you can verify order creation by triggering a mock POST request to the API:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "method": "UPI",
    "customer_name": "Kunal Chauhan",
    "customer_phone": "9876543210"
  }'
```
It will successfully return a payload containing the alphanumeric Order ID format:
```json
{
  "orderId": "ORD-A1B2C3D4",
  "orderAmount": 100
}
```

### 2. Redeploying the Cloudflare Worker
Navigate to the `cloudflare-worker` directory and redeploy the updated worker script:
```bash
cd cloudflare-worker

# Deploy to Cloudflare (make sure wrangler login is completed)
npx wrangler deploy
```
