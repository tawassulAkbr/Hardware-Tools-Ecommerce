# ToolKit API

Base URL: `/api`

## Authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create buyer account |
| POST | `/auth/login` | Public | Sign in |
| POST | `/auth/logout` | Authenticated | Revoke session |
| GET | `/auth/profile` | Authenticated | Read current profile |
| PATCH | `/auth/profile` | Authenticated | Update current profile |
| DELETE | `/auth/profile` | Authenticated | Deactivate current profile |

## Catalogue and cart

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/products` | Public | Search and filter products |
| GET | `/products/:productId` | Public | Read one product |
| POST | `/products` | Admin, Sales Person | Create product |
| PUT | `/products/:productId` | Admin, Sales Person | Update product/inventory |
| DELETE | `/products/:productId` | Admin, Sales Person | Delete product |
| POST | `/products/upload-image` | Admin, Sales Person | Upload product image |
| GET | `/categories` | Public | Read categories and subcategories |
| GET | `/cart` | Buyer, Admin | Read current cart |
| POST | `/cart/items` | Buyer, Admin | Add cart item |
| PUT | `/cart/items/:itemId` | Buyer, Admin | Update quantity |
| DELETE | `/cart/items/:itemId` | Buyer, Admin | Remove cart item |
| DELETE | `/cart` | Buyer, Admin | Clear cart |

## Orders

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/orders` | Buyer, Admin | Checkout and create order |
| GET | `/orders` | Buyer, Admin | Read current user's orders |
| GET | `/orders/:orderId` | Buyer, Admin | Read one owned order |
| PATCH | `/orders/:orderId/status` | Buyer, Admin | Cancel or request return |
| GET | `/orders/track/:orderId` | Public | Read delivery tracking details |

## Administration

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/dashboard` | Admin | Read operational summary |
| GET/POST | `/admin/users` | Admin | List/create accounts |
| PATCH/DELETE | `/admin/users/:userId` | Admin | Update/deactivate account |
| GET/PATCH | `/admin/orders/:orderId` | Admin, Sales Person | Manage order fulfilment |
| GET | `/admin/logs` | Admin | Read execution logs |
| GET/PATCH | `/admin/maintenance` | Admin | Read/update system settings |
