# Production deployment script for Windows
# Usage: .\scripts\deploy-production.ps1

Write-Host "Starting production deployment..."

# Check if required environment variables are set
if (-not $env:DOCKERHUB_USERNAME -or -not $env:DOCKERHUB_TOKEN) {
  Write-Error "Error: DOCKERHUB_USERNAME and DOCKERHUB_TOKEN environment variables must be set"
  exit 1
}

# Build and push Docker image
Write-Host "Building Docker image for production..."
docker build -t "$env:DOCKERHUB_USERNAME/ai-interview-assistant:latest" .

Write-Host "Logging into DockerHub..."
echo $env:DOCKERHUB_TOKEN | docker login -u $env:DOCKERHUB_USERNAME --password-stdin

Write-Host "Pushing image to DockerHub..."
docker push "$env:DOCKERHUB_USERNAME/ai-interview-assistant:latest"

# Deploy to production environment
Write-Host "Deploying to production environment..."
# This would typically involve:
# 1. Connecting to your production server/cluster
# 2. Pulling the new image
# 3. Performing a rolling update to minimize downtime
# 4. Running health checks
# 5. Rolling back if health checks fail

# Example deployment commands (uncomment and modify as needed):
# ssh production-server "docker pull $env:DOCKERHUB_USERNAME/ai-interview-assistant:latest"
# ssh production-server "docker service update --image $env:DOCKERHUB_USERNAME/ai-interview-assistant:latest ai-interview-production"

Write-Host "Production deployment completed successfully!"