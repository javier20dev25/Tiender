// src/components/ReportModal.tsx
import React from 'react';

interface ReportModalProps {
  report: string;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Informe de IA</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
            aria-label="Cerrar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
                <div className="prose prose-sm sm:prose-base max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {report}
                  </pre>
                </div>      </div>
    </div>
  );
};

export default ReportModal;
