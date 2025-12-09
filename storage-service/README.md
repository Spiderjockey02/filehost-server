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

## 🖼️ Thumbnail Manager File Support

The Thumbnail Manager groups files into a few clear categories and generates previews accordingly.

### **Categories & How They’re Processed**

**Images** — JPG, PNG, WEBP, GIF, TIFF, BMP  
→ *Direct image resize.*

**Videos** — MP4, MKV, MOV, WebM, AVI, FLV  
→ *FFmpeg snapshot.*

**Text-Based Files** — TXT, JSON, XML, JS, PHP, YAML/YML, RTF  
→ *Renders some lines of text into a styled preview.*

**PDF** — PDF  
→ *First page → image.*

**Documents** — DOC/DOCX/ODT, XLS/XLSX/ODS, PPT/PPTX/ODP  
→ *Document conversion → preview render.*

---

## 🌐 Supported Storage Backends

* **Local filesystem**
* **Any S3-compatible provider** (AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces, Backblaze B2, etc.)
* **SFTP providers**

---

## 📦 Installation

Full installation documentation: **[here](https://docs.egglord.dev/docs/filehost-setup/installation)**.

---