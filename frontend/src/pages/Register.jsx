import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    telefono: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;
      const result = await authAPI.register(dataToSend);

      if (result.success) {
        // Guardar token y usuario
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        // Redirigir al dashboard
        navigate('/');
      } else {
        setError(result.message || 'Error al registrar');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      if (error.response) {
        setError(error.response.data?.message || 'Error al registrar');
      } else if (error.request) {
        setError('Error de conexión. Verifica que el servidor backend esté corriendo en http://localhost:3000');
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
              Regístrate
            </h1>
            <p className="text-slate-600 font-light">
              Crea tu cuenta para comenzar
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
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Nombre completo *"
                required
              />
            </div>

            <div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Email *"
                required
              />
            </div>

            <div>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Teléfono (opcional)"
              />
            </div>

            <div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Contraseña *"
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
                placeholder="Confirmar contraseña *"
                minLength="6"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3.5 px-6 rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
            >
              {loading ? 'Registrando...' : 'Regístrate'}
            </button>
          </form>

          {/* Links adicionales */}
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-slate-600">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                to="/login" 
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Inicia sesión
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
