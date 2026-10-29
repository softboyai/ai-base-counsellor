import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api.js";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("baho_token");
    if (!token) { setLoading(false); return; }
    api.me()
      .then((u) => setUser(u))
      .catch(() => { localStorage.removeItem("baho_token"); })
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem("baho_token", token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("baho_token");
    setUser(null);
  }

  return { user, loading, login, logout };
}
