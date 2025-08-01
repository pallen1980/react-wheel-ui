import { signOut } from "firebase/auth";
import { auth } from "./Config/Firebase";

interface FirebaseSignOutProps {
    onSigningOut: () => void;
    onError: (error: Error) => void;
}

const SignOutButton = (props: FirebaseSignOutProps) => {

    const handleSignOut: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault();

        try {
            props.onSigningOut();

            await signOut(auth);
            // The onAuthStateChanged listener will handle the user state update
        } catch (err) {
            props.onError(err instanceof Error ? err : new Error(String(err)));
        }
    };

    return <button onClick={handleSignOut}>Sign Out</button>;
}

export default SignOutButton;