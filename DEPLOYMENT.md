# UniNotesHub Deployment Guide

This guide covers deploying UniNotesHub to production using Docker, with support for both local MinIO and AWS S3/SES services.

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Domain name (for production)
- SSL certificates (for HTTPS)

### Environment Setup

1. **Copy the production environment template:**
   ```bash
   cp .env.prod .env.prod.local
   ```

2. **Configure your environment variables in `.env.prod.local`:**
   ```bash
   # Required: Database
   POSTGRES_PASSWORD=your-secure-db-password-here
   
   # Required: JWT Secret
   JWT_SECRET=your-very-secure-jwt-secret-key-here-make-it-long-and-random
   
   # Required: CORS Origins
   CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # Required: Email From Address
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
   ```

## 📧 Email Configuration

UniNotesHub supports both SMTP and AWS SES for email delivery.

### Option 1: SMTP (Gmail, etc.)

```bash
# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_USE_TLS=true
```

### Option 2: AWS SES (Recommended for Production)

```bash
# Email Configuration
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
SES_FROM_EMAIL=noreply@yourdomain.com  # Must be verified in SES
EMAIL_FROM=noreply@yourdomain.com
```

**AWS SES Setup:**
1. Verify your domain in AWS SES
2. Move out of sandbox mode for production
3. Create IAM user with SES send permissions
4. Configure DKIM and SPF records for better deliverability

## 💾 Storage Configuration

### Option 1: Local MinIO (Development/Small Scale)

```bash
# MinIO Configuration (included in docker-compose.prod.yml)
MINIO_ROOT_USER=your-minio-admin-user
MINIO_ROOT_PASSWORD=your-secure-minio-password
S3_ENDPOINT=http://minio:9000
S3_BUCKET=uninoteshub-files
S3_ACCESS_KEY=${MINIO_ROOT_USER}
S3_SECRET_KEY=${MINIO_ROOT_PASSWORD}
```

### Option 2: AWS S3 (Recommended for Production)

```bash
# AWS S3 Configuration
S3_ENDPOINT=  # Leave empty for AWS S3
S3_BUCKET=your-s3-bucket-name
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_REGION=us-east-1
```

**AWS S3 Setup:**
1. Create an S3 bucket
2. Configure bucket policy for file uploads
3. Set up CloudFront distribution (optional, for CDN)
4. Create IAM user with S3 permissions

## 🔧 Complete Environment Variables

### Required Variables

```bash
# Database
POSTGRES_PASSWORD=your-secure-password

# Security
JWT_SECRET=your-jwt-secret-key-min-64-chars-long

# Application
CORS_ALLOWED_ORIGINS=https://yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
```

### Optional Variables

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_DB=uninoteshub

# JWT Settings
JWT_ACCESS_TTL=900  # 15 minutes
JWT_REFRESH_TTL=604800  # 7 days

# File Upload Limits
MAX_FILE_SIZE=20971520  # 20MB
ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=900  # 15 minutes
RATE_LIMIT_UPLOAD_PER_HOUR=10
RATE_LIMIT_DOWNLOAD_PER_HOUR=100

# Admin
ADMIN_EMAIL=admin@yourdomain.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

## 🐳 Docker Deployment

### Production Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/uninoteshub.git
   cd uninoteshub
   ```

2. **Set up environment:**
   ```bash
   cp .env.prod .env.prod.local
   # Edit .env.prod.local with your values
   ```

3. **Deploy services:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
   ```

4. **Run database migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
   ```

5. **Create admin user:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python -c "
   from app.services.auth import create_initial_admin
   import asyncio
   asyncio.run(create_initial_admin())
   "
   ```

### Development Deployment

```bash
docker-compose up -d
```

## 🔒 Security Considerations

### SSL/TLS Configuration

For production, you'll need SSL certificates. You can use:

1. **Let's Encrypt (Free):**
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Generate certificate
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. **Configure Nginx for SSL** (add to docker-compose.prod.yml):
   ```yaml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./infra/nginx/nginx.prod.conf:/etc/nginx/nginx.conf
       - /etc/letsencrypt:/etc/letsencrypt:ro
   ```

### Database Security

1. **Use strong passwords**
2. **Enable connection encryption**
3. **Regular backups**
4. **Network isolation**

### Application Security

1. **Strong JWT secret** (minimum 64 characters)
2. **Rate limiting** configured
3. **CORS** properly configured
4. **File upload restrictions** in place

## 📊 Monitoring and Logging

### Health Checks

All services include health checks:
- Backend: `http://localhost:8000/healthz`
- Frontend: `http://localhost/health`
- Database: Built-in PostgreSQL health check
- Redis: Built-in Redis health check

### Logs

View service logs:
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Monitoring with Sentry

Add Sentry DSN to environment variables for error tracking:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Rebuild and restart:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod.local build
   docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
   ```

3. **Run migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
   ```

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres uninoteshub > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres uninoteshub < backup.sql
```

## 🎯 Performance Optimization

### Frontend Optimization

- Files are served with appropriate caching headers
- Gzip compression enabled
- Static assets cached for 1 year
- HTML files cached for 5 minutes

### Backend Optimization

- Redis caching enabled
- Connection pooling configured
- Rate limiting implemented
- Database query optimization

### Database Optimization

- Proper indexes on frequently queried columns
- Connection pooling
- Query monitoring with slow query logs

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending:**
   - Check EMAIL_PROVIDER setting
   - Verify SMTP/SES credentials
   - Check firewall rules for SMTP ports

2. **File upload failures:**
   - Verify S3/MinIO credentials
   - Check bucket permissions
   - Verify file size limits

3. **Database connection errors:**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check network connectivity

4. **CORS errors:**
   - Verify CORS_ALLOWED_ORIGINS includes your domain
   - Check protocol (http/https) matches

### Debug Mode

Enable debug logging:
```bash
# Add to .env.prod.local
DEBUG=true
ENVIRONMENT=development
```

**Important:** Never use debug mode in production!

## 📝 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] Database backup strategy in place
- [ ] Monitoring configured

### Post-deployment
- [ ] Health checks passing
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Email delivery tested
- [ ] File upload/download tested
- [ ] SSL certificate valid
- [ ] Monitoring alerts configured

## 🆘 Support

For deployment issues:

1. Check the logs first
2. Review this documentation
3. Check GitHub Issues
4. Create a new issue with:
   - Environment details
   - Error logs
   - Steps to reproduce

## 🔗 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Sentry.io](https://sentry.io/)

---

**Happy Deploying! 🚀**
