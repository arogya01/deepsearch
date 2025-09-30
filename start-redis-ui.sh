#!/usr/bin/env bash
# Start Redis Commander web UI

echo "Starting Redis Commander on http://localhost:8081"
docker run --rm -d \
  --name redis-commander \
  -p 8081:8081 \
  -e REDIS_HOSTS=local:host.docker.internal:6379:0:arogya30 \
  ghcr.io/joeferner/redis-commander:latest

echo "✅ Redis Commander running!"
echo "🌐 Open: http://localhost:8081"
echo "To stop: docker stop redis-commander"
