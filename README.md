<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
  <rect width="800" height="200" fill="#243F14"/>
  <text x="400" y="110" font-family="Arial,sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">VENDORA</text>
  <text x="400" y="150" font-family="Arial,sans-serif" font-size="20" fill="#8CB87A" text-anchor="middle">Retail POS System</text>
</svg>

<p align="center">
  <strong>A modern Point of Sale system built for Filipino convenience stores, mini marts, and retail businesses.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.5-777BB4?style=flat&logo=php" alt="PHP 8.5"/>
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=flat&logo=laravel" alt="Laravel 13"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/Inertia-v3-9553E9?style=flat" alt="Inertia v3"/>
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat&logo=tailwindcss" alt="Tailwind v4"/>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql" alt="MySQL"/>
</p>

## Overview

Vendora is a full-featured retail management system with a modern POS terminal, inventory management, purchasing, reporting, AI-powered business assistant, and a public product catalog — all in one application.

## Features

### Point of Sale
- Fast checkout with barcode scanning and product search
- Multiple payment methods: Cash, GCash, Maya
- Discount management (percentage and fixed amount)
- Hold/resume transactions
- Thermal receipt printing
- Arrow key navigation and quick-add quantities
- Stock validation at checkout

### Inventory Management
- Stock in/out/adjust with full audit trail
- Real-time stock tracking
- Low stock and out of stock alerts
- Inventory transfers between locations
- Stock counts with reconciliation workflow

### Products
- Product catalog with categories, brands, and variants
- Barcode generation (Code128, EAN-13, UPC-A, QR)
- Image upload or URL import
- Status management (active/inactive/discontinued)
- Bulk CSV import/export

### Purchase Orders
- Full procurement workflow
- Partial goods receiving
- Automatic inventory updates on receive
- Supplier management
- 6 print templates for PO forms and labels

### Sales & Reporting
- Sales history with void/return support
- Revenue charts and payment method breakdown
- Product performance analytics
- Cashier performance tracking
- Profit & loss reports
- Inventory health dashboard

### AI Assistant
- Natural language business queries
- 15 tools: sales overview, top products, expenses, customers, inventory
- SSE streaming responses
- Conversation history with rename/delete
- Knowledge base with 28 articles
- RBAC permission enforcement

### Public Catalog
- Landing page with hero, stats, featured products, categories
- Product catalog with search, filters, and sorting
- Product detail pages with related items
- Category browsing
- Promotions page
- Store information in footer
- Dark mode support

### Role-Based Access Control
- 27 permissions across 11 groups
- 3 roles: Owner, Manager, Cashier
- Granular sidebar and action filtering
- Permission management UI

### Additional Modules
- Customer management with purchase history
- Loyalty points and rewards system
- Expense tracking with categories
- Shift management
- Cash in/out tracking
- Activity logs
- Database backups
- Store settings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.5, Laravel 13 |
| Frontend | React 19, Inertia v3, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Database | MySQL |
| AI | OpenAI API (GPT-4.1-mini, DALL-E) |
| Auth | Laravel Fortify |
| RBAC | Spatie Laravel Permission |
| Charts | Recharts |
| Barcode | picqer/php-barcode-generator, JsBarcode |

## Installation

```bash
git clone https://github.com/mx-dln/vendora-web.git
cd vendora-web

# Backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

# Frontend
npm install
npm run build

# Serve
php artisan serve
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_URL` | Application URL |
| `DB_*` | Database connection settings |
| `OPENAI_API_KEY` | OpenAI API key (for AI assistant) |
| `PEXELS_API_KEY` | Pexels API key (for image search) |

## Default Accounts

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@vendora.test | password |
| Manager | manager@vendora.test | password |
| Cashier | cashier@vendora.test | password |

## Routes

### Admin (authenticated)
- `/dashboard` — Dashboard
- `/pos` — POS Terminal
- `/products` — Product Management
- `/sales` — Sales History
- `/inventory` — Inventory Management
- `/purchase-orders` — Purchase Orders
- `/customers` — Customer Management
- `/reports/*` — Reports & Analytics
- `/settings/*` — Settings

### Public (no auth required)
- `/` — Landing Page
- `/shop/products` — Product Catalog
- `/shop/products/{slug}` — Product Details
- `/shop/categories/{slug}` — Category Products
- `/shop/promotions` — Promotions

## License

MIT
