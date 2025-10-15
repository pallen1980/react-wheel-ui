import { useEffect, useCallback } from "react";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth } from "../Config/Firebase";
import { Identity } from "../../Models";

interface GoogleAuthByRedirectCallbackProps {
    onSuccessfulSignIn: (user?: Identity, token?: string | undefined) => void;
    onSuccessfulSignOut: () => void;
    onFailedSignIn: (error: Error) => void;
}

const GoogleAuthByRedirectCallback = (props: GoogleAuthByRedirectCallbackProps) => {
    const processRedirectResult = useCallback(async () => {
        try {
            const result = await getRedirectResult(auth);

            if (result) {
                // User signed in successfully - AuthProvider will handle the auth state change
                // No need to call onSuccessfulSignIn here
            }
        } catch (error) {
            props.onFailedSignIn(error as Error);
        }
    }, [props]);

    useEffect(() => {
        processRedirectResult();
    }, [processRedirectResult]);

    return null;
}

interface GoogleAuthByRedirectProps {
    onSigningIn: () => void;
    onFailedSignIn: (error: Error) => void;
}

const GoogleAuthByRedirect = (props: GoogleAuthByRedirectProps) => {


    const handleGoogleSignIn: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault();

        try {
            props.onSigningIn();
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
        } catch (error) {
            props.onFailedSignIn(error instanceof Error ? error : new Error(String(error)));
        }
    };

    return (
        <>
            <button onClick={handleGoogleSignIn}>Sign in with Google</button>
        </>
    )
}

export default GoogleAuthByRedirect;
export { GoogleAuthByRedirectCallback };