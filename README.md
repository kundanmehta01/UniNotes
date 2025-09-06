# UniNotesHub - PYQ Portal

A production-ready platform for uploading, browsing, and downloading University Previous Year Question papers.

## Architecture

- **Frontend**: React + Vite, Zustand for state management, React Query for server state, Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy, PostgreSQL database, S3-compatible file storage
- **Infrastructure**: Docker, CI/CD with GitHub Actions, monitoring with Sentry

## Project Structure

```
├── frontend/          # React frontend application
├── backend/           # FastAPI backend application
├── infra/            # Infrastructure as Code and deployment configs
├── docs/             # Additional documentation
└── docker-compose.yml # Local development environment
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 14+
- Docker and Docker Compose (optional, for local development)

### Local Development

1. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # Configure your environment variables
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local  # Configure your environment variables
   npm run dev
   ```

3. **Using Docker Compose**:
   ```bash
   docker-compose up --build
   ```

## Features

### MVP Features
- ✅ Email/password authentication with JWT
- ✅ File upload with metadata and moderation queue
- ✅ Advanced search and filtering by taxonomy
- ✅ Download tracking and analytics
- ✅ Admin moderation interface
- ✅ Bookmarking system
- ✅ Content reporting system

### Post-MVP Features
- 🔄 Google OAuth integration
- 🔄 Full-text search with OCR
- 🔄 Rating and recommendation system
- 🔄 In-app discussions
- 🔄 Mobile progressive web app

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


# UniNotesHub_Test
# UniNotesHub_Test
# UniNotesHub_re
# UniNotes
