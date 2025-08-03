import { useContext } from "react";
import { createContext } from "react";
import { Identity } from "./Models";

interface AuthContextType {
    isAuthenticated: boolean;
    user: Identity | null;
    onLogin: (user: Identity) => void;
    onLogout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};