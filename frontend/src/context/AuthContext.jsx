import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Create the authentication context
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get active session on mount
        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting session:", error);
            }
            setSession(session);
            setUser(session?.user || null);
            setLoading(false);
        };

        getSession();

        // Listen for internal state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user || null);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
    }, []);

    // Helper to check if the user is the admin based on env variable
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const isAdmin = user && user.email === adminEmail;

    // Removed debugging console log to prevent console spam

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
