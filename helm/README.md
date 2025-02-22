# Main Application Helm Chart

## Setting up the environment

To set environment see assets/README.md


## Deploying the apps

Get values files from AWS S3

command:
aws s3 cp s3://pfitz-configs/thuso/staging/values-staging.yaml ./medulla
aws s3 cp s3://pfitz-configs/thuso/prod/values-prod.yaml ./medulla

helm install thuso-staging medulla -f thuso/values-staging.yaml
helm install thuso-prod medulla -f thuso/values-prod.yaml