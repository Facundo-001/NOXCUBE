import { useState, useEffect } from 'react';
import {
    auth,
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,  // ← NUEVO
    signOut,
    updateProfile,
    deleteUser
} from '../lib/firebase';
import { createUserProfile, getUserProfile, isDisplayNameTaken, updateUserProfile } from '../service/userService';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                if (!firebaseUser.isAnonymous) {
                    const profile = await getUserProfile(firebaseUser.uid);
                    setUserProfile(profile);
                } else {
                    setUserProfile(null);
                }
            } else {
                // ✅ Si estamos en login o register, NO crear anónimo
                const isAuthPage = window.location.pathname === '/login';

                if (!isAuthPage) {
                    try {
                        const result = await signInAnonymously(auth);
                        setUser(result.user);
                        setUserProfile(null);

                        const cleanupAnonymous = async () => {
                            if (result.user?.isAnonymous) {
                                try { await deleteUser(result.user); } catch (err) {}
                            }
                        };
                        window.addEventListener('beforeunload', cleanupAnonymous);
                        window.__cleanupAnonymous = cleanupAnonymous;
                    } catch (err) {
                        console.error('Error al crear usuario anónimo:', err);
                    }
                } else {
                    setUser(null);
                    setUserProfile(null);
                }
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (window.__cleanupAnonymous) {
                window.removeEventListener('beforeunload', window.__cleanupAnonymous);
                delete window.__cleanupAnonymous;
            }
        };
    }, []);

    const register = async (email, password, displayName, birthDate) => {
        try {
            setError(null);
            const nameTaken = await isDisplayNameTaken(displayName);
            if (nameTaken) throw new Error('El nombre de usuario ya está en uso');
            if (displayName.length > 20) throw new Error('El nombre no puede tener más de 20 caracteres');

            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName });
            await createUserProfile(result.user.uid, email, displayName, birthDate);

            return result.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // ==================== RESET PASSWORD ====================
    const resetPassword = async (email) => {
        try {
            setError(null);
            await sendPasswordResetEmail(auth, email, {
                url: window.location.origin + '/login',
                handleCodeInApp: false,
            });
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        try {
            setError(null);

            if (user?.isAnonymous) {
                try { await deleteUser(user); } catch (err) {}
            }

            await signOut(auth);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const refreshUserProfile = async () => {
        if (user && !user.isAnonymous) {
            try {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
                return profile;
            } catch (err) {
                return null;
            }
        }
        return null;
    };

    const updateProfileData = async (profileData) => {
        if (!user || user.isAnonymous) throw new Error('No hay usuario autenticado');

        try {
            setError(null);
            await updateUserProfile(user.uid, profileData);

            if (profileData.displayName && profileData.displayName !== user.displayName) {
                await updateProfile(user, { displayName: profileData.displayName });
            }

            await refreshUserProfile();
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        user,
        userProfile,
        loading,
        error,
        register,
        login,
        logout,
        resetPassword,  // ← NUEVO
        refreshUserProfile,
        updateProfileData
    };
}