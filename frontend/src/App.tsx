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
import { GoodsReceiptsPage } from './pages/goods-receipts/GoodsReceiptsPage';
import { GoodsIssuesPage } from './pages/goods-issues/GoodsIssuesPage';
import { ModulePlaceholderPage } from './pages/placeholders/ModulePlaceholderPage';
import { UsersManagementPage } from './pages/users/UsersManagementPage';
import { BranchesConfigPage } from './pages/branches/BranchesConfigPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { StockTransfersPage } from './pages/stock-transfers/StockTransfersPage';
import { StocktakesPage } from './pages/stocktakes/StocktakesPage';
import { DistributedReportsPage } from './pages/reports/DistributedReportsPage';
import { ClusterTopologyPage } from './pages/cluster/ClusterTopologyPage';
import { ShardDistributionPage } from './pages/cluster/ShardDistributionPage';
import { QueryAnalyzerPage } from './pages/cluster/QueryAnalyzerPage';
import { DistributedTransactionsPage } from './pages/cluster/DistributedTransactionsPage';
import { ZoneShardingLabPage } from './pages/cluster/ZoneShardingLabPage';
import { HaSimulatorPage } from './pages/cluster/HaSimulatorPage';
import { AuditTtlExplorerPage } from './pages/cluster/AuditTtlExplorerPage';

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
            <Route path="/goods-receipts" element={<GoodsReceiptsPage />} />
            <Route path="/goods-issues" element={<GoodsIssuesPage />} />
            <Route path="/stock-transfers" element={<StockTransfersPage />} />
            <Route path="/stocktakes" element={<StocktakesPage />} />
            <Route path="/reports" element={<DistributedReportsPage />} />

            {/* Distributed Database Demo Suite */}
            <Route path="/cluster-topology" element={<ClusterTopologyPage />} />
            <Route path="/shard-distribution" element={<ShardDistributionPage />} />
            <Route path="/query-analyzer" element={<QueryAnalyzerPage />} />
            <Route path="/explain-plan" element={<QueryAnalyzerPage />} />
            <Route path="/distributed-transactions" element={<DistributedTransactionsPage />} />
            <Route path="/zone-sharding-lab" element={<ZoneShardingLabPage />} />
            <Route path="/ha-simulator" element={<HaSimulatorPage />} />
            <Route path="/audit-ttl-explorer" element={<AuditTtlExplorerPage />} />

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
