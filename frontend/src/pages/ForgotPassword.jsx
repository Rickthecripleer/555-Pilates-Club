import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const result = await authAPI.forgotPassword(email);

      if (result.success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(result.message || 'Error al solicitar recuperación de contraseña');
      }
    } catch (error) {
      console.error('Error en recuperación:', error);
      if (error.response) {
        setError(error.response.data?.message || 'Error al solicitar recuperación de contraseña');
      } else if (error.request) {
        setError('Error de conexión. Verifica que el servidor backend esté corriendo.');
      } else {
        setError('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-light px-4 py-12">
      <div className="max-w-md w-full relative">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-pink-100">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="md" />
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-slate-800 mb-2 tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="text-slate-600 font-light">
              Ingresa tu email para recibir instrucciones
            </p>
          </div>

          {/* Mensaje de éxito */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              <p className="font-medium mb-1">¡Correo de cambio de contraseña enviado!</p>
              <p className="text-xs">Revisa tu bandeja de correo electrónico para continuar el proceso.</p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Formulario */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="Email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 text-white py-3.5 px-6 rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
              >
                {loading ? 'Enviando...' : 'Recuperar contraseña'}
              </button>
            </form>
          )}

          {/* Links adicionales */}
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-slate-600">
              <Link 
                to="/login" 
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              ¿Aún no tienes una cuenta?{' '}
              <Link 
                to="/register" 
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



