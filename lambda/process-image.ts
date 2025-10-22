import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const handler = async (event: any) => {
    const bucketName = event.bucketName;
    const sourceKey = event.sourceKey || 'generated-image.json';
    const targetKey = event.targetKey || 'generated-image.png';
    
    // Get JSON from S3
    const getResponse = await s3.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: sourceKey
    }));
    
    const jsonData = JSON.parse(await getResponse.Body!.transformToString());
    const imageBase64 = jsonData.images[0];
    
    // Decode and save as PNG
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: targetKey,
        Body: imageBuffer,
        ContentType: 'image/png'
    }));
    
    return { 
        imageUrl: `s3://${bucketName}/${targetKey}`
    };
};