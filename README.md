# Premium Next.js UPI Payment Gateway 🚀

A highly responsive, standalone, and reusable UPI Payment Gateway designed for modern businesses. Built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase**, this gateway supports mobile deep-linking, desktop QR codes, secure manual administration, and **automated bank SMS webhook verification** out-of-the-box!

---

## ✨ Features
- **Responsive Dual-Screen UX**: 
  - **Desktop**: Automatically renders a high-fidelity QR Code (using `react-qr-code`) for customers to scan.
  - **Mobile**: Detects mobile browsers and offers direct deep-link triggers (Google Pay, PhonePe, Paytm, BHIM, or any generic UPI handler).
- **Automated SMS Verification Webhook**: Secure API route matching incoming credit alerts from major Indian banks (**IOB, SBI, HDFC, ICICI, and Axis Bank**) to instantly verify and credit orders.
- **Premium Admin Console**: Secure, password-protected portal showing live revenue metrics, transaction filters, and manual "Verify"/"Reject" overrides.
- **Dynamic Themes**: Tailored HSL CSS systems driven by a centralized business configuration.
- **PCI-DSS Compliance-friendly Architecture**: Database structure isolated from raw customer credentials, using unique session tokens for tracking.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons, React QR Code.
- **Backend**: Next.js Serverless API Routes.
- **Database**: Supabase (PostgreSQL).

---

## 📂 Project Structure
```
upi-payment-gateway/
├── app/
│   ├── page.js                     # Root redirect to /pay
│   ├── pay/
│   │   └── page.jsx                # Customer check-out form, QR generation, deep-linking
│   ├── status/
│   │   └── [orderId]/
│   │       └── page.jsx            # Live-status page (Polling every 10 seconds)
│   ├── admin/
│   │   └── page.jsx                # Admin metrics dashboard and override actions
│   └── api/
│       ├── orders/
│       │   └── route.js            # POST: Create a fresh order log in database
│       ├── payments/
│       │   └── pending/
│       │       └── route.js        # POST: Transition an order to 'pending' state
│       ├── admin/
│       │   ├── login/
│       │   │   └── route.js        # POST: Secure password verify
│       │   └── orders/
│       │       └── route.js        # POST: Admin manual verify/reject action endpoint
│       └── webhook/
│           └── sms/
│               └── route.js        # POST: SMS parser hook (matches amount & credits)
├── lib/
│   ├── config.js                   # All business details (Name, UPI, Theme, Webhook Secret)
│   ├── supabase.js                 # Database client exports (Public & Service Admin clients)
│   └── parseSms.js                 # Bank SMS Regex Parser (SBI, HDFC, ICICI, Axis, IOB)
├── .env.local                      # Private environment secrets
├── package.json                    # Dependencies & Run scripts
└── README.md                       # This instruction manual
```

---

## 🚀 Setup Instructions

### 1. Clone & Install Dependencies
Navigate to the project root and run:
```bash
npm install
```

### 2. Configure Environment Secrets
Create a file named `.env.local` in the root directory (already template-initialized) and fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_KEY=your_private_service_role_key   # Required for bypass RLS updates
ADMIN_PASSWORD=your_custom_admin_password           # Used to unlock the admin dashboard
```

### 3. Create the Database Schema
Sign in to your [Supabase Console](https://supabase.com), navigate to the **SQL Editor** of your project, and run the following query to initialize the `orders` table:

```sql
create table orders (
  id uuid default gen_random_uuid() primary key,
  amount numeric not null,
  method text,
  note text,
  status text default 'pending',
  utr text unique, -- Prevents double spending / double parsing
  customer_name text,
  customer_phone text,
  created_at timestamp default now(),
  verified_at timestamp
);

-- OPTIONAL: Create an index on status & amount for ultra-fast webhook lookups
create index idx_orders_status_amount on orders (status, amount);
```

---

## ⚙️ Customizing Business Settings (`lib/config.js`)
You can adjust the merchant credentials, quick amount buttons, and branding colors directly in [lib/config.js](file:///d:/Payment-Page/upi-payment-gateway/lib/config.js):

```js
export const CONFIG = {
  businessName: "Secure Pay",            // Your business/merchant name
  upiId: "your-merchant-upi-id@bank",   // Your business UPI address
  themeColor: "#1D9E75",                 // Theme color for cards & buttons (HSL/HEX)
  quickAmounts: [500, 1000, 2000, 5000], // Shortcuts on payment forms
  webhookSecret: "your_webhook_secret"   // Header secret to secure your SMS forwarder app
}
```

---

## 📱 Setting up the Android SMS Forwarder

To auto-verify payments without user intervention, we leverage an Android SMS Forwarder app running on your merchant phone that reads bank credit notifications and forwards them to your gateway.

1. **Install an SMS Forwarder App**:
   - Download a reputable SMS-to-webhook forwarder app on your merchant phone (such as **SMS to Webhook** or **SmsForwarder** on the Google Play Store).
2. **Configure Forwarding Rule**:
   - **Trigger**: Incoming SMS containing keywords like `credited`, `credit`, `received`, `deposited` (or matching specific Bank Sender IDs like `SBI`, `HDFC`, `IOB`, `ICICI`, `AXIS`).
   - **Target API URL**: `https://your-domain.com/api/webhook/sms` (e.g., your Vercel deployment URL).
   - **Method**: `POST`
   - **JSON Request Payload**:
     ```json
     {
       "secret": "your_config_webhook_secret",
       "message": "%body%"
     }
     ```
     *(Note: `%body%` will automatically inject the full text content of the received SMS)*.

---

## 🔄 Live Testing Flow

1. Start the local server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000/pay` in your browser.
3. Fill in the payment form (e.g. amount `₹500.00`, Customer: `John Doe`) and click **Generate QR**.
4. Click **I have paid successfully**. The screen will transition to the **Pending verification** polling spinner.
5. Simulate an incoming bank SMS by firing a mock API request to your webhook (simulate the Android forwarder app):
   ```bash
   curl -X POST http://localhost:3000/api/webhook/sms \
     -H "Content-Type: application/json" \
     -d '{
       "secret": "your_webhook_secret",
       "message": "Dear Customer, your a/c no. XXXXXX1234 is credited by Rs. 500.00 on 22-05-2026 by UPI Ref No 612345678901 -SBI"
     }'
   ```
6. **Watch the Magic**: Instantly, the customer status screen will update to **Verified** showing a green success animation and transaction receipt, while the **Admin Dashboard** updates its revenue totals!

---

## 🔗 Reusing This Gateway on Other Websites

This gateway is modular. To redirect users here from your primary landing page/website:
1. Simply direct users to your payment gateway URL with optional query parameters:
   `https://your-gateway.com/pay?amount=500&name=John&phone=9876543210`
2. We can configure `/pay` to auto-read query parameters to pre-populate checkout details immediately.

---

## 🛡️ Fraud Prevention Mechanics
- **Duplicate UTR Prevention**: The `utr` column in Supabase is marked `unique`. If a malicious actor sends the same bank SMS twice, the webhook will identify a `DUPLICATE_UTR` status and ignore the second attempt, preventing double-crediting.
- **Strict Webhook Secret**: Only requests carrying the correct `webhookSecret` in their payload are processed.
- **Relational Integrity**: Uses PostgreSQL transaction layers to guarantee state transitions.
