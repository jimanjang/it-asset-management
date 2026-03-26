# IT Asset & Security Management System (Chrome OS Flex)

A comprehensive dashboard and backend system for managing IT assets, Chrome OS Flex devices, and software licenses (SaaS). 

## 🛠 Tech Stack
- **Frontend**: Next.js 16 (Turbopack), React, TailwindCSS, Recharts
- **Backend**: NestJS, TypeORM
- **Database**: SQLite (built-in)
- **Integrations**: Google Workspace Admin API, Notion API (SaaS Sync)

## 🚀 Features
- **Dashboard**: Real-time overview of active devices, asset cost analysis, and system activity logs.
- **Device Management (Chrome OS Flex)**: Syncs raw device telemetry (CPU, RAM, Network) from Google Workspace.
- **Asset Management**: Maps physical assets to synced Google devices and tracks provisioning status.
- **SaaS License Sync**: Tracks managed users and software licenses using internal mappings.

## ⚙️ How to Run Locally

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
> The backend will start on `http://localhost:4001`. Data is saved locally in `backend/data/`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> The frontend will start on `http://localhost:3001` with Turbopack enabled.

## 📝 Note on Version Control
Standard development folders such as `node_modules`, Next.js build cache (`.next`), and local DB files (`*.sqlite`) are globally ignored via `.gitignore` to maintain repository hygiene and avoid commit conflicts.
