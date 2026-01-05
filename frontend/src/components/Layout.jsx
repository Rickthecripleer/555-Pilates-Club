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
            
            {/* Información de Usuario y Botón Salir - Desktop */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            </div>

            {/* Botón Salir - Solo móvil (en header) - Más llamativo */}
            <button
              onClick={handleLogout}
              className="sm:hidden px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all flex items-center gap-2 font-medium"
              aria-label="Salir"
              type="button"
            >
              <LogOut size={18} />
              <span className="text-sm">Salir</span>
            </button>
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

      {/* Menú Móvil Desplegable */}
      {menuOpen && (
        <>
          {/* Overlay oscuro */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
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
          
          {/* Menú desplegable */}
          <div 
            className="mobile-menu-container fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 sm:hidden overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-pink-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <nav className="flex flex-col py-2">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home size={20} />
                <span>Inicio</span>
              </Link>
              
              <Link
                to="/panel"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                  isActive('/panel')
                    ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard size={20} />
                <span>Panel de Control</span>
              </Link>
              
              {isAlumna() && (
                <>
                  <Link
                    to="/reservaciones"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                      isActive('/reservaciones')
                        ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={20} />
                    <span>Reservar</span>
                  </Link>
                  <Link
                    to="/mis-reservaciones"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                      isActive('/mis-reservaciones')
                        ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={20} />
                    <span>Mis Reservaciones</span>
                  </Link>
                  <Link
                    to="/pagos"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                      isActive('/pagos')
                        ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span>Pagos</span>
                  </Link>
                </>
              )}
              
              {isAdmin() && (
                <>
                  <Link
                    to="/admin/reservaciones"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                      isActive('/admin/reservaciones')
                        ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={20} />
                    <span>Asistencia</span>
                  </Link>
                  <Link
                    to="/admin/alumnas"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                      isActive('/admin/alumnas')
                        ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Users size={20} />
                    <span>Alumnas</span>
                  </Link>
                  <Link
                    to="/admin/pagos"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors ${
                      isActive('/admin/pagos')
                        ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span>Gestión Pagos</span>
                  </Link>
                </>
              )}
              
              {/* Botón Salir en el menú móvil - Más llamativo */}
              <div className="border-t border-gray-200 mt-auto pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 px-4 py-3 text-base font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg mx-4 mb-2 transition-all shadow-md"
                  type="button"
                >
                  <LogOut size={20} />
                  <span>Salir</span>
                </button>
              </div>
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

