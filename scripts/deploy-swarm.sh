#!/bin/bash

# ===========================================
# Docker Swarm Deployment Script
# API Predict - Emarsys Scraper
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stack name
STACK_NAME="${STACK_NAME:-api-predict}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker Swarm is initialized
check_swarm() {
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
        log_error "Docker Swarm is not initialized!"
        log_info "Run: docker swarm init"
        exit 1
    fi
    log_success "Docker Swarm is active"
}

# Check if environment file exists
check_env() {
    if [ ! -f ".env.swarm" ]; then
        log_warning ".env.swarm file not found!"
        log_info "Creating from template..."
        cp .env.swarm.example .env.swarm 2>/dev/null || {
            log_error "Please create .env.swarm file with your configuration"
            exit 1
        }
    fi
    log_success "Environment file found"
}

# Load environment variables
load_env() {
    log_info "Loading environment variables..."
    set -a
    source .env.swarm
    set +a
    log_success "Environment loaded"
}

# Create required networks
create_networks() {
    log_info "Creating networks..."

    if ! docker network ls | grep -q "traefik-public"; then
        docker network create --driver=overlay --attachable traefik-public
        log_success "Created traefik-public network"
    else
        log_info "traefik-public network already exists"
    fi
}

# Deploy the stack
deploy() {
    log_info "Deploying stack: $STACK_NAME"

    docker stack deploy \
        --compose-file docker-stack.yml \
        --with-registry-auth \
        $STACK_NAME

    log_success "Stack deployed successfully!"
}

# Show stack status
status() {
    log_info "Stack status:"
    echo ""
    docker stack services $STACK_NAME
    echo ""
    log_info "Service tasks:"
    docker stack ps $STACK_NAME --no-trunc
}

# Remove stack
remove() {
    log_warning "Removing stack: $STACK_NAME"
    docker stack rm $STACK_NAME
    log_success "Stack removed"
}

# Scale API replicas
scale() {
    local replicas=${1:-2}
    log_info "Scaling api-predict to $replicas replicas..."
    docker service scale ${STACK_NAME}_api-predict=$replicas
    log_success "Scaled to $replicas replicas"
}

# View logs
logs() {
    local service=${1:-api-predict}
    log_info "Showing logs for ${STACK_NAME}_${service}..."
    docker service logs -f ${STACK_NAME}_${service}
}

# Update service
update() {
    local version=${1:-latest}
    log_info "Updating api-predict to version: $version"
    docker service update \
        --image ghcr.io/hectorcanaimero/api-predict:$version \
        --update-parallelism 1 \
        --update-delay 10s \
        ${STACK_NAME}_api-predict
    log_success "Service updated to $version"
}

# Generate Traefik credentials
generate_credentials() {
    log_info "Generating Traefik dashboard credentials..."
    read -p "Enter username: " username
    read -s -p "Enter password: " password
    echo ""

    credentials=$(docker run --rm httpd:alpine htpasswd -Bbn "$username" "$password" | sed -e 's/\$/\$\$/g')

    echo ""
    log_success "Add this to your .env.swarm:"
    echo "TRAEFIK_DASHBOARD_CREDENTIALS=$credentials"
}

# Show help
help() {
    echo "
Docker Swarm Deployment Script for API Predict

Usage: ./scripts/deploy-swarm.sh [command] [options]

Commands:
    deploy              Deploy the full stack
    status              Show stack status
    remove              Remove the stack
    scale [n]           Scale API to n replicas (default: 2)
    logs [service]      Show service logs (default: api-predict)
    update [version]    Update API to specific version (default: latest)
    credentials         Generate Traefik dashboard credentials
    help                Show this help message

Examples:
    ./scripts/deploy-swarm.sh deploy
    ./scripts/deploy-swarm.sh scale 3
    ./scripts/deploy-swarm.sh update v1.0.0
    ./scripts/deploy-swarm.sh logs traefik
"
}

# Main
main() {
    local command=${1:-deploy}

    case $command in
        deploy)
            check_swarm
            check_env
            load_env
            create_networks
            deploy
            echo ""
            log_info "Waiting for services to start..."
            sleep 10
            status
            echo ""
            log_success "Deployment complete!"
            log_info "API available at: https://api.\${DOMAIN}"
            log_info "Traefik Dashboard: https://traefik.\${DOMAIN}"
            ;;
        status)
            status
            ;;
        remove)
            remove
            ;;
        scale)
            scale $2
            ;;
        logs)
            logs $2
            ;;
        update)
            update $2
            ;;
        credentials)
            generate_credentials
            ;;
        help|--help|-h)
            help
            ;;
        *)
            log_error "Unknown command: $command"
            help
            exit 1
            ;;
    esac
}

main "$@"
