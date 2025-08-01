import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./Firebase/Config/Firebase";
import { Identity } from "./Models";

interface AuthContextType {
    isAuthenticated: boolean;
    user: Identity | null;
    onLogin: (user: Identity) => void;
    onLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
    children: React.ReactNode;
};
  
const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isAuthenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState<Identity | null>(null);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
            if (firebaseUser) {
                const userIdentity: Identity = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || undefined,
                    email: firebaseUser.email || undefined,
                };
                setUser(userIdentity);
                setAuthenticated(true);
            } else {
                setUser(null);
                setAuthenticated(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogin = useCallback((userIdentity: Identity) => {
        setUser(userIdentity);
        setAuthenticated(true);
    }, []);

    const handleLogout = useCallback(() => {
        setUser(null);
        setAuthenticated(false);
    }, []);

    const value = {
        isAuthenticated,
        user,
        onLogin: handleLogin,
        onLogout: handleLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { useAuth };