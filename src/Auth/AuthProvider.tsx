import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext<{
    isAuthenticated: boolean;
    onLogin: () => Promise<void>;
    onLogout: () => void;
} | null>(null);

type AuthProviderProps = {
    children: React.ReactNode;
};
  
export default ({ children }: AuthProviderProps) => {
    const [isAuthenticated, setAuthenticated] = useState(false);

    const handleLogin = useCallback(async () => {
        setAuthenticated(true);
    }, []);

    const handleLogout = useCallback(() => {
        setAuthenticated(false);
    }, []);

    const value = {
        isAuthenticated,
        onLogin: handleLogin,
        onLogout: handleLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { useAuth };