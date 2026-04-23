import { useState, useEffect } from 'react';
import {
    auth,
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser  // ← IMPORTANTE: Añadir esta importación
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
                // Solo cargar perfil si NO es anónimo
                if (!firebaseUser.isAnonymous) {
                    const profile = await getUserProfile(firebaseUser.uid);
                    setUserProfile(profile);
                } else {
                    setUserProfile(null);
                }
            } else {
                try {
                    const result = await signInAnonymously(auth);
                    setUser(result.user);
                    setUserProfile(null);
                    
                    // ✅ PROGRAMAR LIMPIEZA DEL ANÓNIMO AL CERRAR LA PÁGINA
                    const cleanupAnonymous = async () => {
                        if (result.user && result.user.isAnonymous) {
                            try {
                                await deleteUser(result.user);
                                console.log('🧹 Usuario anónimo eliminado al cerrar la página');
                            } catch (err) {
                                console.warn('No se pudo eliminar usuario anónimo:', err);
                            }
                        }
                    };
                    
                    window.addEventListener('beforeunload', cleanupAnonymous);
                    
                    // Guardar referencia para limpiar el listener
                    window.__cleanupAnonymous = cleanupAnonymous;
                    
                } catch (err) {
                    console.error('Error al crear usuario anónimo:', err);
                    setError(err.message);
                }
            }
            setLoading(false);
        });

        // Limpiar al desmontar
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

    const logout = async () => {
        try {
            setError(null);
            
            // ✅ Si el usuario actual es anónimo, eliminarlo en vez de solo cerrar sesión
            if (user?.isAnonymous) {
                try {
                    await deleteUser(user);
                    console.log('🧹 Usuario anónimo eliminado al hacer logout');
                } catch (err) {
                    console.warn('Error al eliminar usuario anónimo:', err);
                }
            }
            
            await signOut(auth);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // ✅ Función para refrescar perfil de usuario
    const refreshUserProfile = async () => {
        if (user && !user.isAnonymous) {
            try {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
                return profile;
            } catch (err) {
                console.error('Error al refrescar perfil:', err);
                return null;
            }
        }
        return null;
    };

    // ✅ Función para actualizar perfil (nombre, bio, avatarColor)
    const updateProfileData = async (profileData) => {
        if (!user || user.isAnonymous) {
            throw new Error('No hay usuario autenticado');
        }

        try {
            setError(null);
            
            // Actualizar en Firestore
            await updateUserProfile(user.uid, profileData);
            
            // Si cambió el nombre, actualizar en Firebase Auth
            if (profileData.displayName && profileData.displayName !== user.displayName) {
                await updateProfile(user, { displayName: profileData.displayName });
            }
            
            // Refrescar el perfil local
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
        refreshUserProfile,
        updateProfileData
    };
}