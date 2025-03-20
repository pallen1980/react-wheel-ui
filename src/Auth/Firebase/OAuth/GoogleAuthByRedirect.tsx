import { useEffect } from "react";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Config/Firebase";
import { Identity } from "../../Models";

interface GoogleAuthByRedirectCallbackProps {
    onSuccessfulSignIn: (user?: Identity, token?: string | undefined) => void;
    onSuccessfulSignOut: () => void;
    onFailedSignIn: (error: any) => void;
}

const GoogleAuthByRedirectCallback = (props: GoogleAuthByRedirectCallbackProps) => {
    useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
                if (authUser) {
                    const accessToken = await authUser.getIdToken(true);
                    
                    const user: Identity = {
                        id: authUser.uid,
                        name: authUser.displayName ?? "",
                        email: authUser.email ?? ""
                    };
    
                    props.onSuccessfulSignIn(user, accessToken);
                } else {
                    // User is signed out
                    props.onSuccessfulSignOut();
                }
            }, (error) => {
                props.onFailedSignIn(error);
            });
    
            // Clean up the listener when the component unmounts
            return () => unsubscribe();
         }, []);
         
    async function processRedirectResult() {
        try {
            const result = await getRedirectResult(auth);
            
            if (result) {
                // User signed in successfully
                const user: Identity = {
                    id: result.user?.uid,
                    name: result.user.displayName ?? "",
                    email: result.user.email ?? ""
                };
                const credential = GoogleAuthProvider.credentialFromResult(result);
                props.onSuccessfulSignIn(user, credential?.accessToken);
            }
        } catch (error) {
            props.onFailedSignIn(error);
        }
    }
    
    useEffect(() => {
        processRedirectResult();
    }, []);


    return null;
}

interface GoogleAuthByRedirectProps {
    onSigningIn: () => void;
    onFailedSignIn: (error: any) => void;
}

const GoogleAuthByRedirect = (props: GoogleAuthByRedirectProps) => {

    
    const handleGoogleSignIn: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault();

        try {
            props.onSigningIn();
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
        } catch (error) {
            props.onFailedSignIn(error);
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