import { SFNClient, SendTaskFailureCommand } from '@aws-sdk/client-sfn';

const sfnClient = new SFNClient({});

export const handler = async (event: any) => {
  console.log("Reject event received:", JSON.stringify(event, null, 2));

  const taskToken = event.queryStringParameters?.taskToken;

  if (!taskToken) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Error: Token de tarea no encontrado</h1>'
    };
  }

  try {
    await sfnClient.send(new SendTaskFailureCommand({
      taskToken: decodeURIComponent(taskToken),
      error: 'UserRejected',
      cause: 'El usuario rechazo la solicitud'
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Solicitud RECHAZADA exitosamente</h1><p>La maquina de estados ha sido notificada del rechazo.</p>'
    };
  } catch (error) {
    console.error('Error rechazando tarea:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Error procesando el rechazo</h1>'
    };
  }
};