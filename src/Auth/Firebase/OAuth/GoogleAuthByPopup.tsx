import { useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Config/Firebase";
import { Identity } from "../../Models";

interface GoogleAuthByPopupCallbackProps {
    onSuccessfulSignIn: (user?: Identity, token?: string | undefined) => void;
    onSuccessfulSignOut: () => void;
    onFailedSignIn: (error: any) => void;
}

const GoogleAuthByPopupCallback = (props: GoogleAuthByPopupCallbackProps) => {
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

     return null;
}

interface GoogleAuthByPopupProps {
    onSigningIn: () => void;
    onFailedSignIn: (error: any) => void;
}

const GoogleAuthByPopup = (props: GoogleAuthByPopupProps) => {

    const handleGoogleSignIn: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault();

        try {
            props.onSigningIn();
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
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

export default GoogleAuthByPopup;
export { GoogleAuthByPopupCallback };