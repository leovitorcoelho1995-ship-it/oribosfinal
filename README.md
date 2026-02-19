# AutoGestão - Business Management System

A complete web application for business management featuring:
- **Dashboard**: Overview of appointments, leads, and financials.
- **Clients**: Management of client database.
- **Agenda**: Scheduling and appointment tracking.
- **Leads**: Kanban board for sales pipeline.
- **Financial**: Accounts receivable and payment tracking.
- **Settings**: System configuration and WhatsApp integration templates.

## 🚀 Getting Started

### 1. Database Setup
The application requires Supabase as the backend.
Run the provided SQL schema in your Supabase SQL Editor:
`AutoGestao/supabase_schema.sql`

### 2. Configuration
Ensure your `.env` file is configured with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Installation
Install project dependencies:
```bash
npm install
```

### 4. Running the App
Start the development server:
```bash
npm run dev
```
Access the app at `http://localhost:5173`.

## 🛠 Tech Stack
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Dates**: date-fns

## 📱 Features
- **Responsive Design**: Works on Desktop and Mobile.
- **Real-time Data**: Connects directly to Supabase.
- **Theme**: Premium Dark/Light mode support.
