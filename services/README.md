# Setup
Run `docker-compose up -d` to start a local single-node Kafka cluster.

## Flink
`Network:`
```shell
$ FLINK_PROPERTIES="jobmanager.rpc.address: jobmanager"
$ docker network create flink-network
```

`JobManager:`
```shell
docker run \
    --rm \
    --name=jobmanager \
    --network flink-network \
    --publish 8081:8081 \
    --env FLINK_PROPERTIES="${FLINK_PROPERTIES}" \
    flink:latest jobmanager
```

`TaskManager:`
```shell
docker run \
    --rm \
    --name=taskmanager \
    --network flink-network \
    --env FLINK_PROPERTIES="${FLINK_PROPERTIES}" \
    flink:latest taskmanager
```
