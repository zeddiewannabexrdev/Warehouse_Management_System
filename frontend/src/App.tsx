import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage';
import { MaterialsPage } from './pages/materials/MaterialsPage';
import { WarehouseMapPage } from './pages/warehouses/WarehouseMapPage';
import { ProcurementPage } from './pages/procurement/ProcurementPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ModulePlaceholderPage } from './pages/placeholders/ModulePlaceholderPage';
import { UsersManagementPage } from './pages/users/UsersManagementPage';
import { BranchesConfigPage } from './pages/branches/BranchesConfigPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { StockTransfersPage } from './pages/stock-transfers/StockTransfersPage';
import { StocktakesPage } from './pages/stocktakes/StocktakesPage';
import { DistributedReportsPage } from './pages/reports/DistributedReportsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Đang kiểm tra phiên làm việc..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardOverviewPage />} />

            {/* WMS Business Modules */}
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/warehouses" element={<WarehouseMapPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/suppliers" element={<ProcurementPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/goods-receipts" element={<ModulePlaceholderPage />} />
            <Route path="/goods-issues" element={<ModulePlaceholderPage />} />
            <Route path="/stock-transfers" element={<StockTransfersPage />} />
            <Route path="/stocktakes" element={<StocktakesPage />} />
            <Route path="/reports" element={<DistributedReportsPage />} />

            {/* Distributed Database Demo Suite */}
            <Route path="/cluster-topology" element={<ModulePlaceholderPage />} />
            <Route path="/shard-distribution" element={<ModulePlaceholderPage />} />
            <Route path="/query-analyzer" element={<ModulePlaceholderPage />} />
            <Route path="/explain-plan" element={<ModulePlaceholderPage />} />
            <Route path="/distributed-transactions" element={<ModulePlaceholderPage />} />
            <Route path="/zone-sharding-lab" element={<ModulePlaceholderPage />} />
            <Route path="/ha-simulator" element={<ModulePlaceholderPage />} />
            <Route path="/audit-ttl-explorer" element={<ModulePlaceholderPage />} />

            {/* Administration & Multi-Branch RBAC Foundation */}
            <Route path="/users" element={<UsersManagementPage />} />
            <Route path="/branches" element={<BranchesConfigPage />} />
            <Route path="/settings" element={<ModulePlaceholderPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
