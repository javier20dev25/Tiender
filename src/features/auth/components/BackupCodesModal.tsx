// src/features/auth/components/BackupCodesModal.tsx
import React from 'react';

interface BackupCodesModalProps {
  codes: string[] | null;
  isLoading: boolean;
  onClose: () => void;
  onDownload: () => void;
  onConfirm: () => void;
}

const BackupCodesModal: React.FC<BackupCodesModalProps> = ({ codes, isLoading, onClose, onDownload, onConfirm }) => {
  const handleDownloadClick = () => {
    onDownload();
  };

  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
        {isLoading ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Generando Códigos...</h2>
            <p className="text-gray-700 mb-6">
              Estamos creando tus códigos de recuperación únicos. Por favor, espera un momento.
            </p>
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          </>
        ) : codes ? (
          <>
            <h2 className="text-2xl font-bold mb-4">¡Tus Códigos de Recuperación!</h2>
            <p className="text-gray-700 mb-6">
              Guarda esta imagen de forma segura. Estos códigos son tu única forma de recuperar tu cuenta.
              <br /><br />
              <strong>¡Cada código es de un solo uso!</strong>
            </p>
            
            <div id="recovery-codes-content" className="bg-gray-100 p-6 rounded-lg mb-6 border-2 border-dashed border-gray-400 text-left">
              <h3 className="text-lg font-semibold mb-3">Tus Códigos Únicos:</h3>
              <ul className="list-disc list-inside text-gray-800 space-y-1">
                {codes.map((code, index) => (
                  <li key={index} className="font-mono text-lg tracking-wider">{code}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleDownloadClick}
                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
              >
                Descargar Imagen con Códigos
              </button>
              <button
                onClick={handleConfirmClick}
                className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition duration-300"
              >
                He Guardado mis Códigos
              </button>
            </div>
          </>
        ) : (
            <>
                <h2 className="text-2xl font-bold mb-4">Error</h2>
                <p className="text-gray-700 mb-6">
                    No se pudieron generar los códigos de recuperación. Por favor, intenta de nuevo.
                </p>
                <button
                    onClick={onClose}
                    className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition duration-300"
                >
                    Cerrar
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default BackupCodesModal;
