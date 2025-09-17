import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, ExternalLink, RefreshCw } from 'lucide-react';
import Button from './Button';
import { Loading } from './Loading';
// CSS imports are in src/index.css

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Configure PDF.js to handle authentication
const configureHttpHeaders = () => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    // Set up global headers for PDF.js requests
    pdfjs.GlobalWorkerOptions.httpHeaders = {
      'Authorization': `Bearer ${accessToken}`,
    };
  }
};

const PDFViewer = ({ 
  fileUrl, 
  fileName, 
  onDownload,
  onExternalView,
  showDownloadButton = true 
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [useDirectUrl, setUseDirectUrl] = useState(true);
  const [useFastMode, setUseFastMode] = useState(false); // Quick fallback mode

  // Simplified blob-based PDF loading with timeout
  useEffect(() => {
    if (!fileUrl) return;

    let timeoutId;
    let abortController;
    
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingProgress(0);
        setUseFastMode(false);
        
        // Set a timeout to switch to fast mode if loading takes too long
        timeoutId = setTimeout(() => {
          console.log('PDF loading taking too long, switching to fast mode...');
          if (abortController) {
            abortController.abort();
          }
          setUseFastMode(true);
          setLoading(false);
        }, 5000); // 5 seconds timeout
        
        // Create abort controller for fetch cancellation
        abortController = new AbortController();
        
        console.log('Loading PDF from:', fileUrl);
        await fetchPdfBlob(abortController.signal);
        
        // Clear timeout on success
        clearTimeout(timeoutId);
        
      } catch (err) {
        clearTimeout(timeoutId);
        
        if (err.name === 'AbortError') {
          console.log('PDF fetch was aborted due to timeout');
          return; // Don't set error, fast mode is already active
        }
        
        console.error('PDF loading error:', err);
        setError(`Failed to load PDF: ${err.message}`);
        setLoading(false);
      }
    };

    const fetchPdfBlob = async (signal) => {
      const accessToken = localStorage.getItem('access_token');
      const headers = { 
        'Accept': 'application/pdf',
        'Content-Type': 'application/pdf'
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(fileUrl, {
        method: 'GET',
        headers,
        mode: 'cors',
        signal,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('PDF blob loaded successfully:', blob.size, 'bytes');
      setPdfFile(blob);
    };

    loadPDF();

    // Cleanup timeout and abort controller on unmount or dependency change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, [fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF loading error:', error);
    // If direct URL fails, try blob approach
    if (useDirectUrl) {
      console.log('Direct URL failed during PDF.js loading, trying blob approach...');
      setUseDirectUrl(false);
      return;
    }
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const retryLoading = useCallback(() => {
    setError(null);
    setUseDirectUrl(true); // Reset to try direct URL first
    // Trigger reload by updating a dependency
    setPdfFile(null);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            PDF Preview Error
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {error}. You can still download or open the file externally.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={retryLoading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {onExternalView && (
              <Button
                onClick={onExternalView}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open PDF
              </Button>
            )}
            {showDownloadButton && onDownload && (
              <Button
                onClick={onDownload}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fast mode display for slow PDFs
  if (useFastMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Quick Preview Mode
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            PDF preview is taking longer than expected.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Use the options below to view or download the file:
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                setUseFastMode(false);
                retryLoading();
              }}
              variant="outline"
              className="text-gray-600 border-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Preview Again
            </Button>
            {onExternalView && (
              <Button
                onClick={onExternalView}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open PDF
              </Button>
            )}
            {showDownloadButton && onDownload && (
              <Button
                onClick={onDownload}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[80px] text-center">
              {numPages ? `${pageNumber} / ${numPages}` : '--'}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1)}
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-8 px-2"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="h-8 px-2"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Rotate */}
          <Button
            variant="outline"
            size="sm"
            onClick={rotateClockwise}
            className="h-8 px-2"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onExternalView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExternalView}
              className="h-8 text-gray-600 hover:text-gray-900"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          
          {showDownloadButton && onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="h-8 text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-xs">
                <Loading />
                <p className="mt-4 text-sm text-gray-600">
                  Loading PDF...
                </p>
                {!useDirectUrl && loadingProgress > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{loadingProgress}%</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {pdfFile && !loading && !error && (
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null} // We handle loading state ourselves
              error={null}   // We handle error state ourselves
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                className="shadow-lg"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
