import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./hooks/useAuthStore.ts";
import LoginPage from "./pages/LoginPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import ImoveisPage from "./pages/ImoveisPage.tsx";
import PessoasPage from "./pages/PessoasPage.tsx";
import ContratosPage from "./pages/ContratosPage.tsx";
import NovoContratoPage from "./pages/NovoContratoPage.tsx";
import ContratoDetalhe from "./pages/ContratoDetalhe.tsx";
import AssinarPage from "./pages/AssinarPage.tsx";
import Layout from "./components/Layout.tsx";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/assinar/:token" element={<AssinarPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="imoveis" element={<ImoveisPage />} />
        <Route path="pessoas" element={<PessoasPage />} />
        <Route path="contratos" element={<ContratosPage />} />
        <Route path="contratos/novo" element={<NovoContratoPage />} />
        <Route path="contratos/:id" element={<ContratoDetalhe />} />
      </Route>
    </Routes>
  );
}
