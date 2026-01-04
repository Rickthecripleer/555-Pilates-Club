import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.resetPassword(token, formData.password);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'Error al resetear contraseña');
      }
    } catch (error) {
      console.error('Error en reset:', error);
      if (error.response) {
        setError(error.response.data?.message || 'Error al resetear contraseña');
      } else if (error.request) {
        setError('Error de conexión. Verifica que el servidor backend esté corriendo.');
      } else {
        setError('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-light px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-pink-100">
            <div className="flex justify-center mb-8">
              <Logo size="md" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-slate-800 mb-4">Token Inválido</h1>
              <p className="text-slate-600 mb-6">El enlace de recuperación no es válido.</p>
              <Link 
                to="/forgot-password" 
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-light px-4 py-12">
      <div className="max-w-md w-full relative">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-pink-100">
          <div className="flex justify-center mb-8">
            <Logo size="md" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-slate-800 mb-2 tracking-tight">
              Nueva Contraseña
            </h1>
            <p className="text-slate-600 font-light">
              Ingresa tu nueva contraseña
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              <p className="font-medium mb-1">¡Contraseña actualizada exitosamente!</p>
              <p className="text-xs">Serás redirigido al inicio de sesión en unos segundos...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="Nueva Contraseña *"
                  minLength="6"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="Confirmar Contraseña *"
                  minLength="6"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 text-white py-3.5 px-6 rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
              >
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



