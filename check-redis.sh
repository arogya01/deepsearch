#!/usr/bin/env bash

REDIS_CONTAINER_NAME="deepsearch-redis"

echo "🔍 Checking Redis status..."
echo ""

# Check if container exists
if [ "$(docker ps -a -q -f name=$REDIS_CONTAINER_NAME)" ]; then
    # Check if container is running
    if [ "$(docker ps -q -f name=$REDIS_CONTAINER_NAME)" ]; then
        echo "✅ Container is RUNNING"
        echo ""
        echo "Container details:"
        docker ps -f name=$REDIS_CONTAINER_NAME --format "table {{.ID}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "Testing connection..."
        docker exec $REDIS_CONTAINER_NAME redis-cli ping 2>/dev/null || echo "⚠️  Connection test failed (might need password)"
    else
        echo "⚠️  Container EXISTS but is STOPPED"
        echo "Run: docker start $REDIS_CONTAINER_NAME"
    fi
else
    echo "❌ Container NOT FOUND"
    echo "Run: ./start-redis.sh to create it"
fi
