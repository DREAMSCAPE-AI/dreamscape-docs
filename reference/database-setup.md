# Database Setup Guide

This project uses a hybrid database approach with **PostgreSQL** for structured data and **MongoDB** for unstructured data.

## Architecture Overview

### PostgreSQL (Structured Data)
- **User management**: Users, preferences, authentication
- **Bookings**: Flight bookings, payment status
- **Search history**: User search patterns for analytics
- **Flight cache**: Cached flight data for performance
- **Popular destinations**: Aggregated destination popularity
- **Price alerts**: User price monitoring

### MongoDB (Unstructured Data)
- **Flight data**: Raw Amadeus API responses
- **User activity**: Detailed user behavior tracking
- **Analytics**: Aggregated analytics and metrics

## Prerequisites

1. **PostgreSQL** (version 12 or higher)
2. **MongoDB** (version 4.4 or higher)
3. **Node.js** (version 18 or higher)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

#### PostgreSQL Setup
1. Install PostgreSQL on your system
2. Create a database named `dreamscape_db`
3. Create a user with appropriate permissions

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE dreamscape_db;
CREATE USER dreamscape_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dreamscape_db TO dreamscape_user;
```

#### MongoDB Setup
1. Install MongoDB on your system
2. Start MongoDB service
3. The database `dreamscape_unstructured` will be created automatically

### 3. Environment Configuration

Copy `.env.example` to `.env` and update the database URLs:

```bash
# PostgreSQL (for structured data)
DATABASE_URL="postgresql://dreamscape_user:your_password@localhost:5432/dreamscape_db?schema=public"

# MongoDB (for unstructured data)
MONGODB_URI="mongodb://localhost:27017/dreamscape_unstructured"
```

### 4. Prisma Setup

Generate Prisma client and push schema to database:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 5. Seed Database

Populate the database with initial data:

```bash
npm run db:seed
```

## Database Schema

### PostgreSQL Tables

#### Users
- User authentication and profile information
- Linked to preferences, bookings, and search history

#### Bookings
- Flight booking records with payment status
- Links to user and flight details

#### Search History
- User search patterns for analytics and recommendations
- Supports both authenticated and anonymous users

#### Flight Cache
- Cached flight search results for performance
- Automatic expiration and hit counting

#### Popular Destinations
- Aggregated destination popularity metrics
- Seasonal trend data

#### Price Alerts
- User-defined price monitoring alerts
- Active/inactive status tracking

### MongoDB Collections

#### FlightData
- Raw Amadeus API responses
- Automatic TTL expiration (30 minutes)
- Indexed for efficient querying

#### UserActivity
- Detailed user behavior tracking
- Activity types: search, view, click, booking, page_view
- TTL expiration (90 days)

#### Analytics
- Aggregated analytics data
- Route-specific and destination-specific metrics
- Time-series data for trends

## Available Scripts

```bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run database migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database with initial data

# Development
npm run dev           # Start development server
npm run build         # Build for production
npm start            # Start production server
```

## Database Services

### DatabaseService
Central service for managing both database connections:
- Singleton pattern for connection management
- Health checks for both databases
- Graceful shutdown handling

### FlightDatabaseService
High-level service for flight-related database operations:
- User management
- Booking operations
- Search history tracking
- Flight data caching
- Analytics storage

## Performance Considerations

### PostgreSQL Optimizations
- Indexed foreign keys and frequently queried fields
- Compound indexes for complex queries
- Connection pooling via Prisma

### MongoDB Optimizations
- TTL indexes for automatic data cleanup
- Compound indexes for analytics queries
- Proper schema design for query patterns

## Monitoring and Maintenance

### Health Checks
The `/api/health` endpoint provides database status:
```json
{
  "status": "healthy",
  "services": {
    "postgresql": { "status": "healthy" },
    "mongodb": { "status": "healthy" }
  }
}
```

### Data Cleanup
Automatic cleanup of expired data:
- Flight cache expires after search completion
- Flight data expires after 30 minutes
- User activity data expires after 90 days

### Backup Strategy
1. **PostgreSQL**: Regular pg_dump backups
2. **MongoDB**: mongodump for collection backups
3. **Environment**: Backup .env configuration

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify database services are running
   - Check connection strings in .env
   - Ensure firewall allows database connections

2. **Migration Errors**
   - Reset database: `npx prisma db push --force-reset`
   - Check for schema conflicts
   - Verify user permissions

3. **MongoDB Connection Issues**
   - Check MongoDB service status
   - Verify MongoDB URI format
   - Check network connectivity

### Logs
Database connection logs are available in the application console during startup.

## Security Considerations

1. **Environment Variables**: Never commit .env files
2. **Database Credentials**: Use strong passwords
3. **Network Security**: Restrict database access to application servers
4. **Data Encryption**: Enable encryption at rest for sensitive data
5. **Regular Updates**: Keep database software updated

## Development vs Production

### Development
- Use `db:push` for rapid schema iteration
- Enable query logging for debugging
- Use local database instances

### Production
- Use `db:migrate` for controlled schema changes
- Disable query logging for performance
- Use managed database services (AWS RDS, MongoDB Atlas)
- Implement proper backup and monitoring
