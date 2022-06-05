#!/usr/bin/env bash
set -e
STACK_NAME=open-api-gateway-sample

if [ "$ARTIFACT_BUCKET" == "" ] ; then
  echo "ARTIFACT_BUCKET is empty."
  exit 1
fi
if [ "$ACCOUNT_ID" == "" ] ; then
  echo "ACCOUNT_ID is empty."
  exit 1
fi

# build lambda function
rm -rf dist
npm i
npm run build

# create cloudformation template
cd cdk
npm i
npm run build
npm run synth
cd ..

# deploy by cloudformation
aws cloudformation package \
  --template-file cdk/cdk.out/${STACK_NAME}.template.json \
  --s3-bucket ${ARTIFACT_BUCKET} \
  --s3-prefix ${STACK_NAME} \
  --output-template-file dist/template.yml

aws cloudformation deploy \
  --stack-name ${STACK_NAME} \
  --template-file dist/template.yml \
  --capabilities CAPABILITY_NAMED_IAM
