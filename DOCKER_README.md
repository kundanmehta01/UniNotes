# UniNotesHub Docker Setup

This document describes how to run UniNotesHub using Docker containers.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for containers
- 10GB+ free disk space

## Quick Start (Development)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Production Deployment

1. **Create production environment file:**
   ```bash
   cp .env.prod .env.prod.local
   # Edit .env.prod.local with your actual values
   ```

2. **Start production services:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
   ```

## Services

### Development (`docker-compose.yml`)
- **Frontend**: React app with Vite dev server (port 3000)
- **Backend**: FastAPI with hot reload (port 8000)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching and sessions (port 6379)
- **MinIO**: S3-compatible storage (ports 9000, 9001)

### Production (`docker-compose.prod.yml`)
- **Frontend**: Nginx serving built React app (port 80)
- **Backend**: FastAPI production server (port 8000)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching and sessions (port 6379)
- **MinIO**: S3-compatible storage (ports 9000, 9001)

## URLs

### Development
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

### Production
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

## Common Commands

### Development
```bash
# Start services in background
docker-compose up -d

# Start specific service
docker-compose up -d postgres redis

# View logs for specific service
docker-compose logs -f backend

# Rebuild and start
docker-compose up --build

# Enter a container
docker-compose exec backend bash
docker-compose exec frontend sh

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Production
```bash
# Deploy production
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Update and redeploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Database Setup

### Initial Migration
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create admin user (if needed)
docker-compose exec backend python manage_admin.py
```

## Storage Setup

MinIO (S3-compatible storage) is automatically configured with:
- Bucket: `uninoteshub-files`
- Access: Public read access
- Console: http://localhost:9001

## Troubleshooting

### Port Conflicts
If ports are already in use, modify the port mappings in the compose files.

### Memory Issues
Ensure Docker has enough memory allocated (4GB+ recommended).

### Permission Issues
```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER .
```

### Clean Reset
```bash
# Stop everything and remove data
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### View Container Status
```bash
# Check service health
docker-compose ps

# View resource usage
docker stats
```

## Security Notes

### Production Checklist
- [ ] Change default passwords in `.env.prod.local`
- [ ] Use strong, unique JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS (HTTPS)
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor container logs
- [ ] Backup database regularly

## Backup and Restore

### Database Backup
```bash
docker-compose exec postgres pg_dump -U postgres uninoteshub > backup.sql
```

### Database Restore
```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres uninoteshub
```

### Full Data Backup
```bash
# Backup volumes
docker run --rm -v uninoteshub_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
docker run --rm -v uninoteshub_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup.tar.gz -C /data .
```

## Monitoring

### Health Checks
All services include health checks. Check status with:
```bash
docker-compose ps
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last N lines
docker-compose logs --tail=50 frontend
```

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload in development mode
2. **Database Changes**: Use Alembic migrations for schema changes
3. **API Testing**: Visit http://localhost:8000/docs for interactive API documentation
4. **File Storage**: Upload files are stored in MinIO and accessible at http://localhost:9000

## Support

For issues:
1. Check container logs: `docker-compose logs -f [service]`
2. Verify all services are healthy: `docker-compose ps`
3. Check available disk space and memory
4. Review environment variables
