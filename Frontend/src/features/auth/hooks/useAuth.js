import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout } from "../../../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context;

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            if (data?.user) {
                setUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: "Login failed" };
        } catch (err) {
            return { success: false, message: err.message || "Invalid email or password" };
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            if (data?.user) {
                setUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: "Registration failed" };
        } catch (err) {
            return { success: false, message: err.message || "Registration failed" };
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return { user, loading, handleLogin, handleRegister, handleLogout };
};