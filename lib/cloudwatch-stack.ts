import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Dashboard, GraphWidget, Metric } from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

interface CloudWatchStackProps extends StackProps {
	readonly generateSocialMediaWorkflowArn: string;
	readonly generateImageWorkflowArn: string;
    readonly approveFunctionName: string;
    readonly rejectFunctionName: string;
}

export class CloudWatchStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudWatchStackProps) {
		super(scope, id, props);

        const dashboard = new Dashboard(this,'SocialMediaGenerator-CloudWatch-Dashboard', {
				dashboardName: 'SocialMediaGenerator-CloudWatch-Dashboard',
			}
		);

        //Widgets related to the Step Function
		dashboard.addWidgets(
			new GraphWidget({
				title: 'Step Functions ExecutionsStarted (sum)',
				width: 12,
				left: [
					new Metric({
						namespace: 'AWS/States',
						metricName: 'ExecutionsStarted',
						dimensionsMap: {
							StateMachineArn: props.generateSocialMediaWorkflowArn,
						},
						statistic: 'sum',
						label: 'Generate Social Media workflow Execution Started',
						period: Duration.minutes(1),
					}),
                    new Metric({
						namespace: 'AWS/States',
						metricName: 'ExecutionsStarted',
						dimensionsMap: {
							StateMachineArn: props.generateImageWorkflowArn,
						},
						statistic: 'sum',
						label: 'Generate Image workflow Execution Started',
						period: Duration.minutes(1),
					}),
				],
			}),
			new GraphWidget({
				title: 'Step Function ExecutionsSucceeded (sum)',
				width: 12,
				left: [
					new Metric({
						namespace: 'AWS/States',
						metricName: 'ExecutionsSucceeded',
						dimensionsMap: {
							StateMachineArn: props.generateSocialMediaWorkflowArn,
						},
						statistic: 'sum',
						label: 'Generate Social Media workflow ExecutionsSucceeded',
						period: Duration.minutes(1),
					}),
					new Metric({
						namespace: 'AWS/States',
						metricName: 'ExecutionsSucceeded',
						dimensionsMap: {
							StateMachineArn: props.generateImageWorkflowArn,
						},
						statistic: 'sum',
						label: 'Generate Image workflow ExecutionsSucceeded',
						period: Duration.minutes(1),
					}),
				],
			}),
			new GraphWidget({
				title: 'Step Function Executions Failed (sum)',
				width: 12,
				left: [
					new Metric({
						namespace: 'AWS/States',
						metricName: 'ExecutionsFailed',
						dimensionsMap: {
							StateMachineArn: props.generateSocialMediaWorkflowArn,
						},
						statistic: 'sum',
						label: 'Generate Social Media workflow ExecutionsFailed',
						period: Duration.minutes(1),
					}),
                    new Metric({
						namespace: 'AWS/States',
						metricName: 'ExecutionsFailed',
						dimensionsMap: {
							StateMachineArn: props.generateImageWorkflowArn,
						},
						statistic: 'sum',
						label: 'Generate Image workflow ExecutionsFailed',
						period: Duration.minutes(1),
					}),
				],
			})
		);

		//Widgets related to the Lambda functions
		dashboard.addWidgets(
			new GraphWidget({
				title: 'AWS Function Errors (sum)',
				width: 12,
				left: [
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Errors',
						dimensionsMap: {
							FunctionName: props.approveFunctionName,
						},
						statistic: 'sum',
						label: 'Approve function Errors',
						period: Duration.minutes(1),
					}),
                    new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Errors',
						dimensionsMap: {
							FunctionName: props.rejectFunctionName,
						},
						statistic: 'sum',
						label: 'Reject function Errors',
						period: Duration.minutes(1),
					}),
				],
			}),
			new GraphWidget({
				title: 'AWS Function URL Request Duration and Latency (p99)',
				width: 12,
				left: [
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'UrlRequestLatency',
						dimensionsMap: {
							FunctionName: props.approveFunctionName,
						},
						statistic: 'p99',
						label: 'Approve function p99 Latency',
						period: Duration.minutes(1),
					}),
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Duration',
						dimensionsMap: {
							FunctionName: props.approveFunctionName,
						},
						statistic: 'p99',
						label: 'Approve function p99 Duration',
						period: Duration.minutes(1),
					}),
                    new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'UrlRequestLatency',
						dimensionsMap: {
							FunctionName: props.rejectFunctionName,
						},
						statistic: 'p99',
						label: 'Reject function p99 Latency',
						period: Duration.minutes(1),
					}),
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Duration',
						dimensionsMap: {
							FunctionName: props.rejectFunctionName,
						},
						statistic: 'p99',
						label: 'Reject function p99 Duration',
						period: Duration.minutes(1),
					}),
				],
			}),
			new GraphWidget({
				title: 'AWS Function Invocations (sum)',
				width: 12,
				left: [
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Invocations',
						dimensionsMap: {
							FunctionName: props.approveFunctionName,
						},
						statistic: 'sum',
						label: 'Approve function invocations Sum',
						period: Duration.minutes(1),
					}),
                    new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Invocations',
						dimensionsMap: {
							FunctionName: props.rejectFunctionName,
						},
						statistic: 'sum',
						label: 'Reject function invocations Sum',
						period: Duration.minutes(1),
					}),
				],
			}),
			new GraphWidget({
				title: 'AWS Function Concurrent executions (Max)',
				width: 12,
				left: [
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'ConcurrentExecutions',
						dimensionsMap: {
							FunctionName: props.approveFunctionName,
						},
						statistic: 'max',
						label: 'Approved function concurrent executions Max',
						period: Duration.minutes(1),
					}),
                    new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'ConcurrentExecutions',
						dimensionsMap: {
							FunctionName: props.rejectFunctionName,
						},
						statistic: 'max',
						label: 'Reject function concurrent executions Max',
						period: Duration.minutes(1),
					}),
				],
			})
		);

  }
}