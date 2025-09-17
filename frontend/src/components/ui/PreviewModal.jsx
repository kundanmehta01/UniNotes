import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, AlertCircle, Eye } from 'lucide-react';
import { Modal } from './Modal';
import Button from './Button';
import { Loading } from './Loading';
import PDFViewer from './PDFViewer';
import useAuthStore from '../../stores/authStore';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const PreviewModal = ({ 
  isOpen, 
  onClose, 
  item,          // Legacy prop name
  file,          // New prop name
  itemType = 'paper', // 'paper' or 'note'
  onDownload = null,
  showDownloadButton = true,
  disableDownload = false,
  className 
}) => {
  // Support both prop names for backward compatibility
  const fileData = file || item;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuthStore();

  // Generate preview URL when modal opens
  useEffect(() => {
    if (isOpen && fileData?.id) {
      generatePreviewUrl();
    } else {
      // Clean up URL when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      // Reset retry count when modal closes
      setRetryCount(0);
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, fileData?.id]);

  const generatePreviewUrl = async () => {
    if (!fileData?.id) return;


    setIsLoading(true);
    setError(null);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // Use storage_key directly if available, otherwise use the ID-based endpoint
    let endpoint;
    if (fileData.storage_key) {
      endpoint = `${baseUrl}/storage/preview/${fileData.storage_key}`;
    } else {
      endpoint = `${baseUrl}/storage/preview/${itemType}/${fileData.id}`;
    }
    
    // For all authenticated users, add token to URL for browser access
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint = `${endpoint}${separator}token=${encodeURIComponent(accessToken)}`;
    }

    try {
      // For PDFs, we'll show the preview interface with buttons
      const fileExtension = fileData.original_filename?.split('.').pop()?.toLowerCase() || '';
      
      // Check if it's a PDF file
      const isPdf = fileExtension === 'pdf' || fileData.mime_type?.includes('pdf') || fileData.mime_type === 'application/pdf';
      
      if (isPdf) {
        // PDF files - provide download and external view options
        setIsSupported(true);
        setPreviewUrl(endpoint); // Store the endpoint for external viewing
        setIsLoading(false);
        return;
      }
      
      // For other file types, do the pre-fetch to check content type
      const headers = {};
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(endpoint, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You don\'t have permission to preview this file');
        } else if (response.status === 404) {
          throw new Error('File not found');
        } else {
          throw new Error('Failed to load preview');
        }
      }

      // Check content type for non-PDF files
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('image/')) {
        // Images can be previewed
        setIsSupported(true);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
        // Unsupported file types
        setIsSupported(false);
        setError(`Preview not available for ${fileExtension.toUpperCase()} files. You can download the file to view it.`);
      }
    } catch (err) {
      console.error('Preview error:', {
        error: err,
        message: err.message,
        endpoint,
        itemId: fileData?.id,
        itemType
      });
      
      // More specific error messages based on the error
      let errorMessage = 'Failed to load preview';
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      } else if (err.message.includes('File not found')) {
        errorMessage = 'File not found on server. The file may have been moved or deleted.';
      } else if (err.message.includes('permission')) {
        errorMessage = err.message;
      } else {
        errorMessage = err.message || 'Failed to load preview';
      }
      
      setError(errorMessage);
      setIsSupported(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (onDownload && typeof onDownload === 'function') {
      onDownload(fileData);
    } else {
      // Fallback download logic
      const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/download/${fileData.storage_key}`;
      window.open(downloadUrl, '_blank');
    }
  };
  
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      generatePreviewUrl();
    }
  };

  const handleExternalView = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  if (!isOpen || !fileData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={cn('max-w-6xl max-h-[90vh]', className)}
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-2xl">
              {getFileIcon(fileData.original_filename)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {fileData.title || fileData.original_filename}
              </h2>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>
                  {fileData.original_filename}
                </span>
                {fileData.file_size && (
                  <span>
                    {(fileData.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
                {fileData.university_name && (
                  <span>
                    {fileData.university_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {previewUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExternalView}
                className="text-gray-600 hover:text-gray-900"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            
            {showDownloadButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-blue-600 hover:text-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 min-h-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Loading />
                <p className="mt-4 text-sm text-gray-600">Loading preview...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-4">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview Unavailable
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {error}
                </p>
                <div className="flex gap-2 justify-center">
                  {error.includes('Cannot connect') && retryCount < 3 && (
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Try Again ({3 - retryCount} left)
                    </Button>
                  )}
                  {showDownloadButton && (
                    <Button
                      onClick={handleDownload}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && previewUrl && isSupported && (
            <div className="w-full h-full">
              {fileData.original_filename?.toLowerCase().endsWith('.pdf') || fileData.mime_type?.includes('pdf') ? (
                <PDFViewer
                  fileUrl={previewUrl}
                  fileName={fileData.original_filename}
                  onDownload={showDownloadButton ? handleDownload : null}
                  onExternalView={handleExternalView}
                  showDownloadButton={showDownloadButton}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <img
                    src={previewUrl}
                    alt={fileData.title || fileData.original_filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && !isSupported && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-4">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview Not Available
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This file type cannot be previewed in the browser. Download the file to view its contents.
                </p>
                {showDownloadButton && (
                  <Button
                    onClick={handleDownload}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with additional info */}
        {fileData && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                {fileData.subject_name && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {fileData.subject_name}
                  </span>
                )}
                {fileData.exam_year && (
                  <span>Year: {fileData.exam_year}</span>
                )}
                {fileData.semester_name && (
                  <span>Semester: {fileData.semester_name}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {fileData.uploader_name && (
                  <span>Uploaded by: {fileData.uploader_name}</span>
                )}
                {fileData.created_at && (
                  <span>
                    {new Date(fileData.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PreviewModal;
