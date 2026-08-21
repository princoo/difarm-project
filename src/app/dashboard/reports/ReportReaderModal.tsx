import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import { downloadBlob } from './reportBrand';

export type ReportReaderFormat = 'word' | 'pdf';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  loading?: boolean;
  wordHtml?: string | null;
  pdfUrl?: string | null;
  wordFilename?: string;
  pdfFilename?: string;
  pdfBlob?: Blob | null;
  wordBlob?: Blob | null;
  initialFormat?: ReportReaderFormat;
};

export default function ReportReaderModal({
  open,
  onClose,
  title,
  subtitle,
  loading,
  wordHtml,
  pdfUrl,
  wordFilename = 'report.doc',
  pdfFilename = 'report.pdf',
  pdfBlob,
  wordBlob,
  initialFormat = 'word',
}: Props) {
  const [format, setFormat] = useState<ReportReaderFormat>(initialFormat);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (open) {
      setFormat(initialFormat);
      setZoom(100);
    }
  }, [open, initialFormat]);

  const handleDownload = () => {
    if (format === 'pdf' && pdfBlob) {
      downloadBlob(pdfFilename, pdfBlob);
      return;
    }
    if (format === 'word' && wordBlob) {
      downloadBlob(wordFilename, wordBlob);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="absolute inset-0 flex flex-col bg-[#f0f2f5] dark:bg-gray-950">
              {/* Google Docs–style top bar */}
              <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                <div className="flex items-center gap-3 px-3 sm:px-4 h-14">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <Dialog.Title className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {title}
                      </Dialog.Title>
                      {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
                    <button
                      type="button"
                      onClick={() => setFormat('word')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        format === 'word'
                          ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Word
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('pdf')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        format === 'pdf'
                          ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      PDF
                    </button>
                  </div>

                  <div className="hidden md:flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setZoom((z) => Math.max(70, z - 10))}
                      title="Zoom out"
                    >
                      <MagnifyingGlassMinusIcon className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setZoom((z) => Math.min(150, z + 10))}
                      title="Zoom in"
                    >
                      <MagnifyingGlassPlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={loading || (format === 'pdf' ? !pdfBlob : !wordBlob)}
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile format toggle */}
                <div className="sm:hidden flex border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setFormat('word')}
                    className={`flex-1 py-2 text-xs font-medium ${
                      format === 'word' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
                    }`}
                  >
                    Word
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('pdf')}
                    className={`flex-1 py-2 text-xs font-medium ${
                      format === 'pdf' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
                    }`}
                  >
                    PDF
                  </button>
                </div>
              </header>

              {/* Document canvas */}
              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    Preparing report…
                  </div>
                ) : format === 'pdf' ? (
                  pdfUrl ? (
                    <div className="h-full w-full p-2 sm:p-4">
                      <iframe
                        title={title}
                        src={pdfUrl}
                        className="h-full w-full min-h-[70vh] rounded-lg border border-gray-200 bg-white shadow"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      PDF preview unavailable
                    </div>
                  )
                ) : (
                  <div className="flex justify-center py-6 px-3 sm:px-6">
                    <div
                      className="bg-white shadow-lg border border-gray-200 origin-top"
                      style={{
                        width: 'min(816px, 100%)',
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                      }}
                    >
                      {wordHtml ? (
                        <iframe
                          title={title}
                          srcDoc={wordHtml}
                          className="w-full border-0"
                          style={{ height: '1100px', minHeight: '80vh' }}
                        />
                      ) : (
                        <div className="p-10 text-sm text-gray-500">Word preview unavailable</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
