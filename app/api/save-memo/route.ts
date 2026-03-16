import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region });

const TABLE_NAME = 'lito-jobs';
const OUTPUT_BUCKET = 'lito.ai-output-memos';

export async function POST(req: NextRequest) {
  try {
    const { jobId, fullMemo } = await req.json();

    if (!jobId || !fullMemo) {
      return NextResponse.json({ error: 'Missing jobId or fullMemo' }, { status: 400 });
    }

    // 1. Get the S3 Key from DynamoDB
    const { Item } = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { jobId },
      })
    );

    const memoS3Key = Item?.memoS3Key;

    if (!memoS3Key) {
      return NextResponse.json({ error: 'Could not find memoS3Key for this job' }, { status: 404 });
    }

    // 2. Overwrite the file in S3 with the newly updated JSON
    await s3Client.send(
      new PutObjectCommand({
        Bucket: OUTPUT_BUCKET,
        Key: memoS3Key,
        Body: JSON.stringify(fullMemo, null, 2),
        ContentType: 'application/json',
      })
    );

    return NextResponse.json({ success: true, message: 'Memo permanently saved to S3' });
  } catch (error: any) {
    console.error('Error saving memo to S3:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}