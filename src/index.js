import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import FinanceDashboard from './FinanceDashboard';
// Si usas TailwindCSS, necesitarías importar el archivo CSS principal aquí, ej:
// import './index.css'; // Asumiendo que tienes un archivo index.css con las directivas de Tailwind

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FinanceDashboard />
  </React.StrictMode>
);
