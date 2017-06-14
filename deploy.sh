#!/bin/bash

# Exit on any error
set -e

sudo /opt/google-cloud-sdk/bin/gcloud docker -- push us.gcr.io/${PROJECT_NAME}/hello
sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube
kubectl patch deployment web-services-staging -p '{"spec":{"template":{"spec":{"containers":[{"name":"web-services-staging","image":"us.gcr.io/web-services-staging/hello:'"$CIRCLE_SHA1"'"}]}}}}'