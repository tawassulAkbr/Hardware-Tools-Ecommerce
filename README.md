# ToolKit

ToolKit is a hardware tools and safety equipment storefront built with React, Vite, Express, and Prisma.

## Demo accounts

Use these seeded accounts on the login page:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@toolkit.com` | `Admin123!` |
| Buyer | `buyer@toolkit.com` | `Buyer123!` |
| Sales Person | `sales@toolkit.com` | `Sales123!` |

The admin account opens the inventory and order dashboard. The buyer account can browse products and use the cart and checkout flows.

## Run locally

Start the backend from `backend` with `pnpm run dev`, then start the frontend from `frontend` with `npm run dev`.

## Order email

Checkout sends an order confirmation through SMTP when these values are present in `backend/.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@example.com
SMTP_PASS=your-password-or-app-password
SMTP_FROM=ToolKit <your-email@example.com>
```

Email delivery is non-blocking: an order can still be placed when SMTP is not configured.

## Google sign-in

Google sign-in uses Google Identity Services. Create a Web OAuth client in Google Cloud and add its client ID to the backend. The frontend fetches this configuration dynamically at runtime:

```env
# backend/.env
GOOGLE_CLIENT_ID=your-google-web-client-id
```

Add `http://localhost:5173` as an authorized JavaScript origin in Google Cloud. Google users are created as buyers; checkout asks for contact and delivery address details when those profile fields are missing.
