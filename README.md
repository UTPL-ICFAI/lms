# LMS Learning Management System (MERN)

This repository contains a role-based Learning Management System built with **React (Vite + TailwindCSS + Axios)** and **Node.js/Express + MongoDB (Mongoose)**.

## Key Features

- JWT authentication with roles (`admin`, `faculty`, `student`, `parent`)
- Admin: user + course management, notices, and role-based data visibility
- Faculty: course management, attendance, notices, and doubt replies
- Student: enroll in courses, view attendance + notices, manage assignments/submissions, and raise doubts
- Doubt system with **real-time updates** (Socket.IO)
- AI Study Assistant with **RAG (materials-grounded answers)** via `/api/ai/chat-rag`

## Quick Start

### 1) Prerequisites

- Node.js + npm
- MongoDB (local or Atlas)

### 2) Configure environment

1. Backend env file: `server/.env`
2. Frontend env file: `frontend/.env`

Do **not** commit real secrets. This repo uses `server/.env` and `frontend/.env` as local configuration.

### 3) Run backend

```bash
cd server
npm install
npm run dev
```

Backend runs on `http://localhost:8000`.

### 4) Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Documentation

- Start here: `00_START_HERE.md`
- Architecture overview: `ARCHITECTURE_SUMMARY.md`
- Backend API + env details: `BACKEND_ANALYSIS.md`
- Frontend integration/setup guide: `FRONTEND_INTEGRATION_GUIDE.md`
- Template file descriptions: `FRONTEND_TEMPLATE_FILES_GUIDE.md`

## AI Study Assistant (RAG)

The student AI assistant can ingest uploaded files and answer **only from your ingested content**.

- **Ingest**: `POST /api/ai/ingest` (multipart form-data with `file` + `courseId`)
- **Chat (RAG)**: `POST /api/ai/chat-rag` (`message`, `courseId`, optional `mode`, `difficulty`)

Optional: If you configure MongoDB Atlas Vector Search and set `MONGO_VECTOR_SEARCH_INDEX`, the backend uses `$vectorSearch` for semantic retrieval.

