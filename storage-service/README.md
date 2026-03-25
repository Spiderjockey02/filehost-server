# Storage API Backend
This submodule powers the backend logic for the storage system. It handles file operations, uploads, storage providers, metadata, background jobs, notifications, user activity, and more. The storage layer is fully abstracted so it supports local FS, S3-compatible services, and SFTP.

---

## 🔧 What This Module Handles

* **Uploads**
* **Provider Abstraction** (Local, S3 providers, SFTP)
* **File Management** (rename, move, delete, restore)
* **Metadata Extraction** (width, height, camera, duration, FPS etc)
* **Thumbnail Generation** (FFmpeg)
* **Queue + Background Task System**
* **Dynamic CRON Job Scheduling** (auto-updating without restart)
* **Notifications System** (DB-backed event notifications)
* **User Activity Tracking** (IP, user agent, event audit)
* **Audit Logging** (file, system, user events and more)
* **System Managers** (trash cleanup, integrity checks, storage usage monitoring)
* **Route → Controller Logic Separation**

---

## 📁 Folder Structure Overview

```
src/
 ├─ accessors/     
 │    → Full Database Access Layer
 │
 ├─ controllers/   
 │    → Handles incoming route logic  
 │    → Calls accessors + system managers   
 │
 ├─ helpers/
 │    └─ SystemManagers/
 │         → FileSystem.ts    → Local FS operations
 │         → S3.ts            → S3-compatible provider interactions
 │         → SFTP.ts          → SFTP client wrapper
 │    → Client.ts                → Unified storage client
 │    → ConfigManager.ts         → Central config loader/validator
 │    → CRONManager.ts           → Dynamic cron scheduling system
 │    → FileOperationManager.ts  → High-level file manager
 │    → QueueManager.ts          → Global queue + status for handling burst activity, logs and notifications
 │    → StorageManager.ts        → Provider routing + path resolution
 │    → ThumbnailCreator.ts      → FFmpeg-based thumbnail generation
 │    → TrashHandler.ts          → Soft-delete & recycle-bin cleanup
 │    → UserActivityManager.ts   → Activity logging & audit trails
 │
 ├─ middleware/  → Validation / auth / error-handling
 ├─ routes/      → Definitions for all API endpoints
 ├─ types/       → Shared TS types & interfaces
 ├─ uploads/     → Default uploaded file location
 ├─ utils/       → Generic utility functions
 ├─ validators/  → Input schemas and request validators
 └─ index.ts     → entrypoint
```
---

## 🖼️ Thumbnail & Preview Generation

The Thumbnail Manager automatically generates preview images for a wide variety of file types.

### **Supported File Categories**

| Category | Formats | Processing Method |
|----------|---------|-------------------|
| **Images** | JPG, PNG, WEBP, GIF, TIFF, BMP | Sharp image resize & optimization |
| **Videos** | MP4, MKV, MOV, WebM, AVI, FLV | FFmpeg frame extraction |
| **Text Files** | TXT, JSON, XML, JS, PHP, YAML, RTF | Text rendering to canvas |
| **PDFs** | PDF | First page conversion to image |
| **Office Docs** | DOC, DOCX, ODT, XLS, XLSX, ODS, PPT, PPTX, ODP | Document conversion then render |

Thumbnails are cached and served efficiently. Pre-generation can be scheduled via CRON jobs.

---

## 🌐 Storage Backend Providers

The Storage Service abstracts all storage operations behind a unified interface. Switch providers without code changes:

### **Supported Backends**

| Provider | Setup | Use Case |
|----------|-------|----------|
| **Local Filesystem** | Default | Rapid testing, on-premises |
| **AWS S3** | AWS account & credentials | Production cloud storage |
| **MinIO** | Self-hosted S3-compatible server | Private cloud, on-premises |
| **Cloudflare R2** | Cloudflare account | CDN-powered edge storage |
| **DigitalOcean Spaces** | DO account | Affordable cloud storage |
| **Backblaze B2** | B2 account | Low-cost backup storage |
| **Other S3-compatible** | Custom endpoint | Any S3-compatible service |
| **SFTP** | SSH credentials & host | Remote server access |

### **How Provider Abstraction Works**

1. **ConfigManager** loads provider settings from environment or config file
2. **StorageManager** routes all operations to the appropriate system manager
3. **SystemManagers** (FileSystem, S3, SFTP) handle provider-specific details
4. **Controllers** make calls through the unified interface without knowing the backend

Simply change config values to switch providers—no code changes required!

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 24+** and **npm**
- **MySQL 8.0+** or **MariaDB 10.5+**
- **FFmpeg** (for video thumbnail generation) – [Download](https://ffmpeg.org/download.html)
- **Git** (for cloning and version control)
- Storage backend access (Local FS, S3 credentials, SFTP access, etc.)

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload (ts-node) |
| `npm run build` | Compile TypeScript to JavaScript (dist/) |
| `npm start` | Start production server (runs build first) |
| `npm run db` | Open Prisma Studio for database viewing |

---

## ⚙️ Configuration

### Environment Variables

```env
# Database connection string (MySQL or MariaDB)
DATABASE_URL="mysql://user:password@localhost:3306/filehost"

# BetterAuth secret key for session encryption
BETTER_AUTH_SECRET="your-secret-key-here"

# Frontend URL (for CORS and redirects)
FRONTEND_URL="http://localhost:3000"

# Server port (default: 9816)
PORT=9816

# Enable debug logging (default: true)
DEBUG=true
```

**Additional Configuration:**

Storage provider, S3 credentials, and other advanced settings may be configured through:
- Code configuration files in `/src` directory
- Database-stored configuration via admin panel
- Runtime environment detection

### Configuring Storage Providers

Storage provider configuration (Local FS, S3, SFTP) is typically managed through:

1. **Configuration Files** – Check `/src` directory for provider-specific configurations
2. **Environment Detection** – The system may auto-detect available storage based on installed dependencies
3. **Admin Panel** – Manage storage settings through the web interface
4. **Database Configuration** – Storage settings stored in the database and managed at runtime

For S3 or SFTP setup, refer to the project's configuration documentation or admin guides for detailed provider setup instructions.

---

## 🔐 Authentication & Security

### Session Management
- Uses **BetterAuth** for session handling
- Sessions stored in database with expiration
- Automatic token refresh on API calls
- HTTP-only cookies prevent XSS attacks

### Authorization
- **Accessors** validate user ownership of files
- **Controllers** check user roles (user / admin)
- **Middleware** enforces authentication on protected routes
- Backend validates all user actions

### Rate Limiting
- POST requests limited by IP to prevent abuse
- Configurable per-endpoint limits
- Returns 429 Too Many Requests when exceeded

### File Integrity
- File size validation on upload
- MIME type verification
- Checksum generation for integrity checking
- Soft-deletes prevent accidental data loss

---

## 🐛 Development & Debugging

### Debugging Tips
- **Prisma Studio** – Browse database: `npm run db`
- **Logging** – Structured logs with Pino
- **Network Inspection** – Use curl or Postman for API testing
- **Database Transactions** – Check migration status with Prisma

### Common Issues

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` (Database) | Ensure MySQL is running and DATABASE_URL is correct |
| `ENOENT` (uploads folder) | Ensure storage base path exists and is writable |
| `FFmpeg not found` | Install FFmpeg and add to PATH |
| `401 Unauthorized` | Check BetterAuth session configuration |
| `413 Payload Too Large` | Increase Express body size limit in index.ts |
| `Cannot write to S3 bucket` | Verify AWS credentials and bucket permissions |
