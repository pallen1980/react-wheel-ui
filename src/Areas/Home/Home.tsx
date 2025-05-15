import { useAuth } from "../../Auth/AuthProvider";

function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <div>Homepage</div>
            {
                isAuthenticated && 
                <p>Welcome! You are logged in!</p>
            }
        </>
    )
}

export default Home;