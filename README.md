# Electronic Medical Records (EMR) System

Sistem Electronic Medical Records berbasis web dengan arsitektur microservices menggunakan Docker containers yang terpisah untuk web server dan database.

## Arsitektur

- **Instance 1 (Web Server)**: Nginx + Static Files (HTML/CSS/JS)
- **Instance 2 (Database)**: PostgreSQL + Node.js API Server

## Prerequisites

- Docker & Docker Compose
- 2 EC2 Instances (atau server terpisah)
- Security Groups yang sudah dikonfigurasi untuk port 80, 443, 3000, dan 5432

## File Structure

```
emr-system/
├── webserver/                 # Instance 1 - Web Server
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── nginx.conf
│   └── html/
│       └── index.html
└── database/                  # Instance 2 - Database Server
    ├── docker-compose.yml
    ├── Dockerfile
    ├── package.json
    ├── server.js
    ├── healthcare_dataset.csv
    └── data/
```

## Deployment Steps

### Instance 1 - Web Server Setup

1. **Persiapkan direktori dan files**:

```bash
git clone --single-branch --branch webserver https://github.com/dipt4aaaa/ztna-medical-records.git

# Copy files: docker-compose.yml, Dockerfile, nginx.conf, html/index.html
```

2. **Update nginx.conf**:
   Ganti `DATABASE_INSTANCE_IP` dengan IP instance database Anda:

```nginx
proxy_pass http://YOUR_DATABASE_INSTANCE_IP:3000/;
```

3. **Update docker-compose.yml**:

```yaml
environment:
  - DATABASE_API_URL=http://YOUR_DATABASE_INSTANCE_IP:3000
```

4. **Deploy**:

```bash
docker-compose up -d
```

### Instance 2 - Database Server Setup

1. **Persiapkan direktori dan files**:

```bash
git clone --single-branch --branch database https://github.com/dipt4aaaa/ztna-medical-records.git

# Copy files: docker-compose.yml, Dockerfile, package.json, server.js
# Copy your healthcare_dataset.csv to this directory
```

2. **Update docker-compose.yml**:
   Ganti `YOUR_WEBSERVER_INSTANCE_IP` dengan IP instance web server:

```yaml
environment:
  - CORS_ORIGIN=http://YOUR_WEBSERVER_INSTANCE_IP
```

3. **Deploy**:

```bash
docker-compose up -d
```

## Security Configuration

### EC2 Security Groups

**Web Server Instance (Instance 1)**:

- Port 80: 0.0.0.0/0 (HTTP)
- Port 443: 0.0.0.0/0 (HTTPS)
- Port 22: Your IP only (SSH)

**Database Instance (Instance 2)**:

- Port 3000: Web Server Instance IP only (API)
- Port 5432: Web Server Instance IP only (PostgreSQL)
- Port 22: Your IP only (SSH)

### Environment Variables

Ubah password database di `docker-compose.yml` (Instance 2):

```yaml
environment:
  POSTGRES_PASSWORD: your_secure_password_here
```

Dan update connection string di API server sesuai password yang sama.

## Healthcare Dataset Format

CSV file harus memiliki kolom berikut:

- Name
- Age
- Gender
- Blood Type
- Medical Condition
- Date of Admission
- Doctor
- Hospital
- Insurance Provider
- Billing Amount
- Room Number
- Admission Type
- Discharge Date
- Medication
- Test Results

## API Endpoints

- `GET /records` - Get all records with pagination
- `GET /records/:id` - Get single record
- `POST /records` - Create new record
- `PUT /records/:id` - Update record
- `DELETE /records/:id` - Delete record
- `GET /stats` - Get statistics
- `GET /health` - Health check

## Monitoring & Maintenance

### Check container status:

```bash
docker-compose ps
```

### View logs:

```bash
docker-compose logs -f
```

### Backup database:

```bash
docker-compose exec postgres-emr pg_dump -U emr_user emr_database > backup.sql
```

### Update application:

```bash
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Common Issues:

1. **Cannot connect to database**:

   - Check security groups
   - Verify IP addresses in configuration
   - Ensure containers are running

2. **CORS errors**:

   - Verify CORS_ORIGIN environment variable
   - Check nginx proxy configuration

3. **CSV import fails**:
   - Verify CSV format and column names
   - Check file permissions
   - Review container logs

### Health Checks:

- Web Server: `http://your-webserver-ip/`
- API Server: `http://your-database-ip:3000/health`
- Database: Check via API or direct connection

## Production Considerations

1. **SSL/HTTPS**: Configure SSL certificates for production
2. **Database Backup**: Set up automated backups
3. **Monitoring**: Add application monitoring (Prometheus/Grafana)
4. **Logging**: Configure centralized logging
5. **Security**: Implement authentication and authorization
6. **Performance**: Add caching layer (Redis) if needed

## Support

For issues and questions, check the logs and ensure all configurations match your infrastructure setup.
