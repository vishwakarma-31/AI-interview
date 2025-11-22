#!/bin/bash

# Production deployment script
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on any error

echo "Starting production deployment..."

# Check if required environment variables are set
if [ -z "$DOCKERHUB_USERNAME" ] || [ -z "$DOCKERHUB_TOKEN" ]; then
  echo "Error: DOCKERHUB_USERNAME and DOCKERHUB_TOKEN environment variables must be set"
  exit 1
fi

# Build and push Docker image
echo "Building Docker image for production..."
docker build -t $DOCKERHUB_USERNAME/ai-interview-assistant:latest .

echo "Logging into DockerHub..."
echo $DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USERNAME --password-stdin

echo "Pushing image to DockerHub..."
docker push $DOCKERHUB_USERNAME/ai-interview-assistant:latest

# Deploy to production environment
echo "Deploying to production environment..."
# This would typically involve:
# 1. Connecting to your production server/cluster
# 2. Pulling the new image
# 3. Performing a rolling update to minimize downtime
# 4. Running health checks
# 5. Rolling back if health checks fail

# Example deployment commands (uncomment and modify as needed):
# ssh production-server "docker pull $DOCKERHUB_USERNAME/ai-interview-assistant:latest"
# ssh production-server "docker service update --image $DOCKERHUB_USERNAME/ai-interview-assistant:latest ai-interview-production"

echo "Production deployment completed successfully!"