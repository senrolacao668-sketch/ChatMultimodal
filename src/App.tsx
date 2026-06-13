import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/contexts/AppContext';
import { routes } from './routes';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        {/* Layout raiz: ocupa toda a altura da janela sem overflow */}
        <div className="flex h-[100dvh] w-screen overflow-hidden">
          <Routes>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster />
      </Router>
    </AppProvider>
  );
};

export default App;
