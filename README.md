# Rathinam Operations ERP - Frontend (Reoprt-FE)

Enterprise Operations Reporting & Data Entry Portal for Rathinam Group of Institutions.

## 🚀 Overview
A high-performance React + Vite frontend application designed for campus operations tracking across Food & Dining, Hostel Occupancy, and Transport Fleet.
Configured for production deployment under `rguedu.in/Report/` and isolated API proxying.

## 🛠️ Tech Stack
- **Framework:** React 19 + Vite 6
- **Styling:** Inline CSS + Modern Glassmorphism & Card Design
- **Icons:** Lucide React
- **HTTP Routing & API Interception:** Subpath-aware fetch proxy (`/Report/api`)

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Runs at `http://localhost:5173/Report/` with automatic redirects from `/` to `/Report/`.

### 3. Production Build
```bash
npm run build
```
Generates production-ready static assets in `dist/` configured with `base: '/Report/'`.

## 📂 Key Modules
- **Operations Dashboard:** Live KPI cards, monthly expense by category, multi-chart analysis, and cost head distribution.
- **Data Entry Workstation:** Matrix-style expense entry, subtotal calculation, "Clone from Prev" option, and period locking.
- **Master Data Manager:** Cost head and category ordering, custom cycle creator, and deletion tools.
- **System Settings & Auth:** Role-based access control, secure authentication, and database status indicator.
