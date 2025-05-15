import { createContext, useContext, useState } from "react";

const AuthContext = createContext<{
    isAuthenticated: boolean;
    onLogin: () => void;
    onLogout: () => void;
}>({
    isAuthenticated: false,
    onLogin: () => {},
    onLogout: () => {},
});

type AuthProviderProps = {
    children: React.ReactNode;
};
  
export default ({ children }: AuthProviderProps) => {
    const [isAuthenticated, setAuthenticated] = useState(false);

    const handleLogin = async () => {
        setAuthenticated(true);
    };

    const handleLogout = () => {
        setAuthenticated(false);
    };

    const value = {
        isAuthenticated,
        onLogin: handleLogin,
        onLogout: handleLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
    return useContext(AuthContext);
};

export { useAuth };