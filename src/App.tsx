import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Layout />
      </div>
    </AuthProvider>
  );
}

export default App;