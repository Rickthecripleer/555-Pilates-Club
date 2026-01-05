import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, CreditCard, Home, Users, Info, LayoutDashboard, Menu, X } from 'lucide-react';
import Logo from './Logo';

export default function Layout({ children }) {
  const { user, logout, isAdmin, isAlumna } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Cerrar menú cuando cambia la ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // No cerrar si el clic es en el botón del menú
      if (event.target.closest('button[aria-label="Toggle menu"]')) {
        return;
      }
      if (menuOpen && !event.target.closest('.mobile-menu-container')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      // Usar setTimeout para evitar que el evento se dispare inmediatamente
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 0);
      // Prevenir scroll del body cuando el menú está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-rose-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-pink-100 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-row justify-between items-center py-4 gap-3">
            {/* Logo y Botón Menú (Móvil) */}
            <div className="flex items-center gap-3 flex-1">
              {/* Botón Menú Hamburguesa - Solo móvil */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="sm:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors z-50 relative"
                aria-label="Toggle menu"
                type="button"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                <Logo size="sm" />
                <span className="text-xl font-bold text-pink-600 hidden sm:inline">
                  555 Pilates Club
                </span>
              </Link>
            </div>
            
            {/* Información de Usuario y Botón Salir - Solo Desktop */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all font-medium"
                type="button"
              >
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Desktop - Oculto en móvil */}
      <nav className="hidden sm:block bg-white border-b border-pink-100 sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide w-full">
            <Link
              to="/"
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive('/')
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
              }`}
            >
              <Home size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Inicio</span>
            </Link>
            
            <Link
              to="/panel"
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive('/panel')
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
              }`}
            >
              <LayoutDashboard size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Panel de Control</span>
            </Link>
            
            {isAlumna() && (
              <>
                <Link
                  to="/reservaciones"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive('/reservaciones')
                      ? 'border-pink-600 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
                  }`}
                >
                  <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Reservar</span>
                </Link>
                <Link
                  to="/mis-reservaciones"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive('/mis-reservaciones')
                      ? 'border-pink-600 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
                  }`}
                >
                  <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Mis Reservaciones</span>
                </Link>
                <Link
                  to="/pagos"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive('/pagos')
                      ? 'border-pink-600 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
                  }`}
                >
                  <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Pagos</span>
                </Link>
              </>
            )}
            
            {isAdmin() && (
              <>
                <Link
                  to="/admin/reservaciones"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive('/admin/reservaciones')
                      ? 'border-pink-600 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
                  }`}
                >
                  <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Asistencia</span>
                </Link>
                <Link
                  to="/admin/alumnas"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive('/admin/alumnas')
                      ? 'border-pink-600 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
                  }`}
                >
                  <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Alumnas</span>
                </Link>
                <Link
                  to="/admin/pagos"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive('/admin/pagos')
                      ? 'border-pink-600 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-200'
                  }`}
                >
                  <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Gestión Pagos</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Menú Móvil Desplegable - Estilo Elegante */}
      {menuOpen && (
        <>
          {/* Overlay oscuro con animación */}
          <div 
            className="mobile-menu-overlay fixed inset-0 bg-black bg-opacity-60 z-40 sm:hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
            }}
          />
          
          {/* Menú desplegable - Estilo similar a ezencia */}
          <div 
            className="mobile-menu-container fixed top-0 left-0 h-full w-[75vw] max-w-sm bg-white shadow-2xl z-50 sm:hidden overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px' }}
          >
            {/* Header del menú con Logo y botón cerrar */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                  <Logo size="sm" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900">555 Pilates Club</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Salina Cruz</span>
                  </div>
                </Link>
                
                {/* Botón cerrar - Estilo rosa */}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full transition-all"
                  aria-label="Cerrar menú"
                  type="button"
                >
                  <X size={28} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            {/* Navegación - Sin iconos, solo texto elegante */}
            <nav className="flex flex-col py-6">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                  isActive('/')
                    ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                }`}
              >
                Inicio
              </Link>
              
              <Link
                to="/panel"
                onClick={() => setMenuOpen(false)}
                className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                  isActive('/panel')
                    ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                }`}
              >
                Panel de Control
              </Link>
              
              {isAlumna() && (
                <>
                  <Link
                    to="/reservaciones"
                    onClick={() => setMenuOpen(false)}
                    className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                      isActive('/reservaciones')
                        ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                    }`}
                  >
                    Reservar
                  </Link>
                  <Link
                    to="/mis-reservaciones"
                    onClick={() => setMenuOpen(false)}
                    className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                      isActive('/mis-reservaciones')
                        ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                    }`}
                  >
                    Mis Reservaciones
                  </Link>
                  <Link
                    to="/pagos"
                    onClick={() => setMenuOpen(false)}
                    className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                      isActive('/pagos')
                        ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                    }`}
                  >
                    Pagos
                  </Link>
                </>
              )}
              
              {isAdmin() && (
                <>
                  <Link
                    to="/admin/reservaciones"
                    onClick={() => setMenuOpen(false)}
                    className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                      isActive('/admin/reservaciones')
                        ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                    }`}
                  >
                    Asistencia
                  </Link>
                  <Link
                    to="/admin/alumnas"
                    onClick={() => setMenuOpen(false)}
                    className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                      isActive('/admin/alumnas')
                        ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                    }`}
                  >
                    Alumnas
                  </Link>
                  <Link
                    to="/admin/pagos"
                    onClick={() => setMenuOpen(false)}
                    className={`px-6 py-4 text-lg font-medium transition-all duration-200 ${
                      isActive('/admin/pagos')
                        ? 'text-pink-600 bg-pink-50/70 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-pink-50/50 hover:text-pink-600'
                    }`}
                  >
                    Gestión Pagos
                  </Link>
                </>
              )}
              
              {/* Información del usuario */}
              <div className="px-6 py-4 mt-auto border-t border-gray-200">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                </div>
              </div>
              
              {/* Opción Cerrar Sesión - Estilo elegante como opción del menú, sin apariencia de botón */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-6 py-4 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-gray-200"
                type="button"
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <LogOut size={20} className="text-red-500" />
                <span>Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main 
        className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 w-full" 
        style={{ 
          maxWidth: '100%', 
          overflowX: 'hidden', 
          position: 'relative', 
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="w-full" 
          style={{ 
            maxWidth: '100%', 
            overflowX: 'hidden', 
            minWidth: 0,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

