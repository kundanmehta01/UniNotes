# 🎓 UniNotesHub - Production Ready

A comprehensive university notes sharing platform built with FastAPI, React, and PostgreSQL. Now production-ready with Docker, AWS integration, and comprehensive deployment support!

## 🚀 Quick Deploy

```bash
# Clone and configure
git clone https://github.com/yourusername/uninoteshub.git
cd uninoteshub
cp .env.prod .env.prod.local

# Edit your environment variables
nano .env.prod.local

# Deploy with Docker
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d

# Run migrations and setup
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

**📖 Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)**

## ✨ Key Features

### For Students
- 📚 **Browse & Search** - Find exam papers by university, program, branch, semester
- ⬇️ **Download Papers** - Access previous years' question papers
- ⬆️ **Upload & Share** - Contribute papers to help fellow students
- 🔖 **Bookmarks** - Save papers for quick access
- ⭐ **Ratings & Reviews** - Rate papers for quality and relevance

### For Admins
- 🛡️ **Content Moderation** - Review and approve uploaded papers
- 👥 **User Management** - Manage student accounts and permissions
- 📊 **Analytics** - Track platform usage and engagement
- 🔒 **Security** - Monitor and manage platform security

### Technical Features
- 🔐 **Secure Authentication** - OTP-based login system
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🚀 **High Performance** - Redis caching and optimized queries
- 🔄 **Soft Delete** - Data recovery and audit trails
- 📧 **Email Integration** - SMTP and AWS SES support
- ☁️ **Cloud Storage** - AWS S3 and MinIO support
- 📈 **Monitoring** - Health checks and error tracking

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Reliable relational database
- **SQLAlchemy** - ORM with Alembic migrations
- **Redis** - Caching and rate limiting
- **Pydantic** - Data validation and settings
- **JWT** - Secure authentication
- **Boto3** - AWS integration

### Frontend
- **React 19** - Modern UI library
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy and static files
- **MinIO/S3** - File storage
- **AWS SES** - Email delivery
- **Sentry** - Error monitoring

## 📧 Email Configuration

### SMTP (Gmail, Outlook, etc.)
```bash
EMAIL_PROVIDER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### AWS SES (Production Recommended)
```bash
EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
SES_FROM_EMAIL=noreply@yourdomain.com
```

## 💾 Storage Options

### Local MinIO
Perfect for development and small-scale deployments:
```bash
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password123
S3_ENDPOINT=http://minio:9000
```

### AWS S3
Production-grade storage with CDN support:
```bash
S3_ENDPOINT=  # Empty for AWS S3
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-aws-key
S3_SECRET_KEY=your-aws-secret
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** on login attempts and uploads
- **File Type Validation** and size limits
- **CORS Protection** with configurable origins
- **SQL Injection Protection** via SQLAlchemy ORM
- **XSS Prevention** with proper sanitization
- **Soft Delete** for data recovery
- **Admin Controls** for content moderation

## 📊 Performance Optimizations

- **Redis Caching** for database queries
- **Database Indexing** on frequently accessed columns
- **File Compression** with gzip
- **Static Asset Caching** with long-term headers
- **Connection Pooling** for database efficiency
- **Lazy Loading** for large lists
- **Image Optimization** and compression

## 🐳 Docker Support

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
```

### Key Docker Features
- **Multi-stage builds** for optimized images
- **Health checks** for all services
- **Resource limits** for production
- **Volume persistence** for data
- **Network isolation** for security

## 📈 Monitoring & Logging

- **Health Checks** - `/healthz` endpoint
- **Structured Logging** - JSON formatted logs
- **Error Tracking** - Sentry integration
- **Performance Metrics** - Prometheus ready
- **Database Monitoring** - Query performance tracking
- **Rate Limit Monitoring** - Redis-based tracking

## 🔄 Deployment Options

### Cloud Platforms
- **AWS** - Full AWS integration (EC2, RDS, S3, SES)
- **Google Cloud** - GCP deployment ready
- **Azure** - Azure container instances
- **DigitalOcean** - App Platform or Droplets
- **Railway** - Simple deployment
- **Render** - Docker-based deployment

### Self-Hosted
- **VPS/Dedicated Server** - Ubuntu/CentOS deployment
- **Docker Swarm** - Multi-node orchestration
- **Kubernetes** - Container orchestration
- **Proxmox** - Virtualization platform

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📝 API Documentation

Once deployed, access interactive API documentation at:
- **Swagger UI**: `http://your-domain/docs`
- **ReDoc**: `http://your-domain/redoc`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/uninoteshub/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/uninoteshub/discussions)

## 🗺️ Roadmap

- [ ] **Mobile App** - React Native application
- [ ] **AI Features** - Smart paper categorization
- [ ] **Real-time Chat** - Student discussion forums
- [ ] **Notifications** - Real-time push notifications
- [ ] **Advanced Analytics** - Detailed usage insights
- [ ] **Multi-language** - International support

---

**Made with ❤️ for students, by students**

🎓 **Happy Learning!**
