# Production Deployment Guide

Complete guide for deploying Svelte LangGraph to production with Docker, security best practices, and monitoring.

## 🎯 Deployment Options

### Quick Deployment Comparison

| Method | Complexity | Scalability | Best For |
|--------|------------|-------------|----------|
| **Docker Compose** | Low | Medium | Small teams, prototypes |
| **Kubernetes** | High | High | Enterprise, large scale |
| **Cloud Platforms** | Medium | High | Managed infrastructure |
| **VPS/Dedicated** | Medium | Medium | Full control needed |

---

## 🐳 Docker Production Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

### 1. Environment Configuration

Create production environment file:

```bash
# .env.production
NODE_ENV=production
ENVIRONMENT=production

# API Keys (REQUIRED)
OPENAI_API_KEY=sk-your-production-openai-key
ANTHROPIC_API_KEY=sk-ant-your-production-anthropic-key
TAVILY_API_KEY=your-production-tavily-key

# JWT Security (CHANGE THESE!)
SECRET_KEY=your-very-secure-production-secret-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://langgraph:secure_password@postgres:5432/langgraph_prod

# Redis for session storage (optional)
REDIS_URL=redis://redis:6379/0

# Server Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info

# Frontend Configuration
PUBLIC_API_URL=https://your-domain.com
PUBLIC_SOCKET_URL=https://your-domain.com

# Security Headers
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem

# Monitoring
SENTRY_DSN=your-sentry-dsn-for-error-tracking
METRICS_ENABLED=true
```

### 2. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Nginx Reverse Proxy with SSL
  nginx:
    image: nginx:alpine
    container_name: langgraph-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl/:/etc/nginx/ssl/:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - svelte-frontend
      - langgraph-backend
    restart: unless-stopped
    networks:
      - langgraph-network

  # SvelteKit Frontend
  svelte-frontend:
    build:
      context: ./examples/dashboard
      dockerfile: Dockerfile.prod
      args:
        - PUBLIC_API_URL=${PUBLIC_API_URL}
        - PUBLIC_SOCKET_URL=${PUBLIC_SOCKET_URL}
    container_name: langgraph-frontend
    environment:
      - NODE_ENV=production
      - PORT=3000
    expose:
      - "3000"
    restart: unless-stopped
    networks:
      - langgraph-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # FastAPI Backend
  langgraph-backend:
    build:
      context: ./examples/langgraph-backend
      dockerfile: Dockerfile.prod
    container_name: langgraph-backend
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - LOG_LEVEL=${LOG_LEVEL}
    expose:
      - "8000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - langgraph-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: langgraph-postgres
    environment:
      - POSTGRES_USER=langgraph
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=langgraph_prod
      - POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped
    networks:
      - langgraph-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U langserve -d langserve_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis for Session Storage
  redis:
    image: redis:7-alpine
    container_name: langserve-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - langgraph-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring with Prometheus (optional)
  prometheus:
    image: prom/prometheus:latest
    container_name: langserve-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    networks:
      - langgraph-network

  # Grafana Dashboard (optional)
  grafana:
    image: grafana/grafana:latest
    container_name: langserve-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_grafana_password
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
    restart: unless-stopped
    networks:
      - langgraph-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  langserve-network:
    driver: bridge
```

### 3. Production Nginx Configuration

```nginx
# nginx/nginx.prod.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Upstream servers
    upstream frontend {
        server svelte-frontend:3000;
    }

    upstream backend {
        server langserve-backend:8000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Caching for static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                proxy_pass http://frontend;
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Authentication endpoints (stricter rate limiting)
        location ~ ^/api/(token|register|login) {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Socket.IO WebSocket
        location /socket.io/ {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health checks
        location /health {
            access_log off;
            proxy_pass http://frontend;
        }

        location /api/health {
            access_log off;
            proxy_pass http://backend;
        }
    }
}
```

### 4. SSL Certificate Setup

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal crontab
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Production Build

```bash
# Create production build scripts
mkdir -p scripts

# Build script
cat > scripts/build-prod.sh << 'EOF'
#!/bin/bash
set -e

echo "Building production images..."

# Build frontend
docker build -t langserve-frontend:prod \
  --file examples/dashboard/Dockerfile.prod \
  examples/dashboard

# Build backend
docker build -t langserve-backend:prod \
  --file examples/langserve-backend/Dockerfile.prod \
  examples/langserve-backend

echo "Production build complete!"
EOF

chmod +x scripts/build-prod.sh
```

### 6. Deployment Script

```bash
# Deployment script
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Deploying to production..."

# Pull latest code
git pull origin main

# Build images
./scripts/build-prod.sh

# Stop existing services
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Check health
docker-compose -f docker-compose.prod.yml exec -T svelte-frontend curl -f http://localhost:3000/health
docker-compose -f docker-compose.prod.yml exec -T langserve-backend curl -f http://localhost:8000/health

echo "Deployment complete!"
echo "Frontend: https://your-domain.com"
echo "API: https://your-domain.com/api"
echo "Monitoring: https://your-domain.com:3001 (Grafana)"
EOF

chmod +x scripts/deploy.sh
```

---

## ☁️ Cloud Platform Deployment

### AWS ECS Deployment

```yaml
# aws-ecs-task-definition.json
{
  "family": "langserve-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "langserve-frontend",
      "image": "your-ecr-repo/langserve-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "PUBLIC_API_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:langserve/config"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/langserve-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    },
    {
      "name": "langserve-backend",
      "image": "your-ecr-repo/langserve-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:langserve/openai-key"
        },
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:langserve/anthropic-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/langserve-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: langserve-app
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/your-project/langserve-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: langserve-secrets
              key: openai-key
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "examples/dashboard/package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "examples/langserve-backend/$1"
    },
    {
      "src": "/(.*)",
      "dest": "examples/dashboard/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "PUBLIC_API_URL": "https://your-app.vercel.app"
  },
  "build": {
    "env": {
      "OPENAI_API_KEY": "@openai-api-key",
      "ANTHROPIC_API_KEY": "@anthropic-api-key"
    }
  }
}
```

---

## 🔒 Security Configuration

### Environment Variables Security

```bash
# Use strong secrets
SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)

# Store in secure secret management
# AWS: AWS Secrets Manager
# GCP: Google Secret Manager
# Azure: Azure Key Vault
# Self-hosted: HashiCorp Vault
```

### Database Security

```sql
-- Create restricted database user
CREATE USER langserve_app WITH PASSWORD 'secure_random_password';
GRANT CONNECT ON DATABASE langserve_prod TO langserve_app;
GRANT USAGE ON SCHEMA public TO langserve_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO langserve_app;
```

### Network Security

```bash
# Firewall rules (UFW example)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Docker network isolation
docker network create --driver bridge --internal langserve-internal
```

### API Rate Limiting

```python
# In FastAPI backend
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/send-message")
@limiter.limit("10/minute")
async def send_message(request: Request, ...):
    # Message handling with rate limiting
    pass
```

---

## 📊 Monitoring and Logging

### Application Metrics

```typescript
// Frontend metrics
import { browser } from '$app/environment';

if (browser) {
  // Performance monitoring
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      // Send metrics to monitoring service
      fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify({
          type: 'performance',
          name: entry.name,
          duration: entry.duration,
          timestamp: Date.now()
        })
      });
    });
  });
  
  observer.observe({ entryTypes: ['navigation', 'measure'] });
}
```

### Backend Logging

```python
# Enhanced logging configuration
import logging
import structlog
from pythonjsonlogger import jsonlogger

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage in endpoints
@app.post("/api/send-message")
async def send_message(message: MessageRequest):
    logger.info(
        "Message received",
        user_id=message.user_id,
        conversation_id=message.conversation_id,
        endpoint_count=len(message.endpoints)
    )
```

### Health Checks

```typescript
// Frontend health check
// examples/dashboard/src/routes/health/+server.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  };
  
  return new Response(JSON.stringify(health), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

```python
# Backend health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": await check_database_health(),
        "redis": await check_redis_health(),
        "ai_endpoints": await check_ai_endpoints_health()
    }
```

---

## 🚀 Performance Optimization

### Frontend Optimization

```typescript
// examples/dashboard/vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['socket.io-client'],
          langchain: ['@langchain/core'],
          ui: ['flowbite-svelte']
        }
      }
    },
    // Compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    // Development optimization
    hmr: {
      overlay: false
    }
  }
});
```

### Backend Optimization

```python
# Production ASGI server configuration
# gunicorn_config.py
bind = "0.0.0.0:8000"
worker_class = "uvicorn.workers.UvicornWorker"
workers = 4  # CPU cores * 2
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
keepalive = 5
timeout = 30
```

### Database Optimization

```sql
-- Database indexes for performance
CREATE INDEX CONCURRENTLY idx_conversations_user_updated 
ON conversations(user_id, updated_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_conversation_timestamp 
ON messages(conversation_id, timestamp DESC);

-- Database connection pooling
-- Set in DATABASE_URL: ?pool_size=20&max_overflow=30
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd examples/dashboard
          npm ci
          
      - name: Run tests
        run: |
          cd examples/dashboard
          npm run test
          npm run check
          
      - name: Build
        run: |
          cd examples/dashboard
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          ssh ${{ secrets.PRODUCTION_HOST }} 'cd /app && ./scripts/deploy.sh'
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
```

### Rollback Strategy

```bash
# Rollback script
cat > scripts/rollback.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_TAG=${1:-latest-backup}

echo "Rolling back to $BACKUP_TAG..."

# Tag current version as backup
docker tag langserve-frontend:prod langserve-frontend:rollback-$(date +%Y%m%d-%H%M%S)
docker tag langserve-backend:prod langserve-backend:rollback-$(date +%Y%m%d-%H%M%S)

# Restore backup
docker tag langserve-frontend:$BACKUP_TAG langserve-frontend:prod
docker tag langserve-backend:$BACKUP_TAG langserve-backend:prod

# Restart services
docker-compose -f docker-compose.prod.yml up -d

echo "Rollback complete!"
EOF

chmod +x scripts/rollback.sh
```

---

## 📋 Production Checklist

### Pre-deployment

- [ ] **Environment variables** - All production secrets configured
- [ ] **SSL certificates** - Valid and auto-renewing
- [ ] **Database** - Production PostgreSQL configured
- [ ] **Backups** - Database backup strategy implemented
- [ ] **Monitoring** - Logging and metrics configured
- [ ] **Security** - Rate limiting and security headers
- [ ] **Performance** - Code splitting and optimization
- [ ] **Health checks** - All services have health endpoints

### Post-deployment

- [ ] **Smoke tests** - All critical paths working
- [ ] **Performance** - Response times acceptable
- [ ] **Monitoring** - Alerts configured
- [ ] **Backup verification** - Backup/restore tested
- [ ] **Security scan** - Vulnerability assessment
- [ ] **Load testing** - Performance under load
- [ ] **Documentation** - Runbooks and procedures

### Ongoing Maintenance

- [ ] **Security updates** - Regular dependency updates
- [ ] **Certificate renewal** - SSL certificate monitoring
- [ ] **Backup testing** - Regular restore tests
- [ ] **Performance monitoring** - Continuous optimization
- [ ] **Cost monitoring** - Resource usage tracking
- [ ] **Capacity planning** - Scaling strategy

---

## 🆘 Troubleshooting

### Common Production Issues

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Check resource usage
docker stats

# Database connection test
docker-compose -f docker-compose.prod.yml exec postgres psql -U langserve -d langserve_prod -c "SELECT 1;"

# Redis connection test
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### Performance Issues

- **High memory usage** - Check for memory leaks in streaming messages
- **Slow responses** - Monitor database query performance
- **Connection timeouts** - Adjust nginx proxy timeouts
- **Rate limiting** - Review rate limit configurations

For detailed troubleshooting, see the [Troubleshooting Guide](../advanced/troubleshooting.md).

---

This production deployment guide provides everything needed to deploy Svelte LangServe securely and efficiently. Adjust configurations based on your specific infrastructure and requirements.