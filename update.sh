#!/bin/bash

# Pull the latest changes from git
git pull

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull the latest images
docker-compose pull

# Restart the containers with the new images
docker-compose up -d

# Show the status of the containers
docker-compose ps

# Show the logs of the api container
docker-compose logs -f api 