# CoderDojo-stats

## Run

To generate stats run the following commands

```
docker-compose up -d db
docker-compose run --rm db pg_restore -C -U platform -h db -Fd /db/dojos
docker-compose run --rm db pg_restore -C -U platform -h db -Fd /db/events
docker-compose run --rm db pg_restore -C -U platform -h db -Fd /db/users
docker-compose up stats
```

This will run the default `get-stats` argument modify the command arguments to
generate relevant stats.

Make sure to have db dumps called `users`, `dojos`, `events` in the dump folder
