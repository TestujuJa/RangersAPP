import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    loadingTask.promise.then(pdf => {
      setNumPages(pdf.numPages);
      pdf.getPage(pageNumber).then(page => {
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (canvas && context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          page.render(renderContext);
        }
      });
    });
  }, [pdfUrl, pageNumber]);

  const goToPrevPage = () => setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  const goToNextPage = () => setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));

  return (
    <div>
      <div className="flex justify-center items-center mb-4">
        <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="bg-gray-300 px-4 py-2 rounded mr-2">Předchozí</button>
        <span>Strana {pageNumber} z {numPages}</span>
        <button onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)} className="bg-gray-300 px-4 py-2 rounded ml-2">Další</button>
      </div>
      <canvas ref={canvasRef} className="border shadow-lg" />
    </div>
  );
};

export default PdfViewer;
