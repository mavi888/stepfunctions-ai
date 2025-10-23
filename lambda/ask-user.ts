import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({});

export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const { prompt, taskToken} = event;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  const apiGatewayUrl = process.env.APIGATEWAY_URL; 

  const approveUrl = `${apiGatewayUrl}approve?taskToken=${encodeURIComponent(taskToken)}&decision=approve`;
  const rejectUrl = `${apiGatewayUrl}reject?taskToken=${encodeURIComponent(taskToken)}&decision=reject`;

  const emailMessage = `
Solicitud de Aprobación Manual

Prompt a evaluar:
${prompt}

Por favor, haz clic en uno de los siguientes enlaces para tomar una decisión:

✅ APROBAR: ${approveUrl}

❌ RECHAZAR: ${rejectUrl}

Este email es generado automáticamente por el sistema de Step Functions.
  `;

  const publishParams = {
    TopicArn: snsTopicArn,
    Subject: 'Aprobación Manual Requerida - Step Functions',
    Message: emailMessage
  };

  try {
    await snsClient.send(new PublishCommand(publishParams));
    console.log('Email enviado exitosamente');
    
    return {
      statusCode: 200,
      message: 'Email de aprobación enviado'
    };
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};