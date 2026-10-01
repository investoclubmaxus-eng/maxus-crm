# MAXUS CRM

Multi-company CRM/ERP platform built with Laravel and React.

---

## 1. Project Overview

MAXUS CRM is a multi-company CRM/ERP platform.

The application uses:

- One Laravel backend
- One React frontend
- One central Super Admin database
- Separate database for each company
- REST APIs between React and Laravel
- Dynamic company database switching

The first company database is the existing Maxus Foundation CRM database.

---

# 2. Technology Stack

## Backend

- Laravel 13
- PHP 8.5.10
- MySQL
- Laravel REST API
- Laravel Sanctum — planned for authentication

## Frontend

- React 19.3.0
- React DOM 19.3.0
- Vite 8
- Tailwind CSS 4

## Development Tools

- Node.js 26.8.2
- npm
- Composer 2.10.3
- XAMPP
- Apache
- MySQL
- phpMyAdmin

---

# 3. Installed React Libraries

The following frontend libraries are currently installed.

### React Router

Package:

`react-router-dom`

Purpose:

- Frontend routing
- Super Admin routes
- Company routes
- Protected routes
- Company switching

---

### Axios

Package:

`axios`

Purpose:

- Laravel API requests
- GET/POST/PUT/DELETE requests
- Authentication requests
- Sending form data
- API error handling

---

### TanStack Query

Package:

`@tanstack/react-query`

Purpose:

- API data fetching
- Server-state management
- Caching
- Refetching
- Loading/error states

---

### Lucide React

Package:

`lucide-react`

Purpose:

- Application icons
- Sidebar icons
- Buttons
- Tables
- Actions
- UI components

---

### React Hook Form

Package:

`react-hook-form`

Purpose:

- Form management
- Form state
- Validation integration
- Reducing unnecessary re-renders

---

### Zod

Package:

`zod`

Purpose:

- Data validation
- Form validation
- API/input schema validation

---

### React Hook Form Resolver

Package:

`@hookform/resolvers`

Purpose:

- Connects Zod validation with React Hook Form

---

### Sonner

Package:

`sonner`

Purpose:

- Success notifications
- Error notifications
- Warning/info notifications
- Toast messages

---

### date-fns

Package:

`date-fns`

Purpose:

- Date formatting
- Date calculations
- Date comparisons
- CRM follow-up dates
- Task dates
- Reports

---

### Recharts

Package:

`recharts`

Purpose:

- Dashboard charts
- Lead reports
- Performance reports
- Company reports
- Super Admin global reports

---

# 4. Current Package Versions

Current frontend dependencies:

```text
react                 19.3.0
react-dom             19.3.0
react-router-dom
axios
@tanstack/react-query
lucide-react
react-hook-form
zod
@hookform/resolvers
sonner
date-fns
recharts