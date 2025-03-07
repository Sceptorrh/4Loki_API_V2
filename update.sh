#!/bin/bash

# Pull the latest changes from git
git pull

# Pull the latest images
docker-compose pull

# Restart the containers with the new images
docker-compose up -d

# Show the status of the containers
docker-compose ps

# Show the logs of the api container
docker-compose logs -f api 