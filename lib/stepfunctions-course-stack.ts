import * as cdk from 'aws-cdk-lib';
import { CfnOutput, SecretValue } from 'aws-cdk-lib';
import { AttributeType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Authorization, Connection } from 'aws-cdk-lib/aws-events';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { DefinitionBody, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import * as config from '../config.json';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'path';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class StepfunctionsCourseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- DynamoDB table ---
    const dataTable = new Table(this, 'StateMachineAICourseTable', {
      tableName: 'statemachine-ai-course-table',
      partitionKey: { 
        name: 'id', 
        type: AttributeType.STRING 
      },
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- SNS Topic ---
    const snsTopic = new Topic(this, 'StateMachineAICourseSnsTopic');

    new Subscription(this, 'StateMachineAICourseSubscription', {
      topic: snsTopic,
      endpoint: config.emailAddress, // Cambia esto por tu email
      protocol: SubscriptionProtocol.EMAIL
    });

    const policySnsPublish = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['sns:Publish'],
          resources: [snsTopic.topicArn],
        })
      ],
    });

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

    // --- Lambda functions ---
    const signS3UrlFunction = new NodejsFunction(this, 'SignS3UrlFunction', {
      entry: path.join(__dirname, '../lambda/sign-s3-url.ts'), // Use entry instead of code
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',

      // Bundle configuration
      bundling: {
        minify: true,         // Minify code
        sourceMap: true,      // Include source maps
        externalModules: [    // Modules that should be excluded from bundling
            'aws-sdk',
        ],
      },
    });

    dataBucket.grantRead(signS3UrlFunction);

    const policyLambdaAccess = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [signS3UrlFunction.functionArn],
        })
      ],
    });

    // -- Step Function ---
    const policyInvokeBedrock = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['bedrock:InvokeModel'],
          resources: [`arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-text-express-v1`],
        })
      ],
    });


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
        policyHttpEndpoint: policyHttpEndpoint,
        policySnsPublish: policySnsPublish,
        policyLambdaAccess: policyLambdaAccess,
        policyInvokeBedrock: policyInvokeBedrock
      },
    });

    const workflow = new StateMachine(this, 'MyStepFunctionAICourse', {
      stateMachineName: 'MyStepFunctionAICourse',
      role: stateMachineRole,
      definitionBody: DefinitionBody.fromFile('statemachine/definition.asl.json'),
      definitionSubstitutions: {
        DataBucketName: dataBucket.bucketName,
        PerplexityConnectionArn: perplexityAPIConnection.connectionArn,
        SNSTopicArn: snsTopic.topicArn,
        SignS3UrlFunctionArn: signS3UrlFunction.functionArn
      }
    });

    // --- EventBridge Pipe --- 
    const pipeLogGroup = new LogGroup(this, 'PipeLogGroup', {
      logGroupName: '/aws/pipes/dynamo-stepfunction-pipe',
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const pipeRole = new Role(this, 'PipeRole', {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      inlinePolicies: {
        DynamoStreamAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
              resources: [dataTable.tableStreamArn!]
            })
          ]
        }),
        StepFunctionAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['states:StartExecution'],
              resources: [workflow.stateMachineArn]
            }),
            new PolicyStatement({
              actions: ['iam:PassRole'],
              resources: [stateMachineRole.roleArn] //el permiso iam:PassRole que es requerido para pasar el rol de ejecución a la Step Function.
            })
          ]
        }),
        LogsAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [pipeLogGroup.logGroupArn]
            })
          ]
        })
      }
    });

    const pipe = new CfnPipe(this, 'DynamoToStepFunctionPipe', {
      roleArn: pipeRole.roleArn,
      source: dataTable.tableStreamArn!,
      target: workflow.stateMachineArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET'
        }
      },
      sourceParameters: {
        dynamoDbStreamParameters: {
          batchSize: 1,
          startingPosition: 'LATEST'
        },
        filterCriteria: {
          filters: [{
            pattern: JSON.stringify({
              eventName: ['INSERT']
            })
          }]
        }
      },
      logConfiguration: {
        cloudwatchLogsLogDestination: {
          logGroupArn: pipeLogGroup.logGroupArn
        },
        level: 'INFO'
      }
    });

    // --- CloudFormation Outputs ---
    new CfnOutput(this, 'CFOutputStepFunctionArn', {
      value: workflow.stateMachineArn
    });

    new CfnOutput(this, 'CFOutputDynamoDBTableName', {
      value: dataTable.tableName
    });

    new CfnOutput(this, 'CFOutputPipeArn', {
      value: pipe.attrArn
    });
  }
}
