#!/bin/bash

# Exit on any error
set -e

sudo chown -R ${USER} /home/ubuntu/.config
gulp pushDocker
sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube
#kubectl create secret generic cloudsql-instance-credentials --from-file=credentials.json=${HOME}/gcloud-service-key.json
#kubectl create secret generic cloudsql-db-credentials --from-literal=username=postgres --from-literal=password=postgres
gulp kubectlCreateDeplConfig
gulp kubectlCreateServiceConfig
kubectl apply -f ./deployment/kubernetes-deployment.yml
#kubectl replace -f ./deployment/kubernetes-service.yml
