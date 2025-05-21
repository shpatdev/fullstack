// src/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import axios from "axios";

const userContext = createContext();

export const useAuth = () => useContext(userContext);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const access = localStorage.getItem("access");
        if (access) {
            setUser({ access }); 
        }
    }, []);

    const login = async (username, password) => {
        setError("");
        try {
            const { data } = await axios.post("http://localhost:8000/api/token/refresh/", { username, password });
            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);          
            setUser({ access: data.access });
            navigate("/restaurants");
        } catch (err) {
            if (err.response) { 
                setError("Kredencialet nuk janë të sakta.");
            } else {
                setError("S'po lidhemi dot me serverin.");
            }
            setTimeout(() => setError(""), 800);
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        navigate("/login");
    };
 
    const value = { user, login, logout, error };

    return (
        <userContext.Provider value={value}>
            {children}
        </userContext.Provider>
    );
}
