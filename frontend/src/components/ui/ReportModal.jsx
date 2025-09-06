import { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter
} from './Modal';
import Button from './Button';
import { cn } from '../../lib/utils';

const REPORT_REASONS = [
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Contains offensive, inappropriate, or harmful content'
  },
  {
    value: 'copyright_violation',
    label: 'Copyright Violation',
    description: 'This content violates copyright or intellectual property rights'
  },
  {
    value: 'spam_duplicate',
    label: 'Spam or Duplicate',
    description: 'This is spam, duplicate content, or irrelevant material'
  },
  {
    value: 'incorrect_information',
    label: 'Incorrect Information',
    description: 'Contains misleading, incorrect, or outdated information'
  },
  {
    value: 'poor_quality',
    label: 'Poor Quality',
    description: 'Low quality scan, unreadable, or corrupted file'
  },
  {
    value: 'wrong_categorization',
    label: 'Wrong Categorization',
    description: 'Paper is categorized under wrong subject, university, or year'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above'
  }
];

const ReportModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting = false,
  paperTitle = 'this paper'
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) return;
    
    const selectedReasonData = REPORT_REASONS.find(r => r.value === selectedReason);
    onSubmit({
      reason: selectedReasonData.label,
      details: details.trim() || selectedReasonData.description
    });
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl">
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Report Paper
        </ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Help us maintain quality by reporting issues with "{paperTitle}". 
            Your report will be reviewed by our moderation team.
          </p>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Why are you reporting this paper? <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {REPORT_REASONS.map((reason) => (
                <div 
                  key={reason.value}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50",
                    selectedReason === reason.value 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200"
                  )}
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={() => setSelectedReason(reason.value)}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {reason.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {reason.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Additional Details (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional information that might help us understand the issue..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {details.length}/500 characters
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-yellow-800">
                False reports may result in account restrictions. Please only report content that genuinely violates our guidelines.
              </p>
            </div>
          </div>
        </div>
      </ModalContent>
      
      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedReason || isSubmitting}
          loading={isSubmitting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Submit Report
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ReportModal;
