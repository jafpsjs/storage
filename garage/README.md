This is for local S3 integration test only.

## Setup

```
docker run \
  -d \
  --name garaged \
  -p 3900:3900 \
  -p 3903:3903 \
  -v ./garage.toml:/etc/garage.toml \
  -v ./meta:/var/lib/garage/meta \
  -v ./data:/var/lib/garage/data \
  dxflrs/garage:v2.1.0
```

```
docker exec -it garaged /garage status
docker exec -it garaged /garage layout assign $id -z dc1 -c 1G
docker exec -it garaged /garage layout apply --version 1
docker exec -it garaged /garage bucket create test
docker exec -it garaged /garage key create test-key
docker exec -it garaged /garage bucket allow --read --write --owner test --key test-key
```
