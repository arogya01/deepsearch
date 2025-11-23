#!/usr/bin/env bash
# Start RedisInsight web UI

REDISINSIGHT_CONTAINER_NAME="redisinsight"

if ! [ -x "$(command -v docker)" ]; then
  echo -e "Docker is not installed. Please install docker and try again.\nDocker install guide: https://docs.docker.com/engine/install/"
  exit 1
fi

if [ "$(docker ps -q -f name=$REDISINSIGHT_CONTAINER_NAME)" ]; then
  echo "RedisInsight container already running"
  echo "🌐 Open: http://localhost:5540"
  exit 0
fi

if [ "$(docker ps -q -a -f name=$REDISINSIGHT_CONTAINER_NAME)" ]; then
  docker start "$REDISINSIGHT_CONTAINER_NAME"
  echo "✅ Existing RedisInsight container started!"
  echo "🌐 Open: http://localhost:5540"
  exit 0
fi

echo "Starting RedisInsight on http://localhost:5540"
docker run -d \
  --name $REDISINSIGHT_CONTAINER_NAME \
  -p 5540:5540 \
  -v redisinsight:/data \
  redis/redisinsight:latest

echo ""
echo "✅ RedisInsight running!"
echo "🌐 Open: http://localhost:5540"
echo ""
echo "To connect to your Redis instance:"
echo "  Host: host.docker.internal"
echo "  Port: 6379"
echo "  Password: arogya30"
echo ""
echo "To stop: docker stop $REDISINSIGHT_CONTAINER_NAME"
