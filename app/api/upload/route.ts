import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_INPUT_BUCKET } from "@/lib/aws-clients";
import { randomUUID } from "crypto";

// POST /api/upload
// Body: { fileName: string, fileType: string }
// Returns: { jobId, uploadUrl, s3Key }
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const { fileName, fileType, fileSize } = await req.json();

  if (!fileName || !fileType) {
    return NextResponse.json(
      { error: "fileName and fileType are required" },
      { status: 400 }
    );
  }

  // Validate PDF only
  const isPdf =
    fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { error: "Only PDF files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds the 50 MB size limit" },
      { status: 400 }
    );
  }

  const jobId = randomUUID();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
  const s3Key = `${jobId}/${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: S3_INPUT_BUCKET,
    Key: s3Key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

  return NextResponse.json({ jobId, uploadUrl, s3Key });
}
