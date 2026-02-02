import React from 'react';

// --- Helper Components ---
const CheckIcon = () => (
  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

export interface PlanCardProps {
  planName: string;
  price: string;
  features: string[];
  onSelect: () => void;
  loading: boolean;
  isFeatured?: boolean;
  buttonText?: string; // Optional: To customize button text, e.g., "Elegir Plan"
}

export const PlanCard: React.FC<PlanCardProps> = ({ planName, price, features, onSelect, loading, isFeatured, buttonText = 'Iniciar Prueba de 7 Días' }) => {
  const buttonBaseClasses = "w-full text-white font-bold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50";
  const buttonFeaturedClasses = "bg-blue-600 hover:bg-blue-700";
  const buttonStandardClasses = "bg-gray-700 hover:bg-gray-800";
  const ringClasses = isFeatured ? "ring-2 ring-blue-500 ring-offset-2" : "";

  return (
    <div className={`bg-white p-8 rounded-xl shadow-lg flex flex-col ${ringClasses}`}>
      <h3 className="text-3xl font-bold text-center mb-2">{planName}</h3>
      <p className="text-4xl font-extrabold text-center mb-6">{price}<span className="text-lg font-medium text-gray-500">/mes</span></p>
      
      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={loading}
        className={`${buttonBaseClasses} ${isFeatured ? buttonFeaturedClasses : buttonStandardClasses}`}
      >
        {loading ? 'Procesando...' : buttonText}
      </button>
    </div>
  );
};
