import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AssistantIA from "./pages/AssistantIA";
import QuoteResult from "./pages/QuoteResult";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import ConditionsPage from "./pages/ConditionsPage";
import PrivacyPage from "./pages/PrivacyPage";
import { isAdminAuthenticated } from "./services/adminAuth";

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assistant" element={<AssistantIA />} />
        <Route path="/devis" element={<QuoteResult />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/conditions" element={<ConditionsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
