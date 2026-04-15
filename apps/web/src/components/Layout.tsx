import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../hooks/useAuthStore.ts";

export default function Layout() {
  const { imobiliaria, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Icatto</h1>
          <p className="text-xs text-gray-500 truncate mt-1">{imobiliaria?.nome}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { to: "/", label: "Dashboard", icon: "⊞" },
            { to: "/imoveis", label: "Imóveis", icon: "🏠" },
            { to: "/pessoas", label: "Pessoas", icon: "👥" },
            { to: "/contratos", label: "Contratos", icon: "📄" },
          ].map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-500 hover:text-red-500 text-left px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
