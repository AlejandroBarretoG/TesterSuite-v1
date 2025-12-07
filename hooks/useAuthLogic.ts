
import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  linkWithCredential, 
  EmailAuthProvider 
} from '../services/firebase';

/**
 * @ai-capability AUTH_HOOK
 * Reutiliza este hook para cualquier componente que necesite login/logout.
 */
export const useAuthLogic = (authInstance: any) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const clearState = () => {
    setStatus('idle');
    setMessage('');
    setErrorDetail(null);
  };

  const login = async (email, password) => {
    if (!authInstance) return;
    setStatus('loading');
    setMessage('');
    setErrorDetail(null);
    try {
      await signInWithEmailAndPassword(authInstance, email, password);
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      
      if (error.code === 'auth/wrong-password') {
        setMessage('Contraseña incorrecta.');
      } else if (error.code === 'auth/user-not-found') {
        setMessage('No existe cuenta registrada con este email.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('Email inválido.');
      } else if (error.code === 'auth/too-many-requests') {
        setMessage('Demasiados intentos fallidos. Intenta más tarde.');
      } else {
        setMessage(error.message || 'Error al iniciar sesión.');
      }
    }
  };

  const logout = async () => {
     if (!authInstance) return;
     try {
       await signOut(authInstance);
     } catch (e: any) {
       alert("Error al cerrar sesión: " + e.message);
     }
  };

  const resetPassword = async (email) => {
    if (!authInstance) return;
    setStatus('loading');
    setMessage('');
    try {
      await sendPasswordResetEmail(authInstance, email);
      setStatus('success');
      setMessage(`Correo de recuperación enviado a ${email}. Revisa tu bandeja de entrada.`);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || "Error al enviar correo.");
    }
  };

  const linkAccount = async (user, email, password, onConflict?: () => void) => {
     if (!authInstance || !user) return;
     setStatus('loading');
     setMessage('');
     setErrorDetail(null);

     try {
       const credential = EmailAuthProvider.credential(email, password);
       await linkWithCredential(user, credential);
       setStatus('success');
       setMessage('¡Cuenta vinculada exitosamente! Tu usuario anónimo ahora es permanente.');
       return true; 
     } catch (error: any) {
       setStatus('error');
       
       if (error.code === 'auth/credential-already-in-use') {
        setMessage('Esta cuenta de correo ya está asociada a otro usuario.');
        if (onConflict) onConflict();
      } else if (error.code === 'auth/operation-not-allowed') {
        setMessage('El proveedor Email/Password no está habilitado.');
        setErrorDetail('Ve a Firebase Console > Authentication > Sign-in method y habilita "Correo electrónico/contraseña".');
      } else if (error.code === 'auth/network-request-failed') {
        setMessage('Error de conexión con Firebase.');
        setErrorDetail('Verifica tu conexión a internet o configuración de red. Si ocurre consistentemente, puede ser un bloqueo de CORS o Firewall.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('La contraseña es demasiado débil. Usa al menos 6 caracteres.');
      } else {
        setMessage(error.message || 'Error al vincular cuenta.');
      }
      return false;
     }
  };

  return {
    status,
    message,
    errorDetail,
    clearState,
    login,
    logout,
    resetPassword,
    linkAccount
  };
};
