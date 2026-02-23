# 🎓 Student Management System
## Node.js + TypeScript — Zero Framework Microservices

A production-ready microservices backend built using **only Node.js built-ins + TypeScript**.  
No Express — just `node:http`, custom routing, and clean architecture.

## Architecture

```
Client
  │
  ▼
API Gateway :3000          ← Pure Node http.createServer + custom router
  |─ /api/v1/auth/**   →  Auth Service :3001      (JWT + RBAC + refresh tokens)
  ├─ /api/v1/students/** →  Student Service :3002   (CRUD + pagination + Redis cache)
  └─ /api/v1/notifications/** → Notification Service :3003 (RabbitMQ consumer)

Infrastructure:
  MongoDB ×3   (auth_db | student_db | notification_db — separate per service) | separate database
  Redis        (token blacklist + response caching)
  RabbitMQ     (topic exchange: student.created, student.deleted, user.registered)
```

---


| URL | Description |
|-----|-------------|
| http://localhost:3000/api-docs | Swagger UI |
| http://localhost:3000/health | Gateway health |
| http://localhost:3001/health | Auth health |
| http://localhost:3002/health | Student health |
| http://localhost:3003/health | Notification health |
| http://localhost:15672 | RabbitMQ (admin/admin123) |

---

## 💻 Local Development (Without Docker)

**Step 1 — Open Docker and Run Each Container**
```bash
docker ps
docker start redis rabbitmq mongo-auth mongo-student mongo-notification
```

**Step 2 — Run each service** (4 terminals)
```bash
# Terminal 1
cd auth-service && npm install && npm run dev

# Terminal 2
cd student-service && npm install && npm run dev

# Terminal 3
cd notification-service && npm install && npm run dev

# Terminal 4
cd api-gateway && npm install && npm run dev
```

The `.env` files are already included for local development.

---

## Key Design Decisions

**Why no framework?**  
Shows deep understanding of how HTTP servers work. Every middleware, router, and proxy is hand-built using `node:http` primitives.

**Separate MongoDB per service**  
True service isolation — auth, student, and notification databases are completely independent.

**Token security**  
- Refresh token rotation on every use
- Token reuse detection revokes all sessions
- Blacklist via Redis with matching TTL


**RabbitMQ events**  
Topic exchange with routing keys. Failed messages retry up to 3x before being dropped.
