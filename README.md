# eSpecialty — E‑Commerce Platform

> 🛍️ Full‑stack e‑commerce with Admin and Client apps, Node/Express API, MongoDB, and integrations (PayPal, VNPay, GHN, Gmail API).

### 🚀 TL;DR (Quickstart)
```bash
# From project root
cd server && npm install && cd ..
cd client && npm install && cd ..
cd admin && npm install && cd ..

# Dev servers
cd server && npm run dev        # http://localhost:8000
# in new terminals
cd client && npm run dev        # http://localhost:5173
cd admin && npm run dev         # http://localhost:5174
```

### 🏗️ Architecture
- API (server): Node.js + Express, MongoDB, Cloudinary, Payment + Shipping + Email services
- Client (customer‑facing): React (Vite), TailwindCSS
- Admin (seller/ops): React (Vite), TailwindCSS
- 3rd‑party: PayPal (Sandbox), VNPay (Sandbox), GHN (shipping), Gmail API (OAuth2)

```
[Client (Vite/React)]  ---->                     
                        \\                      
                         --> [Express API] --> [MongoDB]
                        //           |--> PayPal / VNPay
[Admin (Vite/React)]  ---->          |--> GHN (shipping)
                                     |--> Gmail API (email)
```

### 🧭 Project Structure
```
/ (monorepo)
├─ server/      # Node/Express API, models, routes, controllers, services
├─ client/      # Customer UI (Vite + React)
├─ admin/       # Admin UI (Vite + React)
├─ SECURITY.md  # Security guidelines
├─ GHN_INTEGRATION.md
├─ PAYPAL_API_DOCUMENTATION.md
├─ VNPAY_INTERGRATION.md
```

### 🔐 Environment Setup
- Create `.env.development` in `server/` (dev) and set frontend env in `client/` + `admin/`.
- Defaults are set for local dev URLs.

Server (`server/.env.development`):
```env
# Core
SERVER_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# PayPal (Sandbox)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_WEBHOOK_SECRET=your_webhook_secret

# VNPay (Sandbox)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_HOST=https://sandbox.vnpayment.vn
VNPAY_PAYMENT_ENDPOINT=paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8000/api/payment/vnpay/return
# IPN defaults to ${SERVER_URL}/api/payment/vnpay/ipn
# VNPAY_IPN_URL=optional_override

# GHN (Sandbox)
GHN_TOKEN=your_ghn_token
GHN_SHOP_ID=your_shop_id

# Gmail API (OAuth2)
GMAIL_CLIENT_ID=your_google_oauth_client_id
GMAIL_CLIENT_SECRET=your_google_oauth_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
GMAIL_EMAIL=your_sender_email@gmail.com
```

Frontends (`client/.env` and `admin/.env`):
```env
VITE_BACKEND_URL=http://localhost:8000
```

### ⚙️ Install & Run (Development)
1) Install dependencies per workspace
```bash
cd server && npm install && cd ..
cd client && npm install && cd ..
cd admin && npm install && cd ..
```
2) Start API
```bash
cd server && npm run dev     # http://localhost:8000
```
3) Start Client and Admin (in separate terminals)
```bash
cd client && npm run dev     # http://localhost:5173
cd admin && npm run dev      # http://localhost:5174
```
4) Optional: Create default admin account (run once)
```bash
cd server && node createAdmin.mjs
```
- Default admin credentials are defined in `server/.env.development`.

### 💳 Payments & Webhooks
- PayPal (Sandbox)
  - Webhook: `POST {SERVER_URL}/api/payment/paypal/webhook`
  - Requires valid `PAYPAL_WEBHOOK_ID` and `PAYPAL_WEBHOOK_SECRET`.
- VNPay (Sandbox)
  - Return URL: `{SERVER_URL}/api/payment/vnpay/return`
  - IPN URL: `{SERVER_URL}/api/payment/vnpay/ipn` (or override `VNPAY_IPN_URL`)

See `PAYPAL_API_DOCUMENTATION.md`, `VNPAY_INTERGRATION.md` for more.

### 🚚 Shipping & ✉️ Email
- GHN: set `GHN_TOKEN`, `GHN_SHOP_ID` in `server/.env.development`.
- Gmail API (OAuth2): set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_EMAIL` from Google Cloud.

For GHN details, see `GHN_INTEGRATION.md`.

### 🧪 Build & Preview (Production‑like)
```bash
# Frontends
cd client && npm run build && npm run preview
cd admin  && npm run build && npm run preview

# Server
cd server && npm run start
```

### 🧰 Scripts (selected)
- server: `npm run dev`, `npm run start`
- client: `npm run dev`, `npm run build`, `npm run preview`
- admin:  `npm run dev`, `npm run build`, `npm run preview`

### ⚠️ Common Issues
- PayPal/VNPay: wrong webhook URL or secrets → payment fails or status not synced
- Gmail API: missing/invalid refresh token → email not sent
- Ports in use: change Vite/Express ports or stop conflicting services

### 🔒 Security
See `SECURITY.md` for security practices and reporting.

### 📎 Tech Stack
- Node.js 18+, Express, MongoDB, Cloudinary
- React (Vite), TailwindCSS
- PayPal, VNPay, GHN, Gmail API

— Happy shipping! ✨
