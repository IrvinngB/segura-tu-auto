"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { User as DatabaseUser } from "@/lib/types/database";

interface AuthContextType {
    user: User | null;
    userProfile: DatabaseUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    clearAllCache: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<DatabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchUserProfile = async (
        userId: string
    ): Promise<DatabaseUser | null> => {
        try {
            // Consulta simple sin cache para evitar loops
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (error) {
                console.error("Error fetching user profile:", error);
                return null;
            }

            return data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    };

    const refreshUser = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const profile = await fetchUserProfile(user.id);
            setUserProfile(profile);
        } else {
            setUserProfile(null);
        }
    };

    const clearAllCache = () => {
        try {
            // Limpiar solo lo esencial
            localStorage.clear();
            sessionStorage.clear();
            console.log("✅ Cache limpiado completamente");
        } catch (error) {
            console.error("Error al limpiar cache:", error);
        }
    };

    const signOut = async () => {
        try {
            // Limpiar todo el cache
            clearAllCache();

            // Cerrar sesión en Supabase
            await supabase.auth.signOut();

            // Limpiar estado local
            setUser(null);
            setUserProfile(null);

            console.log("✅ Sesión cerrada y cache limpiado completamente");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            // Aún así limpiar el estado local
            setUser(null);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        const getInitialSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                setUser(session?.user ?? null);

                if (session?.user) {
                    const profile = await fetchUserProfile(session.user.id);
                    if (mounted) {
                        setUserProfile(profile);
                    }
                } else {
                    setUserProfile(null);
                }

                if (mounted) {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting initial session:", error);
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        getInitialSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            setUser(session?.user ?? null);

            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id);
                if (mounted) {
                    setUserProfile(profile);
                }
            } else {
                if (mounted) {
                    setUserProfile(null);
                }
            }

            if (mounted) {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // Sin dependencias adicionales

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                signOut,
                refreshUser,
                clearAllCache,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
