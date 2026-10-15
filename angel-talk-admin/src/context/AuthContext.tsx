import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  pinToken: string | null;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ mfaRequired?: boolean }>;
  logout: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearPin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pinToken, setPinToken] = useState<string | null>(sessionStorage.getItem("angeltalk_pin_token"));

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("angeltalk_access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const userData = response.data?.data?.user;
        if (userData && (userData.role === "admin" || userData.role === "superadmin")) {
          setUser(userData);
        } else {
          // Non-admin users are strictly denied from the admin panel
          localStorage.removeItem("angeltalk_access_token");
          localStorage.removeItem("angeltalk_refresh_token");
          sessionStorage.removeItem("angeltalk_pin_token");
          setUser(null);
        }
      } catch {
        localStorage.removeItem("angeltalk_access_token");
        localStorage.removeItem("angeltalk_refresh_token");
        sessionStorage.removeItem("angeltalk_pin_token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string, mfaCode?: string) => {
    const response = await api.post("/auth/login", {
      email,
      password,
      mfaCode,
    });

    if (response.data?.data?.mfaRequired) {
      return { mfaRequired: true };
    }

    const { user: userData, accessToken, refreshToken } = response.data.data;

    if (userData.role !== "admin" && userData.role !== "superadmin") {
      throw new Error("Access restricted: Administrative role required.");
    }

    localStorage.setItem("angeltalk_access_token", accessToken);
    localStorage.setItem("angeltalk_refresh_token", refreshToken);
    setUser(userData);
    return { mfaRequired: false };
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("angeltalk_refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("angeltalk_access_token");
      localStorage.removeItem("angeltalk_refresh_token");
      sessionStorage.removeItem("angeltalk_pin_token");
      setUser(null);
      setPinToken(null);
      window.location.href = "/login";
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const response = await api.post("/auth/verify-pin", { pin });
      const token = response.data?.data?.pinToken;
      if (token) {
        sessionStorage.setItem("angeltalk_pin_token", token);
        setPinToken(token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const clearPin = () => {
    sessionStorage.removeItem("angeltalk_pin_token");
    setPinToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        pinToken,
        login,
        logout,
        verifyPin,
        clearPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

