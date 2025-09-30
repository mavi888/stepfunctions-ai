import * as cdk from 'aws-cdk-lib';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { DefinitionBody, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';

export class StepfunctionsCourseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stateMachineRole = new Role(this, 'StateMachineAICourseRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });

    const workflow = new StateMachine(this, 'MyStepFunctionAICourse', {
      stateMachineName: 'MyStepFunctionAICourse',
      role: stateMachineRole,
      definitionBody: DefinitionBody.fromFile('statemachine/definition.asl.json'),
    });
  }
}
