#!/bin/bash

# Exit on any error
set -e

sudo chown -R ${USER} /home/ubuntu/.config
sudo /opt/google-cloud-sdk/bin/gcloud docker -- push us.gcr.io/${PROJECT_NAME}/hello
sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube
kubectl create secret generic cloudsql-instance-credentials --from-file=credentials.json=${HOME}/gcloud-service-key.json
kubectl create secret generic cloudsql-db-credentials --from-literal=username=postgres --from-literal=password=postgres
kubectl replace -f ./deployment.yml
#deployment web-services-deployment -p '{"spec":{"template":{"spec":{"containers":[{"name":"web-services-deployment","image":"us.gcr.io/web-services-staging/hello:'"$CIRCLE_SHA1"'"}]}}}}'
