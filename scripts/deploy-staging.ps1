# Staging deployment script for Windows
# Usage: .\scripts\deploy-staging.ps1

Write-Host "Starting staging deployment..."

# Check if required environment variables are set
if (-not $env:DOCKERHUB_USERNAME -or -not $env:DOCKERHUB_TOKEN) {
  Write-Error "Error: DOCKERHUB_USERNAME and DOCKERHUB_TOKEN environment variables must be set"
  exit 1
}

# Build and push Docker image
Write-Host "Building Docker image for staging..."
docker build -t "$env:DOCKERHUB_USERNAME/ai-interview-assistant:staging" .

Write-Host "Logging into DockerHub..."
echo $env:DOCKERHUB_TOKEN | docker login -u $env:DOCKERHUB_USERNAME --password-stdin

Write-Host "Pushing image to DockerHub..."
docker push "$env:DOCKERHUB_USERNAME/ai-interview-assistant:staging"

# Deploy to staging environment
Write-Host "Deploying to staging environment..."
# This would typically involve:
# 1. Connecting to your staging server/cluster
# 2. Pulling the new image
# 3. Stopping old containers
# 4. Starting new containers with updated image
# 5. Running health checks

# Example deployment commands (uncomment and modify as needed):
# ssh staging-server "docker pull $env:DOCKERHUB_USERNAME/ai-interview-assistant:staging"
# ssh staging-server "docker stop ai-interview-staging" 2>$null
# ssh staging-server "docker rm ai-interview-staging" 2>$null
# ssh staging-server "docker run -d --name ai-interview-staging -p 5000:5000 -p 5443:5443 --env-file .env.staging $env:DOCKERHUB_USERNAME/ai-interview-assistant:staging"

Write-Host "Staging deployment completed successfully!"