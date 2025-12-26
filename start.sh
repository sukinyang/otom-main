#!/bin/bash
# Otom Backend - Startup Script
# Usage: ./start.sh [development|production|docker]

set -e

MODE=${1:-development}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_error ".env file not found!"
        log_info "Copy .env.example to .env and configure your API keys"
        echo "  cp .env.example .env"
        exit 1
    fi
}

start_development() {
    log_info "Starting Otom in DEVELOPMENT mode..."
    check_env

    cd "$PROJECT_DIR"

    # Install dependencies if needed
    if [ ! -d "venv" ]; then
        log_info "Creating virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    log_info "Starting backend server on http://localhost:8000"
    python main.py
}

start_production() {
    log_info "Starting Otom in PRODUCTION mode with PM2..."
    check_env

    cd "$PROJECT_DIR"

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed!"
        log_info "Install with: npm install -g pm2"
        exit 1
    fi

    # Create logs directory
    mkdir -p logs

    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save

    log_info "Otom is running! View logs with: pm2 logs otom-backend"
    log_info "To ensure PM2 starts on boot: pm2 startup"
}

start_docker() {
    log_info "Starting Otom with Docker Compose..."
    check_env

    cd "$PROJECT_DIR"

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running!"
        exit 1
    fi

    # Build and start containers
    docker-compose up -d --build

    log_info "Otom is running in Docker!"
    log_info "View logs with: docker-compose logs -f"
    log_info "Stop with: docker-compose down"
}

stop_all() {
    log_info "Stopping Otom services..."

    # Stop PM2 processes
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
    fi

    # Stop Docker containers
    if command -v docker-compose &> /dev/null; then
        docker-compose down 2>/dev/null || true
    fi

    log_info "All services stopped"
}

case "$MODE" in
    development|dev)
        start_development
        ;;
    production|prod)
        start_production
        ;;
    docker)
        start_docker
        ;;
    stop)
        stop_all
        ;;
    *)
        echo "Usage: $0 {development|production|docker|stop}"
        echo ""
        echo "Modes:"
        echo "  development  - Run locally with auto-reload (default)"
        echo "  production   - Run with PM2 process manager (24/7)"
        echo "  docker       - Run with Docker Compose"
        echo "  stop         - Stop all running services"
        exit 1
        ;;
esac
