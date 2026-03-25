# 🌐 Website - Frontend (Next.js + React)

This package contains the complete frontend application for the cloud storage platform. It is responsible for all user-facing functionality, including file management, uploads, authentication flows, and interaction with backend services.

## 📦 Scope

The website is a standalone module within the larger filehost-server system and:
- Communicates with the [Storage Service Backend](../storage-service/) via REST APIs
- Handles all UI/UX concerns using React and Bootstrap
- Manages client-side state and interactions with React Query
- Does not contain business-critical logic (enforced by backend)
- Server-side rendering and optimization via Next.js

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Full-stack React framework with SSR & API routes |
| **React 19** | Component-based UI framework |
| **TypeScript** | Type-safe development |
| **Bootstrap 5** | Component library & styling |
| **React Query** | Server state management & caching |
| **BetterAuth** | Authentication & session management |
| **Stripe/Billing** | Subscription and payment handling |
| **Prisma** | Database ORM for client queries |
| **Socket.io** | Real-time functionality (notifications, activity) |
| **Axios** | HTTP client for API requests |
| **Chart.js** | Dashboard analytics & charts |
| **Monaco Editor** | Code editor component |
| **SASS** | CSS preprocessing |

## ✨ Key Features

- **🔐 User Authentication** – BetterAuth integration with email/OAuth support
- **📁 File & Folder Management** – Browse, organize, and manage files with intuitive UI
- **📤 Upload System** – Concurrent uploads with progress tracking and cancellation
- **🖼 Previews & Thumbnails** – Image, video, and PDF previews powered by backend
- **🔔 Real-time Notifications** – Socket.io for live activity updates
- **💳 Billing & Subscriptions** – Stripe integration for payment management
- **📊 Analytics Dashboard** – Charts and storage usage visualization
- **👥 Admin Panel** – User management, audit logs, and system monitoring
- **🔍 Search & Filtering** – Fast file discovery with advanced filters
- **📱 Responsive Design** – Bootstrap-powered mobile-friendly layouts

## 👥 Roles & Access

The UI supports two roles:

- ### 👤 User
    - Interacts with their own files and storage
    - Uploads, downloads, and manages content
    - Accesses billing and personal activity
- ### 🛠️ Admin
    - Accesses system-wide dashboards
    - Manages users and monitors activity
    - Performs moderation and oversight

## 🧱 Project Structure

```
src/
 ├─ auth/               # BetterAuth configuration and session management
 ├─ components/         # Reusable React components (buttons, modals, cards, etc.)
 ├─ layouts/            # Layout wrappers (app layout, auth layout, etc.)
 ├─ pages/              # Next.js route pages and API routes
 ├─ services/           # API client layer for communicating with storage-service backend
 ├─ styles/             # Global styles and SASS modules
 ├─ types/              # TypeScript type definitions and interfaces
 ├─ utils/              # Helper functions and utilities
 ├─ config.ts           # Environment and feature configuration (copy from config.example.ts)
 ├─ prisma.config.ts    # Prisma configuration
 └─ proxy.ts            # Backend proxy/API configuration
```

### Key Directories

- **`/auth`** – BetterAuth setup, middleware, and session utilities
- **`/components`** – Reusable UI components organized by feature
- **`/pages`** – Next.js pages (file browser, admin, billing, etc.) and API routes
- **`/services`** – API client functions that call the storage-service backend
- **`/types`** – Shared TypeScript interfaces (File, User, Session, etc.)

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- Copy `config.example.ts` to `config.ts` and configure environment variables
- Backend storage-service must be running (see [Storage Service README](../storage-service/README.md))

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run db` | Open Prisma Studio for database browsing |

## 🔌 API Integration

The frontend communicates with the [Storage Service Backend](../storage-service/) using:

- **REST APIs** – HTTP requests for CRUD operations on files/folders
- **Authentication** – BetterAuth session tokens in request headers
- **JSON Payloads** – Structured data for file metadata and operations
- **Streaming Uploads** – Multipart form-data for file uploads with progress
- **Real-time Updates** – Socket.io events for live notifications

### Backend Communication

All backend API calls are organized in the `/services` directory:
- File operations (upload, download, rename, move, delete)
- Folder management
- User profile and settings
- Billing and subscription queries
- Admin operations (user management, audit logs)

**Example:**
```typescript
// services/filesService.ts
export async function uploadFile(file: File, folderId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', folderId);
  
  return axios.post('/api/storage/upload', formData);
}
```

## 📤 Upload System

A global upload manager handles all file uploads with:

- **Concurrent Uploads** – Multiple files upload in parallel
- **Progress Tracking** – Per-file and global progress percentages
- **ETA Calculation** – Estimated time remaining for completion
- **Cancellation** – Stop individual uploads or all queued uploads
- **Resume Support** – Continue failed uploads (handled by backend)
- **Queue Management** – React Context Provider for global state
- **Automatic UI Updates** – Re-render on upload progress/completion

The upload system is implemented as a React Context and custom hooks for easy use throughout the app.

## 🔐 Authentication

### BetterAuth Integration

The app uses [BetterAuth](https://www.better-auth.com/) for secure authentication:

- **Email/Password** – Traditional login and registration
- **OAuth Providers** – Social login support (Google, GitHub, etc.)
- **Session Management** – Automatic token refresh and session validation
- **Backend Validation** – All API requests require valid authentication tokens

**Auth Flow:**
1. User logs in via `/auth/signin` page
2. BetterAuth validates credentials and creates session
3. Session token stored in secure HTTP-only cookie
4. Subsequent API requests include authentication header
5. Backend validates session and processes request

### Auth Files
- `/auth/betterAuth.ts` – BetterAuth client configuration
- `/auth/proxy.ts` – Auth guards for protected routes
- `/pages/auth/*` – Sign-in, sign-up, and password reset pages

## 🎨 Styling & Components

- **Bootstrap** – Pre-built responsive components
- **SASS/SCSS** – Custom styling with variables and mixins
- **Responsive Design** – Mobile-first approach with breakpoints

## 📊 Admin Dashboard

The admin panel provides system-wide insights:

- **User Management** – View, disable, or reset user accounts
- **Audit Logs** – Track file operations, logins, and system events
- **Storage Analytics** – Usage breakdown by user and file type
- **System Monitoring** – Server health, uptime, and performance metrics
- **Job Management** – View and trigger background tasks via storage-service

### Common Issues

| Issue | Solution |
|-------|----------|
| `TypeError: fetch failed` | Ensure storage-service backend is running at configured URL |
| `401 Unauthorized` | Check BetterAuth session and ensure cookies are enabled |
| `CORS errors` | Verify backend CORS settings allow frontend origin |
| `Missing config.ts` | Copy `config.example.ts` to `config.ts` and update values |