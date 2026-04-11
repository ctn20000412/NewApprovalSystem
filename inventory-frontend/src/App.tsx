import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Login from './pages/Login.tsx';
import OrderDetail from './pages/orders/OrderDetail.tsx';
import OrderForm from './pages/orders/OrderForm.tsx';
import OrderList from './pages/orders/OrderList.tsx';
import ProductDetail from './pages/products/ProductDetail.tsx';
import ProductForm from './pages/products/ProductForm.tsx';
import ProductList from './pages/products/ProductList.tsx';
import ReportsPage from './pages/Reports.tsx';
import RequestDetail from './pages/requests/RequestDetail.tsx';
import RequestForm from './pages/requests/RequestForm.tsx';
import RequestList from './pages/requests/RequestList.tsx';
import SalesReportPage from './pages/SalesReport.tsx';
import UsersPage from './pages/Users.tsx';
import WarehousePage from './pages/Warehouse.tsx';
import './index.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, isManager, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isManager()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={(
          <PrivateRoute>
            <Navigate to="/dashboard" replace />
          </PrivateRoute>
        )}
      />

      <Route
        path="/dashboard"
        element={(
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        )}
      />

      <Route
        path="/requests"
        element={(
          <PrivateRoute>
            <RequestList />
          </PrivateRoute>
        )}
      />
      <Route
        path="/requests/new"
        element={(
          <PrivateRoute>
            <RequestForm />
          </PrivateRoute>
        )}
      />
      <Route
        path="/requests/:id"
        element={(
          <PrivateRoute>
            <RequestDetail />
          </PrivateRoute>
        )}
      />
      <Route
        path="/requests/:id/edit"
        element={(
          <PrivateRoute>
            <RequestForm />
          </PrivateRoute>
        )}
      />

      <Route
        path="/orders"
        element={(
          <PrivateRoute>
            <OrderList />
          </PrivateRoute>
        )}
      />
      <Route
        path="/orders/new"
        element={(
          <PrivateRoute>
            <OrderForm />
          </PrivateRoute>
        )}
      />
      <Route
        path="/orders/:id"
        element={(
          <PrivateRoute>
            <OrderDetail />
          </PrivateRoute>
        )}
      />

      <Route
        path="/products"
        element={(
          <PrivateRoute>
            <ProductList />
          </PrivateRoute>
        )}
      />
      <Route
        path="/products/new"
        element={(
          <ManagerRoute>
            <ProductForm />
          </ManagerRoute>
        )}
      />
      <Route
        path="/products/:id"
        element={(
          <PrivateRoute>
            <ProductDetail />
          </PrivateRoute>
        )}
      />
      <Route
        path="/products/:id/edit"
        element={(
          <ManagerRoute>
            <ProductForm />
          </ManagerRoute>
        )}
      />

      <Route
        path="/warehouse"
        element={(
          <PrivateRoute>
            <WarehousePage />
          </PrivateRoute>
        )}
      />

      <Route
        path="/users"
        element={(
          <ManagerRoute>
            <UsersPage />
          </ManagerRoute>
        )}
      />

      <Route
        path="/reports"
        element={(
          <ManagerRoute>
            <ReportsPage />
          </ManagerRoute>
        )}
      />

      <Route
        path="/reports/sales"
        element={(
          <PrivateRoute>
            <SalesReportPage />
          </PrivateRoute>
        )}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
