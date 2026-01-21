import React from 'react';

interface BackupCodesModalProps {
  codes: string[];
  onClose: () => void;
  onDownload: () => void;
}

const BackupCodesModal: React.FC<BackupCodesModalProps> = ({ codes, onClose, onDownload }) => {
  const handleDownloadClick = () => {
    onDownload(); // Trigger the download logic
    onClose(); // Close modal after download action
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-4">¡Tus Códigos de Recuperación!</h2>
        <p className="text-gray-700 mb-6">
          Guarda esta imagen de forma segura. Estos códigos son tu única forma de recuperar tu cuenta si olvidas tu contraseña o pierdes acceso a tu número de WhatsApp.
          <br /><br />
          <strong>¡Cada código es de un solo uso!</strong>
        </p>
        
        {/* Container for the codes that will be captured by html2canvas */}
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
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupCodesModal;
