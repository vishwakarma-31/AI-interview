#!/bin/bash

# Staging deployment script
# Usage: ./scripts/deploy-staging.sh

set -e  # Exit on any error

echo "Starting staging deployment..."

# Check if required environment variables are set
if [ -z "$DOCKERHUB_USERNAME" ] || [ -z "$DOCKERHUB_TOKEN" ]; then
  echo "Error: DOCKERHUB_USERNAME and DOCKERHUB_TOKEN environment variables must be set"
  exit 1
fi

# Build and push Docker image
echo "Building Docker image for staging..."
docker build -t $DOCKERHUB_USERNAME/ai-interview-assistant:staging .

echo "Logging into DockerHub..."
echo $DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USERNAME --password-stdin

echo "Pushing image to DockerHub..."
docker push $DOCKERHUB_USERNAME/ai-interview-assistant:staging

# Deploy to staging environment
echo "Deploying to staging environment..."
# This would typically involve:
# 1. Connecting to your staging server/cluster
# 2. Pulling the new image
# 3. Stopping old containers
# 4. Starting new containers with updated image
# 5. Running health checks

# Example deployment commands (uncomment and modify as needed):
# ssh staging-server "docker pull $DOCKERHUB_USERNAME/ai-interview-assistant:staging"
# ssh staging-server "docker stop ai-interview-staging || true"
# ssh staging-server "docker rm ai-interview-staging || true"
# ssh staging-server "docker run -d --name ai-interview-staging -p 5000:5000 -p 5443:5443 --env-file .env.staging $DOCKERHUB_USERNAME/ai-interview-assistant:staging"

echo "Staging deployment completed successfully!"