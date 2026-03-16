'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileDown, Loader2 } from 'lucide-react';
import { MemoPage1 } from './memo-page-1';
import { MemoPage2 } from './memo-page-2';
import { MemoPage3 } from './memo-page-3';
import { ChatSidebar } from './chat-sidebar';

interface MemoPaginationProps {
  memo: any;
  jobId: string;
  companyName: string;
}

interface ChatState {
  isOpen: boolean;
  sectionName: string;
  sectionKey: string; // dot-notation path into memoData, e.g. "categories.team_equity"
  sectionData: any;
}

const TOTAL_PAGES = 3;

// Set a nested value in an object using a dot-notation key path (max 2 levels)
function setAtPath(obj: any, path: string, value: any): any {
  const parts = path.split('.');
  if (parts.length === 1) {
    return { ...obj, [parts[0]]: value };
  }
  return {
    ...obj,
    [parts[0]]: { ...(obj[parts[0]] ?? {}), [parts[1]]: value },
  };
}

export function MemoPagination({ memo, jobId, companyName }: MemoPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Memo data is stateful so chat updates are reflected live
  const [memoData, setMemoData] = useState<any>(memo);

  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    sectionName: '',
    sectionKey: '',
    sectionData: null,
  });

  const currentPage = parseInt(searchParams.get('page') || '1');

  function updatePage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
  }

  function openChat(sectionName: string, sectionKey: string, sectionData: any) {
    setChatState({ isOpen: true, sectionName, sectionKey, sectionData });
  }

  // FIXED: Added 'async' here so 'await fetch' works correctly
  async function handleSectionUpdate(updatedData: any, _summary: string) {
    // 1. Compute the new full memo state locally
    const newMemoState = setAtPath(memoData, chatState.sectionKey, updatedData);
    
    // 2. Update the React UI instantly
    setMemoData(newMemoState);
    setChatState((prev) => ({ ...prev, sectionData: updatedData }));

    // 3. Fire a background request to permanently save it to S3!
    try {
      const response = await fetch('/api/save-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          fullMemo: newMemoState, // Pass the completely patched memo
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to database');
      }
      console.log('Successfully saved to database!');
    } catch (err) {
      console.error('Failed to save to database:', err);
    }
  }

  async function handleGeneratePdf() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/generate-memo-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memo: memoData, jobId, companyName }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error ?? 'PDF generation failed');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${companyName}_Investment_Memo.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('[handleGeneratePdf] Error:', err);
      }
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with pagination and download */}
        <div className="bg-white -mx-7 px-7 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Slide deck analysis</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updatePage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 min-w-20 text-center">
                  Page {currentPage} of {TOTAL_PAGES}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updatePage(Math.min(TOTAL_PAGES, currentPage + 1))}
                  disabled={currentPage === TOTAL_PAGES}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Download PDF button */}
              <Button
                size="sm"
                variant="outline"
                className="rounded-sm shrink-0"
                onClick={handleGeneratePdf}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 mr-1.5" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="animate-in fade-in duration-200">
          {currentPage === 1 && <MemoPage1 memo={memoData} onDiscuss={openChat} />}
          {currentPage === 2 && <MemoPage2 memo={memoData} onDiscuss={openChat} />}
          {currentPage === 3 && <MemoPage3 memo={memoData} onDiscuss={openChat} />}
        </div>

        {/* Bottom pagination */}
        <div className="flex items-center justify-between py-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" />
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {currentPage} of {TOTAL_PAGES}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(Math.min(TOTAL_PAGES, currentPage + 1))}
            disabled={currentPage === TOTAL_PAGES}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Chat sidebar — rendered outside the scroll container */}
      <ChatSidebar
        isOpen={chatState.isOpen}
        sectionName={chatState.sectionName}
        sectionData={chatState.sectionData}
        companyName={companyName}
        onClose={() => setChatState((prev) => ({ ...prev, isOpen: false }))}
        onSectionUpdate={handleSectionUpdate}
      />
    </>
  );
}