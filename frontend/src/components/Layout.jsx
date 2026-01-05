import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, CreditCard, Home, Users, Info, LayoutDashboard } from 'lucide-react';
import Logo from './Logo';

export default function Layout({ children }) {
  const { user, logout, isAdmin, isAlumna } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-rose-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-pink-100 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
              <Link to="/" className="flex items-center gap-3">
                <Logo size="sm" />
                <span className="text-xl font-bold text-pink-600 hidden sm:inline">
                  555 Pilates Club
                </span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-pink-100 sticky top-0 z-10 w-full">
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
              <span className="hidden xs:inline">Panel de Control</span>
              <span className="xs:hidden">Panel</span>
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
                  <span className="hidden sm:inline">Mis Reservaciones</span>
                  <span className="sm:hidden">Mis Reservas</span>
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
                  <span className="hidden sm:inline">Asistencia</span>
                  <span className="sm:hidden">Asistencia</span>
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
                  <span className="hidden sm:inline">Gestión Pagos</span>
                  <span className="sm:hidden">Pagos</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

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

