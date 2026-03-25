<div align="center">

<div id="header"> 

# FileHost Server

</div>

![GitHub License](https://img.shields.io/github/license/Spiderjockey02/filehost-server)
![GitHub Stars](https://img.shields.io/github/stars/Spiderjockey02/filehost-server?style=social)
![GitHub Issues](https://img.shields.io/github/issues/Spiderjockey02/filehost-server)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Node.js](https://img.shields.io/badge/Node.js-24+-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)

> **A feature-rich, enterprise-grade cloud storage platform** with drag-and-drop uploads, real-time collaboration, admin dashboards, and multi-provider storage support. Built for scale, security, and great UX.
</div>

---

## ✨ What Makes FileHost Special

- 🎯 **Production Ready** – Fully featured cloud storage system deployed and tested.  
- 🔄 **Multi-Provider** – Seamlessly switch between Local FS, AWS S3, MinIO, and SFTP.
- 🚀 **High Performance** – Real-time uploads, smart queuing, and instant search.  
- 🔐 **Enterprise Secure** – BetterAuth integration, RBAC, audit logging, and more.
- 📊 **Analytics Ready** – Real-time dashboards, user activity tracking, storage metrics.
- ⚙️ **Fully Customizable** – Open-source, modular architecture, TypeScript throughout.

---

## 🎯 Key Features at a Glance

| Category | Features |
|----------|----------|
| **📤 Upload & File Management** | Drag-and-drop uploads • Multi-file concurrent • Pause/resume • ETA tracking • Upload cancellation • Folder management • Breadcrumb navigation • Soft-delete & recovery • Restore from trash |
| **🖼️ Media & Previews** | Image thumbnails • Video snapshots • PDF previews • Document support • EXIF extraction • Video metadata • Caching • Text syntax highlighting |
| **🌐 Storage Flexibility** | Local FS • AWS S3 • MinIO • Cloudflare R2 • DigitalOcean Spaces • Backblaze B2 • SFTP • Zero code changes |
| **🔍 Search & Organization** | Full-text search • File type filters • Date/size filtering • Bulk operations • Multi-select • Keyboard shortcuts • Saved searches • Fast pagination |
| **🔐 Security & Auth** | BetterAuth OAuth • Email/password • Social login • Role-based access • Per-user permissions • Session auto-refresh • Audit logging • IP tracking |
| **📊 Admin Dashboard** | Real-time monitoring • Activity logs • Storage breakdown • Health metrics • User management • Password reset • Job management • Cache tools |
| **♻️ Background Jobs** | CRON scheduler • Hot-reload • No restarts • File cleanup • Backup scheduling • Preview pre-generation • Activity archival • Custom jobs |
| **💳 Billing** | Stripe integration • Multiple plans • Usage-based • Quota enforcement • Auto upgrade/downgrade • Invoice history • Analytics |
| **📱 User Experience** | Responsive design • Dark mode • Keyboard shortcuts • Drag-and-drop • Real-time notifications • Progress indicators • WCAG compliant • Smooth animations |

---

## 🏗️ Architecture

FileHost Server is a **modular, full-stack application** with clear separation of concerns:

```
filehost-server/
├─ website/              # React + Next.js Frontend
│   ├─ User interface & file browser
│   ├─ BetterAuth integration
│   ├─ Real-time notifications
│   └─ Admin dashboard
│
├─ storage-service/      # Express Backend API
│   ├─ File operations & queue management
│   ├─ Storage provider abstraction
│   ├─ Thumbnail generation
│   ├─ Audit logging & activity tracking
│   └─ Background job scheduling
└─ 
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | Web application & SSR |
| **Backend** | Express, Node.js 24+, TypeScript | REST API & file operations |
| **Database** | Prisma 7, MySQL/MariaDB | Data persistence |
| **Storage** | Sharp, Canvas, FFmpeg | Image/video processing |
| **Auth** | BetterAuth, Stripe | Authentication & payments |
| **Real-time** | Socket.io, WebSockets | Live updates & notifications |
| **Cloud** | AWS SDK, SSH2 | Multi-provider support |
| **Logging** | Pino, Structured logs | Debugging & monitoring |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 24+ and npm.
- MySQL 8.0+ or MariaDB 10.5+.
- Git.
- (Optional) FFmpeg for thumbnail generation.

###  Documentation

- **[Backend Setup](./storage-service/README.md)** – Storage Service API configuration and running.
- **[Frontend Setup](./website/README.md)** – Website frontend setup and development.
- **[Full Documentation](https://docs.egglord.dev/docs/filehost-setup/installation)** – Production deployment and advanced guides.

---

## 🎯 Use Cases

| Segment | Best For | Key Benefits |
|---------|----------|--------------|
| **📊 Enterprises** | Private cloud storage • GDPR compliance • multi-user collaboration • on-premises deployment | Admin controls • audit trails • permissions • full data control • compliance ready |
| **🏢 Organizations** | Team file sharing • automated backups • per-user quotas • activity auditing | Collaboration tools • archival solutions • billing per user • compliance tracking |
| **👥 Developers** | Self-hosted alternative • learning platform • custom integrations • base for extensions | Open-source • full codebase • TypeScript • easy to customize • API integration |
| **🚀 Hosters** | White-label solution • multi-tenant • subscription management • revenue generation | Customizable branding • scalable architecture • billing built-in • margin through pricing |

---

## 📸 Screenshots

### Admin Dashboard
<table align="center">
  <tr>
    <td style="text-align:center; padding: 10px;">
      <img src="https://github.com/Spiderjockey02/filehost-server/blob/rewrite/docs/images/admin-dashboard.png?raw=true" alt="Admin Dashboard" width="400" />
      <br><strong>System Overview</strong>
    </td>
    <td style="text-align:center; padding: 10px;">
      <img src="https://github.com/Spiderjockey02/filehost-server/blob/rewrite/docs/images/admin-users-dashboard.png?raw=true" alt="Users Management" width="400" />
      <br><strong>User Management</strong>
    </td>
  </tr>
  <tr>
    <td style="text-align:center; padding: 10px;">
      <img src="https://github.com/Spiderjockey02/filehost-server/blob/rewrite/docs/images/admin-files-dashboard.png?raw=true" alt="File Management" width="400" />
      <br><strong>File Monitoring</strong>
    </td>
    <td style="text-align:center; padding: 10px;">
      <img src="https://github.com/Spiderjockey02/filehost-server/blob/rewrite/docs/images/admin-network-dashboard.png?raw=true" alt="Network Stats" width="400" />
      <br><strong>Network Analytics</strong>
    </td>
  </tr>
</table>

---

## 📋 Project Structure

```
filehost-server/
├─ website/                       # Frontend application (Next.js + React)
│  ├─ src/
│  │  ├─ auth/                   # Authentication logic
│  │  ├─ components/             # React components
│  │  ├─ pages/                  # Next.js pages & routes
│  │  ├─ services/               # API client layer
│  │  └─ ...
│  └─ package.json
│
├─ storage-service/               # Backend API (Express)
│  ├─ src/
│  │  ├─ accessors/              # Database layer
│  │  ├─ controllers/            # Route handlers
│  │  ├─ helpers/                # Business logic & managers
│  │  ├─ middleware/             # Auth, validation, error handling
│  │  ├─ routes/                 # API endpoints
│  │  └─ ...
│  ├─ prisma/
│  │  ├─ schema.prisma           # Data model
│  │  └─ migrations/             # Database migrations
│  └─ package.json
```

---

## 🔒 Security

- **Authentication** – BetterAuth with OAuth support
- **Authorization** – Role-based access control (RBAC)
- **Encryption** – HTTPS/TLS in production
- **Audit Logs** – Complete activity tracking
- **Input Validation** – Zod validation on all endpoints
- **Rate Limiting** – Prevent abuse and DDoS
- **Data Isolation** – Per-user file visibility
- **Secure Sessions** – HTTP-only cookies

See [SECURITY.md](./docs/SECURITY.md) for more details.

---

## 📝 License

This project is licensed under the Apache License - see [LICENSE](./docs/LICENSE) for details.

---

## 🙋 FAQ

**Q: Can I use this commercially?**  
A: Yes! Apache license allows commercial use. Just follow the license terms.

**Q: Does it support multiple storage providers?**  
A: Yes! Use Local FS, S3, MinIO, SFTP, and more. Switch providers anytime.

**Q: Is it production-ready?**  
A: Yes! It's actively used in production with proper deployment setup.

**Q: How do I scale it?**  
A: Use a managed database, cloud storage backend, and containerize with Docker.

**Q: Can I white-label it?**  
A: Yes! Customize branding, colors, logos, and domain names completely.

---

## 📞 Support & Community

- **Issues** – Report bugs or request features on [GitHub Issues](https://github.com/Spiderjockey02/filehost-server/issues).
- **Discussions** – Join community discussions for questions and ideas.
- **Docs** – Check [https://docs.egglord.dev/](https://docs.egglord.dev/) for detailed guides.
- **Code of Conduct** – Read [CODE_OF_CONDUCT.md](./docs/CODE_OF_CONDUCT.md).

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [Express](https://expressjs.com/), and [Prisma](https://www.prisma.io/).
- Authentication by [BetterAuth](https://www.better-auth.com/).
- File processing with [Sharp](https://sharp.pixelplumbing.com/), [Canvas](https://www.npmjs.com/package/canvas), [FFmpeg](https://ffmpeg.org/).
- Storage abstraction for multiple cloud providers.

---

<div align="center">

**[⬆ Back to top](#header)**

Made with ❤️. [Star us on GitHub](https://github.com/Spiderjockey02/filehost-server) ⭐

</div>