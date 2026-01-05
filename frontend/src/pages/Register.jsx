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
    <div className="min-h-screen flex items-center justify-center bg-rose-light px-4 py-8 sm:py-12 w-full max-w-full overflow-x-hidden">
      <div className="max-w-md w-full relative mx-auto">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 border border-pink-100 w-full">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Logo size="md" />
          </div>

          {/* Título */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-2 tracking-tight">
              Regístrate
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-light">
              Crea tu cuenta para comenzar
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm break-words">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all bg-white"
                placeholder="Ej: María García López"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all bg-white"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all bg-white"
                placeholder="971 123 4567"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all bg-white"
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required
              />
              <p className="text-xs text-gray-500 mt-1.5 px-1">
                La contraseña debe tener al menos 6 caracteres
              </p>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all bg-white"
                placeholder="Repite tu contraseña"
                minLength="6"
                required
              />
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 sm:py-3.5 px-6 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-md hover:shadow-lg"
            >
              {loading ? 'Registrando...' : 'Regístrate'}
            </button>
          </form>

          {/* Links adicionales */}
          <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                to="/login" 
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
