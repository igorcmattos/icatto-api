import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Imobiliaria {
  id: string;
  nome: string;
  email: string;
  logoUrl?: string;
}

interface AuthState {
  token: string | null;
  imobiliaria: Imobiliaria | null;
  setAuth: (token: string, imobiliaria: Imobiliaria) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      imobiliaria: null,
      setAuth: (token, imobiliaria) => set({ token, imobiliaria }),
      logout: () => set({ token: null, imobiliaria: null }),
    }),
    { name: "icatto-auth" }
  )
);
