import { SFNClient, SendTaskSuccessCommand } from '@aws-sdk/client-sfn';

const sfnClient = new SFNClient({});

export const handler = async (event: any) => {
  console.log("Approve event received:", JSON.stringify(event, null, 2));

  const taskToken = event.queryStringParameters?.taskToken;

  if (!taskToken) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Error: Token de tarea no encontrado</h1>'
    };
  }

  try {
    await sfnClient.send(new SendTaskSuccessCommand({
      taskToken: decodeURIComponent(taskToken),
      output: JSON.stringify({ decision: 'approved' })
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Solicitud APROBADA exitosamente</h1><p>La maquina de estados continuara su ejecucion.</p>'
    };
  } catch (error) {
    console.error('Error aprobando tarea:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Error procesando la aprobacion</h1>'
    };
  }
};