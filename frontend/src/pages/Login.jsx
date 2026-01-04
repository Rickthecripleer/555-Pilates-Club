import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Error al iniciar sesión');
    }
    
    setLoading(false);
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
              Iniciar sesión
            </h1>
            <p className="text-slate-600 font-light">
              Accede a tu cuenta
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Formulario */}
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

            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Contraseña"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3.5 px-6 rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Links adicionales */}
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-slate-600">
              ¿Aún no tienes una cuenta?{' '}
              <Link 
                to="/register" 
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              <Link 
                to="/forgot-password" 
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
