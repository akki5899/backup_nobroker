#!/bin/bash

# Production Deployment Script for NoBroker
# This script handles secure production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please copy .env.prod.example to $ENV_FILE and configure it"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

validate_environment() {
    log_info "Validating environment configuration..."
    
    # Source the environment file
    source "$ENV_FILE"
    
    # Check critical variables
    if [ -z "$SECRET_KEY" ] || [ ${#SECRET_KEY} -lt 32 ]; then
        log_error "SECRET_KEY must be at least 32 characters long"
        exit 1
    fi
    
    if [ "$ENVIRONMENT" != "production" ]; then
        log_error "ENVIRONMENT must be set to 'production'"
        exit 1
    fi
    
    if [ "$DEBUG" = "true" ]; then
        log_error "DEBUG must be set to 'false' in production"
        exit 1
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ] || [ ${#POSTGRES_PASSWORD} -lt 12 ]; then
        log_error "POSTGRES_PASSWORD must be at least 12 characters long"
        exit 1
    fi
    
    if [ -z "$REDIS_PASSWORD" ] || [ ${#REDIS_PASSWORD} -lt 12 ]; then
        log_error "REDIS_PASSWORD must be at least 12 characters long"
        exit 1
    fi
    
    log_info "Environment validation passed"
}

backup_database() {
    log_info "Creating database backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if it exists
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_DIR/database.sql"
        log_info "Database backup created: $BACKUP_DIR/database.sql"
    else
        log_warn "Database container not running, skipping backup"
    fi
}

deploy_application() {
    log_info "Deploying application..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Build and start services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build
    
    log_info "Application deployed successfully"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:${BACKEND_PORT:-8000}/health &> /dev/null; then
        log_info "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:${FRONTEND_PORT:-3000} &> /dev/null; then
        log_info "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check database connection
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "$POSTGRES_USER" &> /dev/null; then
        log_info "Database health check passed"
    else
        log_error "Database health check failed"
        return 1
    fi
    
    log_info "All health checks passed"
}

setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p nginx/ssl
    
    # Check if certificates exist
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        log_warn "SSL certificates not found"
        log_info "Please add your SSL certificates to nginx/ssl/"
        log_info "  - nginx/ssl/cert.pem (certificate)"
        log_info "  - nginx/ssl/key.pem (private key)"
        
        # Generate self-signed certificate for testing
        log_info "Generating self-signed certificate for testing..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN:-localhost}"
        
        log_warn "Self-signed certificate generated. Replace with proper SSL certificate for production!"
    else
        log_info "SSL certificates found"
    fi
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_info "Cleanup completed"
}

show_status() {
    log_info "Deployment Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    log_info "Application URLs:"
    echo "  Frontend: https://${DOMAIN:-localhost}"
    echo "  Backend API: https://${DOMAIN:-localhost}/api"
    echo "  API Documentation: https://${DOMAIN:-localhost}/docs (if enabled)"
}

rollback() {
    log_warn "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore database if backup exists
    if [ -f "$BACKUP_DIR/database.sql" ]; then
        log_info "Restoring database from backup..."
        docker-compose -f "$COMPOSE_FILE" up -d postgres
        sleep 10
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$BACKUP_DIR/database.sql"
    fi
    
    log_info "Rollback completed"
}

# Main deployment process
main() {
    log_info "Starting production deployment..."
    
    # Trap errors for rollback
    trap 'log_error "Deployment failed! Run with --rollback to restore previous state"; exit 1' ERR
    
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            validate_environment
            backup_database
            setup_ssl
            deploy_application
            
            if run_health_checks; then
                cleanup_old_images
                show_status
                log_info "Deployment completed successfully!"
            else
                log_error "Health checks failed!"
                exit 1
            fi
            ;;
        
        "rollback")
            rollback
            ;;
        
        "status")
            show_status
            ;;
        
        "logs")
            docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
            ;;
        
        "stop")
            log_info "Stopping application..."
            docker-compose -f "$COMPOSE_FILE" down
            ;;
        
        "restart")
            log_info "Restarting application..."
            docker-compose -f "$COMPOSE_FILE" restart "${2:-}"
            ;;
        
        *)
            echo "Usage: $0 {deploy|rollback|status|logs|stop|restart}"
            echo "  deploy   - Deploy the application"
            echo "  rollback - Rollback to previous version"
            echo "  status   - Show application status"
            echo "  logs     - Show application logs"
            echo "  stop     - Stop the application"
            echo "  restart  - Restart the application"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"