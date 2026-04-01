#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StepfunctionsCourseStack } from '../lib/stepfunctions-course-stack';
import { CloudWatchStack } from '../lib/cloudwatch-stack';

const app = new cdk.App();
const mainStack = new StepfunctionsCourseStack(app, 'StepfunctionsCourseStack', {});

new CloudWatchStack(app, 'CloudwatchStack', {
  generateImageWorkflowArn: mainStack.generateImageWorkflowArn.value,
  generateSocialMediaWorkflowArn: mainStack.generateSocialMediaWorkflowArn.value,
  approveFunctionName: mainStack.approveFunctionName.value,
  rejectFunctionName: mainStack.rejectFunctionName.value,
})