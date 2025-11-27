# Process automation with Step Functions and artificial inteligence 

_Infrastructure as code framework used_: AWS CDK
_AWS Services used_: AWS Step Functions, AWS Lambda, Amazon DynamoDB, Amazon Bedrock, Amazon S3, Amazon SNS

## Summary of the demo

In this demo you will see:

- Advance step functions usage
- Workflow patterns
- Bedrock integrations 
- Integration with 3rd party services
- Human in the loop
- Error handling
- Parallel processing
- Cost optimization
- Monitoring and debugging.

This demo is part of a [course](https://join.desplegando.cloud/curso/orquestacion-step-functions/). 

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the AWS Pricing page for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

## Requirements

- AWS CLI already configured with Administrator permission
- AWS CDK - v2
- NodeJS 20.x installed
- CDK bootstrapped in your account

## Deploy this demo

Deploy the project to the cloud:

```
cdk synth
cdk deploy
```

When asked about functions that may not have authorization defined, answer (y)es. The access to those functions will be open to anyone, so keep the app deployed only for the time you need this demo running.

To delete the app:

```
cdk destroy
```

## Links related to this code

- Video with more details: 

### AWS CDK useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template