import { create } from "zustand";
import api from "../api/client";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  branchId: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    set({ user: data.user });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null });
  },

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        set({ loading: false });
        return;
      }
      const { data } = await api.get("/auth/me");
      set({ user: data, loading: false });
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      set({ user: null, loading: false });
    }
  },
}));
