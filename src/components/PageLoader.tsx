import React from 'react';

const PageLoader: React.FC = () => (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
    </div>
);

export default PageLoader;
