import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { startupName } = data;

    // ─── Read template ─────────────────────────────────────────────────────────
    const templatePath = path.join(process.cwd(), 'public', 'template.docx');
    const fileBuffer = fs.readFileSync(templatePath);
    const base64FileString = fileBuffer.toString('base64');

    // ─── Credentials ──────────────────────────────────────────────────────────
    const docgenBase         = process.env.FOXIT_DOCGEN_BASE_URL?.trim() ?? 'https://na1.fusion.foxit.com';
    const docgenClientId     = process.env.FOXIT_DOCGEN_CLIENT_ID?.trim();
    const docgenClientSecret = process.env.FOXIT_DOCGEN_CLIENT_SECRET?.trim();

    const pdfBase         = process.env.FOXIT_PDF_BASE_URL?.trim() ?? 'https://na1.fusion.foxit.com';
    const pdfClientId     = process.env.FOXIT_PDF_CLIENT_ID?.trim();
    const pdfClientSecret = process.env.FOXIT_PDF_CLIENT_SECRET?.trim();

    if (!docgenClientId || !docgenClientSecret) throw new Error('Missing FOXIT_DOCGEN credentials in .env.local');
    if (!pdfClientId || !pdfClientSecret)       throw new Error('Missing FOXIT_PDF credentials in .env.local');

    const pdfAuthHeaders = {
      client_id:     pdfClientId,
      client_secret: pdfClientSecret,
    };

    // ─── STEP 1: Document Generation → base64 PDF ─────────────────────────────
    const generateRes = await fetch(`${docgenBase}/document-generation/api/GenerateDocumentBase64`, {
      method: 'POST',
      headers: new Headers([
        ['client_id',     docgenClientId],
        ['client_secret', docgenClientSecret],
        ['Content-Type',  'application/json'],
      ]),
      body: JSON.stringify({
        outputFormat:   'pdf',
        base64FileString,
        documentValues: data,
      }),
    });

    if (!generateRes.ok) {
      const body = await generateRes.text();
      throw new Error(`Document generation failed (${generateRes.status}): ${body}`);
    }

    const generateJson = await generateRes.json();
    const generatedPdfBase64: string =
      generateJson.base64FileString ??
      generateJson.resultFileString ??
      generateJson.fileContent ??
      generateJson.content ??
      generateJson.data;

    if (!generatedPdfBase64) {
      throw new Error(`No PDF base64 in DocGen response. Keys: ${Object.keys(generateJson).join(', ')}`);
    }

    const generatedPdfBuffer = Buffer.from(generatedPdfBase64, 'base64');

    // ─── STEP 2: Upload PDF to PDF Services ───────────────────────────────────
    const uploadForm = new FormData();
    uploadForm.append('file', new Blob([generatedPdfBuffer], { type: 'application/pdf' }), `${startupName}_memo.pdf`);

    const uploadRes = await fetch(`${pdfBase}/pdf-services/api/documents/upload`, {
      method: 'POST',
      headers: pdfAuthHeaders,
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const body = await uploadRes.text();
      throw new Error(`PDF upload failed (${uploadRes.status}): ${body}`);
    }

    const uploadJson = await uploadRes.json();
    console.log('[generate-pdf] Upload response:', JSON.stringify(uploadJson));

    const documentId: string = uploadJson.documentId ?? uploadJson.document_id ?? uploadJson.fileId ?? uploadJson.id;
    if (!documentId) throw new Error(`No documentId in upload response. Keys: ${Object.keys(uploadJson).join(', ')}`);

    // ─── STEP 3: Password-protect ─────────────────────────────────────────────
    const protectRes = await fetch(`${pdfBase}/pdf-services/api/documents/security/pdf-protect`, {
      method: 'POST',
      headers: { ...pdfAuthHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        config: {
          userPassword:  startupName,
          ownerPassword: "lito.ai",
          permissions:   ['PRINT'],
        },
      }),
    });

    if (!protectRes.ok) {
      const body = await protectRes.text();
      throw new Error(`PDF protection failed (${protectRes.status}): ${body}`);
    }

    const protectJson = await protectRes.json();
    console.log('[generate-pdf] Protect response:', JSON.stringify(protectJson));

    const taskId: string = protectJson.taskId ?? protectJson.task_id ?? protectJson.id;
    if (!taskId) throw new Error(`No taskId in protect response. Keys: ${Object.keys(protectJson).join(', ')}`);

    // ─── STEP 4: Poll task until complete ─────────────────────────────────────
    let resultDocumentId: string | undefined;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1500));
      const statusRes = await fetch(`${pdfBase}/pdf-services/api/tasks/${taskId}`, {
        headers: pdfAuthHeaders,
      });
      const statusJson = await statusRes.json();
      console.log('[generate-pdf] Task status:', statusJson.status ?? statusJson.state ?? 'unknown');

      const state = (statusJson.status ?? statusJson.state ?? '').toLowerCase();
      if (state === 'success' || state === 'completed' || state === 'done') {
        resultDocumentId = statusJson.resultDocumentId ?? statusJson.documentId ?? statusJson.result?.documentId;
        break;
      }
      if (state === 'failed' || state === 'error') {
        throw new Error(`Protection task failed: ${JSON.stringify(statusJson)}`);
      }
    }

    if (!resultDocumentId) throw new Error('Timed out waiting for protection task to complete');

    // ─── STEP 5: Download protected PDF ───────────────────────────────────────
    const downloadRes = await fetch(`${pdfBase}/pdf-services/api/documents/${resultDocumentId}/download`, {
      headers: pdfAuthHeaders,
    });

    if (!downloadRes.ok) {
      const body = await downloadRes.text();
      throw new Error(`PDF download failed (${downloadRes.status}): ${body}`);
    }

    const finalPdf = Buffer.from(await downloadRes.arrayBuffer());

    // ─── STEP 6: Return to browser ────────────────────────────────────────────
    return new NextResponse(new Uint8Array(finalPdf), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${startupName}_Secure_Memo.pdf"`,
      },
    });

  } catch (err: unknown) {
    console.error('[/api/generate-pdf] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
