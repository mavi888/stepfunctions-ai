import * as cdk from 'aws-cdk-lib';
import { CfnOutput, SecretValue } from 'aws-cdk-lib';
import { Authorization, Connection } from 'aws-cdk-lib/aws-events';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { DefinitionBody, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';

export class StepfunctionsCourseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket
    const dataBucket = new Bucket(this, 'StateMachineAICourseDataBucket', {
      bucketName: 'statemachine-ai-course-data-bucket-v1',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const policyS3Access = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['s3:GetObject', 's3:PutObject'],
          resources: [
            dataBucket.bucketArn, 
            `${dataBucket.bucketArn}/*`
          ],
        }),
      ],
    });

    // ---- Deploy prompts to S3 ----
    new BucketDeployment(this, 'DeployPrompts', {
      sources: [Source.asset('./demo-data')],
      destinationBucket: dataBucket,
      destinationKeyPrefix: 'prompts/',
    });

    // -- Step Function ---
     const perplexityAPIConnection = new Connection(this, 'StateMachineAICoursePerplexity', {
      connectionName: 'perplexity',
      description: 'Connection for HTTP API calls',
      authorization: Authorization.apiKey('Authorization', SecretValue.secretsManager('perplexity-api-key')),
    });

    const connectionAccessPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['events:RetrieveConnectionCredentials'],
          resources: [perplexityAPIConnection.connectionArn]
        }),
        new PolicyStatement({
          actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
          resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:events!connection/*`]
        })
      ],
    });

    const policyHttpEndpoint = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: ['states:InvokeHTTPEndpoint'],
                    resources: ['*'],
                }),
            ],
    });

    const stateMachineRole = new Role(this, 'StateMachineAICourseRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      inlinePolicies: {
        S3AccessPolicy: policyS3Access,
        connectionAccessPolicy: connectionAccessPolicy,
        policyHttpEndpoint: policyHttpEndpoint
      },
    });

    const workflow = new StateMachine(this, 'MyStepFunctionAICourse', {
      stateMachineName: 'MyStepFunctionAICourse',
      role: stateMachineRole,
      definitionBody: DefinitionBody.fromFile('statemachine/definition.asl.json'),
      definitionSubstitutions: {
        DataBucketName: dataBucket.bucketName,
        PerplexityConnectionArn: perplexityAPIConnection.connectionArn
      }
    });

    new CfnOutput(this, 'CFOutputStepFunctionArn', {
      value: workflow.stateMachineArn
    });
  }
}
