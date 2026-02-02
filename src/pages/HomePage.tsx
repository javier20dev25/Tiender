import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanCard } from '../components/PlanCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlanSelection = () => {
    // On the homepage, selecting a plan takes the user to the registration/upgrade flow
    navigate('/upgrade');
  };

  const standardFeatures = [
    "Hasta 30 productos",
    "Analíticas básicas de visitas",
    "Integración con WhatsApp",
  ];

  const fullFeatures = [
    "Hasta 60 productos",
    "Analíticas y reportes de IA",
    "Integración con WhatsApp",
    "Chat con IA (Próximamente)",
    "Sin branding 'Crea tu tienda...'",
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center py-20 px-4">
          <h1 className="text-6xl font-extrabold mb-4">Crea tu Tienda Online en Minutos</h1>
          <p className="text-xl text-gray-300 mb-8">Vende por redes sociales de forma profesional con tu propio catálogo interactivo.</p>
          <button 
            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
          >
            Ver Planes
          </button>
        </div>
      </div>

      {/* Plans Section */}
      <div id="plans" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <header className="text-center mb-12">
            <h2 className="text-5xl font-extrabold text-gray-900 mb-2">Elige tu Plan</h2>
            <p className="text-lg text-gray-600">Todos los planes comienzan con una prueba gratuita de 7 días.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PlanCard 
              planName="Standard"
              price="$10"
              features={standardFeatures}
              onSelect={handlePlanSelection}
              loading={false}
              buttonText="Elegir Plan Standard"
            />
            <PlanCard 
              planName="Full"
              price="$25"
              features={fullFeatures}
              onSelect={handlePlanSelection}
              loading={false}
              isFeatured={true}
              buttonText="Elegir Plan Full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
