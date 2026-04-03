# DreamScape Multi-Stage Docker Implementation

## Overview - DR-334: INFRA-010.2
This document describes the multi-stage Docker implementation for DreamScape Auth and User services, providing optimized builds with reduced image sizes and improved security.

## Multi-Stage Architecture

### Stage 1: Builder (Node.js Build Environment)
- **Base Image**: `node:20-alpine`
- **Purpose**: Complete build environment with all development tools
- **Features**:
  - Full Node.js toolchain with TypeScript compiler
  - Build dependencies (Python, Make, GCC for native modules)
  - Development dependencies installation
  - TypeScript compilation
  - Prisma client generation
  - Production dependency pruning

### Stage 2: Runtime (Production Environment)
- **Base Image**: `node:20-alpine`
- **Purpose**: Lightweight production runtime
- **Features**:
  - Minimal Alpine Linux base
  - Production dependencies only
  - Non-root user configuration
  - Security hardening
  - Health check integration

## Service Configurations

### Auth Service (Port 3001)
```dockerfile
# Multi-stage build optimized for authentication service
FROM node:20-alpine AS builder
# ... build stage configuration

FROM node:20-alpine AS runtime
# ... runtime stage configuration
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

**Key Features**:
- JWT token management
- Database connection handling
- Security middleware
- Rate limiting
- Health checks at `/health`

### User Service (Port 3002)
```dockerfile
# Multi-stage build optimized for user management service
FROM node:20-alpine AS builder
# ... build stage configuration

FROM node:20-alpine AS runtime
# ... runtime stage configuration with ImageMagick
EXPOSE 3002
CMD ["node", "dist/server.js"]
```

**Key Features**:
- User profile management
- Avatar upload processing (ImageMagick)
- Document management
- File upload handling
- Health checks at `/health`

## Build Optimizations

### Layer Caching Strategy
1. **Package Files First**: Copy `package*.json` and `tsconfig.json` before source code
2. **Dependency Installation**: Separate layer for `npm ci` to leverage Docker cache
3. **Source Code**: Copy source files after dependencies
4. **Build Process**: TypeScript compilation in separate step
5. **Cleanup**: Remove dev dependencies and build artifacts

### .dockerignore Configuration
```dockerignore
node_modules/
dist/
coverage/
.git/
*.log
.env*
docs/
tests/
```

**Benefits**:
- Reduced build context size
- Faster Docker builds
- Improved layer caching
- Excluded sensitive files

## Security Implementation

### Non-Root User Configuration
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G nodejs -g nodejs nodejs

# Switch to non-root user
USER nodejs
```

### Security Features
- **Process Isolation**: Services run as `nodejs` user (UID 1001)
- **No Shell Access**: User configured with `/sbin/nologin`
- **Minimal Permissions**: Read-only filesystem where possible
- **Signal Handling**: `dumb-init` for proper signal forwarding
- **Security Updates**: Alpine packages updated during build

## Performance Optimizations

### Build Performance
- **Multi-stage**: Separates build and runtime environments
- **Layer Caching**: Optimized layer ordering for maximum cache hits
- **Dependency Pruning**: Production-only dependencies in final image
- **Build Context**: Minimal context with comprehensive `.dockerignore`

### Runtime Performance
- **Alpine Base**: Minimal OS footprint
- **Node.js Optimization**: Tuned memory settings and thread pool
- **Process Management**: `dumb-init` for proper process handling
- **Health Checks**: Integrated health monitoring

## Environment Variables

### Common Variables
```bash
NODE_ENV=production
PORT=3001|3002
NODE_OPTIONS="--max-old-space-size=512"
UV_THREADPOOL_SIZE=4
```

### Service-Specific Variables

#### Auth Service
```bash
DATABASE_URL=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:3000
```

#### User Service
```bash
DATABASE_URL=mongodb://...
REDIS_URL=redis://...
UPLOAD_MAX_SIZE=5242880
UPLOAD_PATH=/app/uploads
```

## Health Checks

### Container Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1
```

### Application Health Endpoints
Both services expose `/health` endpoints returning:
```json
{
  "status": "ok",
  "service": "auth-service|user-service",
  "timestamp": "2025-08-18T09:00:00.000Z"
}
```

## Build Commands

### Individual Service Build
```bash
# Auth Service
cd auth-service
docker build -t dreamscape-auth-service .

# User Service
cd user-service
docker build -t dreamscape-user-service .
```

### Multi-Service Build with Compose
```bash
# Build all services
docker-compose -f docker-compose.core-services.yml build

# Start services
docker-compose -f docker-compose.core-services.yml up -d
```

## Build Testing

### Automated Build Tests
Use the provided test script:
```bash
./dreamscape-infrastructure/scripts/test-builds.sh
```

**Test Coverage**:
- Cold build time measurement (target: <5 minutes)
- Warm build time measurement (target: <30 seconds)
- Image size validation (target: <200MB)
- Container startup verification
- Health check validation
- Security verification (non-root user)

## Acceptance Criteria Validation

### ✅ Image Size Optimization
- **Target**: < 200MB per service
- **Implementation**: Multi-stage build with Alpine base
- **Verification**: `docker images` size check

### ✅ Build Performance
- **Cold Build**: < 5 minutes
- **Warm Build**: < 30 seconds
- **Implementation**: Optimized layer caching and .dockerignore

### ✅ Service Startup
- **Auth Service**: Starts on port 3001
- **User Service**: Starts on port 3002
- **Implementation**: Proper health checks and signal handling

### ✅ Security Compliance
- **No Root Process**: Services run as `nodejs` user
- **Verification**: `docker exec container whoami` returns `nodejs`

### ✅ Health Check Response
- **Target**: < 10 seconds response time
- **Implementation**: Lightweight health endpoints
- **Verification**: `curl` response time measurement

## Monitoring and Logging

### Container Logs
```bash
# View service logs
docker-compose logs auth-service
docker-compose logs user-service

# Follow logs in real-time
docker-compose logs -f auth-service user-service
```

### Resource Monitoring
```bash
# Monitor resource usage
docker stats dreamscape-auth-service dreamscape-user-service

# Detailed inspection
docker inspect dreamscape-auth-service
```

## Troubleshooting

### Common Issues

#### Build Failures
- **Dependency Issues**: Check `package.json` and Node.js version compatibility
- **Network Issues**: Verify Docker network configuration
- **Permission Issues**: Ensure proper file permissions in source directory

#### Runtime Issues
- **Port Conflicts**: Verify ports 3001/3002 are available
- **Database Connection**: Check MongoDB and Redis connectivity
- **Environment Variables**: Verify all required environment variables are set

#### Performance Issues
- **High Memory Usage**: Adjust `NODE_OPTIONS` memory settings
- **Slow Startup**: Check database connection timeout settings
- **Build Time**: Verify .dockerignore and layer caching optimization

### Debug Commands
```bash
# Check container processes
docker exec -it container-name ps aux

# Check user context
docker exec -it container-name whoami

# Check environment variables
docker exec -it container-name env

# Check file permissions
docker exec -it container-name ls -la /app
```

## Best Practices

### Development Workflow
1. **Local Testing**: Use `docker-compose` for local development
2. **Build Testing**: Run automated build tests before deployment
3. **Health Monitoring**: Implement comprehensive health checks
4. **Security Scanning**: Regular security scans of built images

### Production Deployment
1. **Image Registry**: Push built images to container registry
2. **Rolling Updates**: Use Kubernetes rolling updates for zero-downtime
3. **Resource Limits**: Set appropriate CPU/memory limits
4. **Monitoring**: Implement comprehensive monitoring and alerting

## Integration with Gateway

The multi-stage Docker services integrate seamlessly with the DreamScape API Gateway:
- **Service Discovery**: Services accessible at `auth-service:3001` and `user-service:3002`
- **Health Checks**: Gateway monitors service health through `/health` endpoints
- **Load Balancing**: Gateway distributes traffic across service instances
- **Request Routing**: Gateway routes requests to appropriate services based on URL patterns

This implementation provides a robust, secure, and performant foundation for the DreamScape microservices architecture.