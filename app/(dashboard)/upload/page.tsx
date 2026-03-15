'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteSessions } from '@/lib/actions/sessions';

type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface UploadFile {
  id: string;
  file: File;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  jobId?: string;
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m4.1 9.4c-.02.04-.29 1.76-2.1 4.69c0 0-3.5 1.82-2.67 3.18c.67 1.08 2.32-.04 3.74-2.68c0 0 1.82-.64 4.24-.82c0 0 3.86 1.73 4.39-.11c.52-1.86-3.06-1.44-3.7-1.25c0 0-2-1.35-2.5-3.21c0 0 1.14-3.95-.61-3.9c-1.75.05-1.09 3.13-.79 4.1m.81 1.04c.03.01.47 1.21 1.89 2.46c0 0-2.33.46-3.39.9c0 0 1-1.73 1.5-3.36m3.93 2.72c.58-.16 2.33.15 2.26.48c-.06.33-2.26-.48-2.26-.48M7.77 17c-.53 1.24-1.44 2-1.67 2c-.23 0 .7-1.6 1.67-2m3.14-6.93c0-.07-.36-2.2 0-2.15c.54.08 0 2.08 0 2.15z" />
    </svg>
  );
}

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addAndUpload(e.dataTransfer.files);
  }

  function addAndUpload(fileList: FileList) {
    const newFiles: UploadFile[] = Array.from(fileList)
      .filter((file) => file.type === 'application/pdf' || file.name.endsWith('.pdf'))
      .map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: 'pending' as FileUploadStatus,
        progress: 0,
      }));
    if (newFiles.length === 0) return;
    setFiles((prev) => [...prev, ...newFiles]);
    void Promise.all(newFiles.map((f) => uploadSingleFile(f)));
  }

  async function removeFile(id: string) {
    const file = files.find((f) => f.id === id);
    if (file?.jobId) {
      await deleteSessions([file.jobId]);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function uploadSingleFile(uploadFile: UploadFile) {
    const { file, id } = uploadFile;
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString() ?? '';

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'uploading' as FileUploadStatus, progress: 10 } : f))
      );

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/pdf', fileSize: file.size }),
      });

      if (!uploadRes.ok) throw new Error('Failed to get upload URL');
      const { jobId, uploadUrl, s3Key } = await uploadRes.json();

      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 40 } : f)));

      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/pdf' },
        body: file,
      });

      if (!s3Res.ok) throw new Error('Failed to upload file to S3');

      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 70 } : f)));

      const jobRes = await fetch('/api/start-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ jobId, s3Key }),
      });

      if (!jobRes.ok) throw new Error('Failed to start pipeline');

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'success' as FileUploadStatus, progress: 100, jobId } : f
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'error' as FileUploadStatus, error: message } : f
        )
      );
    }
  }

  function handleGenerateReports() {
    const successfulJobIds = files
      .filter((f) => f.status === 'success' && f.jobId)
      .map((f) => f.jobId!);
    if (successfulJobIds.length > 0) {
      router.push(`/processing?jobIds=${successfulJobIds.join(',')}`);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  const hasFiles = files.length > 0;
  const isUploading = files.some((f) => f.status === 'uploading');
  const hasPending = files.some((f) => f.status === 'pending');
  const allUploaded =
    hasFiles && !hasPending && !isUploading && files.every((f) => f.status === 'success');

  return (
    <div className="bg-background-gray -mx-7 -mb-7 -mt-6 p-4 min-h-full">
      <div className="w-full">

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900">Upload Documents</h1>
            <p className="text-sm text-slate-500 mt-1">
              Upload pitch decks or company documents to generate AI-powered reports.
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-20 transition-colors cursor-pointer ${
              isDragging
                ? 'bg-bg-after-upload border-stripe-after-upload'
                : 'bg-upload-gray border-slate-200'
            }`}
          >
            <div className={`rounded-full p-3 border-2 transition-colors ${
              isDragging ? 'bg-bg-after-upload border-stripe-after-upload' : 'bg-slate-100 border-slate-200'
            }`}>
              <Upload className={`h-5 w-5 transition-colors ${isDragging ? 'text-stripe-after-upload' : 'text-slate-500'}`} />
            </div>
            <p className="text-sm font-medium text-slate-700">Drag and drop files here to upload</p>
            <p className="text-xs text-slate-400">
              or{' '}
              <span className="text-blue-600 underline underline-offset-2">browse from your computer</span>
            </p>
            <p className="text-xs text-slate-400">PDF files only · Max 50MB per file</p>
            <Input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf"
              multiple
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => e.target.files && addAndUpload(e.target.files)}
            />
          </div>

          {/* Guidance Note */}
          <div className="mt-3 px-4 py-3 border rounded-lg">
            <p className="text-xs text-gray-bg">
              <span className="font-semibold">Note:</span> Each PDF will be analyzed as a separate company.
              If you have multiple documents for one company, please combine them into a single PDF first.
              You can navigate away from the processing page anytime — your analyses will continue running in the background.
            </p>
          </div>

          {/* File List */}
          {hasFiles && (
            <div className="mt-4 space-y-2">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                  <div className="flex items-start gap-3">
                    {/* PDF Icon */}
                    <div className="shrink-0 mt-0.5">
                      <PdfIcon className="h-6 w-6 text-slate-700" />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: filename + remove button */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-black truncate">{uploadFile.file.name}</p>
                        {uploadFile.status !== 'uploading' && (
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="shrink-0 p-1 hover:bg-slate-100 rounded transition-colors"
                          >
                            <X className="h-4 w-4 text-slate-400" />
                          </button>
                        )}
                      </div>

                      {/* Row 2: progress bar (uploading only) */}
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-1.5 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Row 3: size + status */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-slate-500">{formatFileSize(uploadFile.file.size)}</span>

                        {uploadFile.status === 'uploading' && (
                          <span className="text-xs text-slate-500">({uploadFile.progress}% done)</span>
                        )}

                        {uploadFile.status === 'success' && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">File successfully uploaded</span>
                          </>
                        )}

                        {uploadFile.status === 'error' && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <X className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500 font-medium">File failed to upload</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generate Report Button — shown only once files are added */}
          {hasFiles && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleGenerateReports} disabled={!allUploaded}>
                Generate Report{files.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
