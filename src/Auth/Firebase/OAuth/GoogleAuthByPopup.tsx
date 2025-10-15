import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../Config/Firebase";
import { Identity } from "../../Models";

interface GoogleAuthByPopupCallbackProps {
    onSuccessfulSignIn: (user?: Identity, token?: string | undefined) => void;
    onSuccessfulSignOut: () => void;
    onFailedSignIn: (error: Error) => void;
}

const GoogleAuthByPopupCallback = (props: GoogleAuthByPopupCallbackProps) => {
    // No need for onAuthStateChanged here - AuthProvider handles it
    return null;
}

interface GoogleAuthByPopupProps {
    onSigningIn: () => void;
    onFailedSignIn: (error: Error) => void;
}

const GoogleAuthByPopup = (props: GoogleAuthByPopupProps) => {

    const handleGoogleSignIn: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault();

        try {
            props.onSigningIn();
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
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

export default GoogleAuthByPopup;
export { GoogleAuthByPopupCallback };