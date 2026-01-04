import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token guardado
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verificar que el token sigue siendo válido
        authAPI.getMe()
          .then((response) => {
            if (response.success) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          })
          .catch(() => {
            // Token inválido, limpiar
            logout();
          })
          .finally(() => setLoading(false));
      } catch (error) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error en login:', error);
      // Si no hay respuesta del servidor, es un error de conexión
      if (error.request && !error.response) {
        return {
          success: false,
          message: 'Error de conexión. Verifica que el servidor backend esté corriendo en http://localhost:3000',
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => user?.rol === 'admin';
  const isAlumna = () => user?.rol === 'alumna';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isAlumna,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};







