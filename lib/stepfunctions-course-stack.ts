import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
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

    // -- Step Function ---
    const stateMachineRole = new Role(this, 'StateMachineAICourseRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      inlinePolicies: {
        S3AccessPolicy: policyS3Access,
      },
    });

    const workflow = new StateMachine(this, 'MyStepFunctionAICourse', {
      stateMachineName: 'MyStepFunctionAICourse',
      role: stateMachineRole,
      definitionBody: DefinitionBody.fromFile('statemachine/definition.asl.json'),
      definitionSubstitutions: {
        DataBucketName: dataBucket.bucketName,
      }
    });

    new CfnOutput(this, 'CFOutputStepFunctionArn', {
      value: workflow.stateMachineArn
    });
  }
}
