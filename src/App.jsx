import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";

import AppLayout from "./layouts/AppLayout";

import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/auth/LoginPage";
import HomePageSheet from "./pages/HomePageSheet";
import ReportPageSheet from "./pages/ReportPageSheet";

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route element={<ProtectedLayout />}>
        <Route
          index
          element={<HomePage />}
        />

        <Route
          path="/dashboard"
          element={
            <Navigate
              to="/reports"
              replace
            />
          }
        />

        <Route
          path="/reports"
          element={<ReportsPage />}
        />

        <Route
          path="/sheet-home"
          element={<HomePageSheet />}
        />

        <Route
          path="/sheet-reports"
          element={<ReportPageSheet />}
        />

        <Route
          path="/settings"
          element={
            <RoleRoute
              allowedRoles={[
                "owner",
                "admin",
              ]}
            >
              <SettingsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <RoleRoute
              allowedRoles={[
                "owner",
                "admin",
              ]}
            >
              <div className="angel-card p-6">
                Admin module will be added here.
              </div>
            </RoleRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}