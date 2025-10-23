
export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));
  const { prompt, taskToken} = event;

  console.log("Prompt:", prompt);
  console.log("Task Token:", taskToken);

  return;
};