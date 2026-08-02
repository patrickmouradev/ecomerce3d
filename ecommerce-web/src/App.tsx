import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Filaments from './pages/admin/Filaments';
import Params from './pages/admin/Params';
import BasicProductionCosts from './pages/admin/BasicProductionCosts';
import Products from './pages/admin/Products';
import Dashboard from './pages/admin/Dashboard';
import AdminGuard from './components/AdminGuard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Rota Pública do Catálogo */}
              <Route path="/" element={<Catalog />} />
              <Route path="/login" element={<Login />} />

              {/* Rotas Administrativas Protegidas */}
              <Route 
                path="/admin/filaments" 
                element={
                  <AdminGuard>
                    <Filaments />
                  </AdminGuard>
                } 
              />
              <Route 
                path="/admin/parameters" 
                element={
                  <AdminGuard>
                    <Params />
                  </AdminGuard>
                } 
              />
              <Route 
                path="/admin/basic-costs" 
                element={
                  <AdminGuard>
                    <BasicProductionCosts />
                  </AdminGuard>
                } 
              />
              <Route 
                path="/admin/products" 
                element={
                  <AdminGuard>
                    <Products />
                  </AdminGuard>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminGuard>
                    <Dashboard />
                  </AdminGuard>
                } 
              />

              {/* Redirecionamento para Home caso rota não encontrada */}
              <Route path="*" element={<Catalog />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
