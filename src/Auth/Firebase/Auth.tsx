import  { useState, useEffect } from 'react';

import GoogleAuthByPopup, { GoogleAuthByPopupCallback } from './OAuth/GoogleAuthByPopup';
import GoogleAuthByRedirect, { GoogleAuthByRedirectCallback } from './OAuth/GoogleAuthByRedirect';

import SignOut from './SignOut';
import { Identity } from '../Models';
import { useAuth } from '../AuthProvider';

export enum AuthType {
    Popup = 0,
    Redirect = 1
}

interface AuthProps {
    type: AuthType;
}

const Auth = (props: AuthProps) => {
    const [user, setUser] = useState<Identity | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { onLogin, onLogout } = useAuth();
    
    const handleSigningIn = () => {
        setIsLoading(true);
    }

    const handleSuccessfulSignIn = (user?: Identity, token?: string | undefined) => {
        if (user) {
            setUser(user);
            onLogin();   
            setIsLoading(false);
        }
    }

    const handleSignInError = (error: Error) => {
        setIsLoading(false);
        console.error(error);
    }

    const handleSigningOut = () => {
        setIsLoading(true);
    }

    const handleSuccessfulSignOut = () => {
        onLogout();
        setUser(null);

        setIsLoading(false);
    }

    const handleSignOutError = (error: Error) => {
        setIsLoading(false);
        console.error(error);
    }

    return (
        <>
            {
                props.type == AuthType.Popup ? 
                    <GoogleAuthByPopupCallback 
                        onSuccessfulSignIn={handleSuccessfulSignIn} 
                        onSuccessfulSignOut={handleSuccessfulSignOut}
                        onFailedSignIn={handleSignInError}
                    />
                    : <GoogleAuthByRedirectCallback
                        onSuccessfulSignIn={handleSuccessfulSignIn}
                        onSuccessfulSignOut={handleSuccessfulSignOut}
                        onFailedSignIn={handleSignInError}
                    />
            }
            {
                isLoading ? <p>Loading...</p> :
                    user ? 
                        <div>
                            <p>Logged in as: {user.name || user.email}</p>
                            <SignOut 
                                onSigningOut={handleSigningOut}
                                onError={handleSignOutError}
                            />
                        </div>
                        : props.type == AuthType.Popup ?
                            <GoogleAuthByPopup 
                                onSigningIn={handleSigningIn}
                                onFailedSignIn={handleSignInError}
                            />
                            : <GoogleAuthByRedirect
                                onSigningIn={handleSigningIn}
                                onFailedSignIn={handleSignInError} 
                            />
            }
            
        </>
    )
}

export default Auth;