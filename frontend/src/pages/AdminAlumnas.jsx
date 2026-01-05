import { useEffect, useState } from 'react';
import { adminAPI, clasesAPI, horariosFijosAPI } from '../services/api';
import { Users, Mail, Phone, Calendar, CreditCard, Search, DollarSign, X, CheckCircle, Eye, Clock, CheckCircle2, XCircle, Plus, AlertCircle } from 'lucide-react';
import { format, parseISO, addDays, startOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { COSTO_INSCRIPCION, CAPACIDAD_MAXIMA_CLASE } from '../config/constants';

// Configuración de planes disponibles
const PLANES = [
  { id: 'mensual', nombre: 'Mensualidad', precio: 980, tipo_plan: 'mensual', requiereInscripcion: true },
  { id: '4-clases', nombre: 'Cuatro sesiones semanales', precio: 380, tipo_plan: 'paquete', requiereInscripcion: false },
  { id: '3-clases', nombre: 'Tres sesiones semanales', precio: 280, tipo_plan: 'paquete', requiereInscripcion: false },
  { id: '2-clases', nombre: 'Dos sesiones semanales', precio: 180, tipo_plan: 'paquete', requiereInscripcion: false },
  { id: 'sesion', nombre: 'Sesión Individual', precio: 100, tipo_plan: 'sesion', requiereInscripcion: false },
];

export default function AdminAlumnas() {
  const [alumnas, setAlumnas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarModalRegistroRapido, setMostrarModalRegistroRapido] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [mostrarModalReservacion, setMostrarModalReservacion] = useState(false);
  const [alumnaSeleccionada, setAlumnaSeleccionada] = useState(null);
  const [detalleAlumna, setDetalleAlumna] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [pagoRegistrado, setPagoRegistrado] = useState(false);
  const [formPago, setFormPago] = useState({
    tipo_plan: 'mensual',
    monto: 980,
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    descripcion: '',
  });
  const [formRegistroRapido, setFormRegistroRapido] = useState({
    nombre: '',
    telefono: '',
    registrarPago: true,
    tipo_plan: 'inscripcion',
    monto: COSTO_INSCRIPCION,
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    descripcion: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [credencialesGeneradas, setCredencialesGeneradas] = useState(null);
  const [alumnaTieneInscripcion, setAlumnaTieneInscripcion] = useState(false);
  

  useEffect(() => {
    loadAlumnas();
  }, []);

  const loadAlumnas = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAlumnas();
      setAlumnas(res.data || []);
    } catch (error) {
      console.error('Error al cargar alumnas:', error);
    } finally {
      setLoading(false);
    }
  };

  const alumnasFiltradas = alumnas.filter((alumna) => {
    const busquedaLower = busqueda.toLowerCase();
    return (
      alumna.nombre.toLowerCase().includes(busquedaLower) ||
      alumna.email.toLowerCase().includes(busquedaLower) ||
      (alumna.telefono && alumna.telefono.includes(busquedaLower))
    );
  });

  const abrirModalPago = async (alumna) => {
    // Cerrar otros modales primero
    setMostrarModalDetalle(false);
    setMostrarModalRegistroRapido(false);
    setMostrarModalReservacion(false);
    
    setAlumnaSeleccionada(alumna);
    setFormPago({
      tipo_plan: 'mensual',
      monto: 980, // Monto base de mensualidad
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      descripcion: '',
    });
    setMostrarModalPago(true);
    setMensaje({ tipo: '', texto: '' });
    
    // Verificar si la alumna tiene inscripción pagada
    try {
      const res = await adminAPI.getAlumna(alumna.id);
      const pagos = res.data?.pagos || [];
      const tieneInscripcion = pagos.some(p => 
        (p.tipo_plan === 'inscripcion' && p.estatus === 'completado') ||
        (p.tipo_plan === 'mensual' && parseFloat(p.monto) >= 1100 && p.estatus === 'completado')
      );
      setAlumnaTieneInscripcion(tieneInscripcion);
    } catch (error) {
      console.error('Error al verificar inscripción:', error);
      setAlumnaTieneInscripcion(false);
    }
  };

  const cerrarModalPago = () => {
    setMostrarModalPago(false);
    setAlumnaSeleccionada(null);
    setPagoRegistrado(false);
    setFormPago({
      tipo_plan: 'mensual',
      monto: 980,
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      descripcion: '',
    });
    setMensaje({ tipo: '', texto: '' });
  };

  const abrirModalReservacion = () => {
    // Cerrar otros modales primero
    setMostrarModalPago(false);
    setMostrarModalDetalle(false);
    setMostrarModalRegistroRapido(false);
    
    setMostrarModalReservacion(true);
    setMensaje({ tipo: '', texto: '' });
  };

  const cerrarModalReservacion = () => {
    setMostrarModalReservacion(false);
    setMensaje({ tipo: '', texto: '' });
  };

  const handleCambioPlan = (planId) => {
    const plan = PLANES.find(p => p.id === planId);
    if (plan) {
      setFormPago({
        ...formPago,
        tipo_plan: plan.tipo_plan,
        monto: plan.precio, // Monto base del plan
      });
    }
  };
  
  // Calcular monto total a mostrar (incluye inscripción si es mensualidad y no tiene inscripción)
  const calcularMontoTotal = () => {
    if (formPago.tipo_plan === 'mensual' && !alumnaTieneInscripcion) {
      return formPago.monto + COSTO_INSCRIPCION;
    }
    return formPago.monto;
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const datosPago = {
        ...formPago
      };
      
      await adminAPI.registrarPagoEfectivo(alumnaSeleccionada.id, datosPago);
      setMensaje({
        tipo: 'success',
        texto: 'Pago en efectivo registrado exitosamente',
      });
      setPagoRegistrado(true);
      
      // Recargar lista de alumnas
      loadAlumnas();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al registrar el pago',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalRegistroRapido = () => {
    setFormRegistroRapido({
      nombre: '',
      telefono: '',
      registrarPago: true,
      tipo_plan: 'mensual', // Cambiar a mensual por defecto
      monto: 980, // El backend agregará $120 automáticamente si no tiene inscripción
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      descripcion: '',
    });
    setMostrarModalRegistroRapido(true);
    setMensaje({ tipo: '', texto: '' });
    setCredencialesGeneradas(null);
  };

  const cerrarModalRegistroRapido = () => {
    setMostrarModalRegistroRapido(false);
    setFormRegistroRapido({
      nombre: '',
      telefono: '',
      registrarPago: true,
      tipo_plan: 'mensual',
      monto: 980,
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      descripcion: '',
    });
    setMensaje({ tipo: '', texto: '' });
    setCredencialesGeneradas(null);
  };

  const handleCambioPlanRegistro = (planId) => {
    const plan = PLANES.find(p => p.id === planId);
    if (plan) {
      setFormRegistroRapido({
        ...formRegistroRapido,
        tipo_plan: plan.tipo_plan,
        monto: plan.precio,
      });
    }
  };

  const handleRegistroRapido = async (e) => {
    e.preventDefault();
    setRegistrando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const datos = {
        nombre: formRegistroRapido.nombre,
        telefono: formRegistroRapido.telefono || null,
      };

      // Si se marca registrar pago, incluir datos del pago
      if (formRegistroRapido.registrarPago) {
        datos.tipo_plan = formRegistroRapido.tipo_plan;
        datos.monto = formRegistroRapido.monto;
        datos.fecha_pago = formRegistroRapido.fecha_pago;
        datos.descripcion = formRegistroRapido.descripcion;
      }

      const res = await adminAPI.registrarAlumnaRapida(datos);
      
      setCredencialesGeneradas(res.data.credenciales);
      setMensaje({
        tipo: 'success',
        texto: 'Alumna registrada exitosamente',
      });
      
      // Recargar lista después de 2 segundos
      setTimeout(() => {
        loadAlumnas();
        cerrarModalRegistroRapido();
      }, 2000);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al registrar alumna',
      });
    } finally {
      setRegistrando(false);
    }
  };

  const abrirModalDetalle = async (alumnaId) => {
    // Cerrar otros modales primero
    setMostrarModalPago(false);
    setMostrarModalRegistroRapido(false);
    setMostrarModalReservacion(false);
    
    setCargandoDetalle(true);
    setMostrarModalDetalle(true);
    setMensaje({ tipo: '', texto: '' });
    
    try {
      const res = await adminAPI.getAlumna(alumnaId);
      setDetalleAlumna(res.data);
    } catch (error) {
      console.error('Error al cargar detalle de alumna:', error);
      setMensaje({
        tipo: 'error',
        texto: 'Error al cargar información de la alumna',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModalDetalle = () => {
    setMostrarModalDetalle(false);
    setDetalleAlumna(null);
    setMensaje({ tipo: '', texto: '' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Users className="text-pink-600" size={28} />
            Gestión de Alumnas
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Total de alumnas: {alumnas.length}
          </p>
        </div>
        <button
          onClick={abrirModalRegistroRapido}
          className="px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-xs sm:text-sm flex items-center gap-2 w-full sm:w-auto justify-center transform hover:scale-105 active:scale-95"
        >
          <Users size={16} className="sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Registrar Alumna</span>
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla de Alumnas - Responsive */}
      <div className="card overflow-hidden p-0">
        {/* Vista Desktop - Tabla completa */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumna
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alumnasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {busqueda ? 'No se encontraron alumnas con ese criterio' : 'No hay alumnas registradas'}
                  </td>
                </tr>
              ) : (
                alumnasFiltradas.map((alumna) => (
                  <tr key={alumna.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                          <span className="text-pink-700 font-medium">
                            {alumna.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3 lg:ml-4">
                          <div className="text-sm font-medium text-gray-900 break-words">
                            {alumna.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {alumna.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-2 mb-1">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="break-all" title={alumna.email}>
                          {alumna.email}
                        </span>
                      </div>
                      {alumna.telefono && (
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <span>{alumna.telefono}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs lg:text-sm">
                          {format(parseISO(alumna.fecha_registro), "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          alumna.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {alumna.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirModalPago(alumna)}
                          className="text-xs px-2 py-1 text-pink-600 hover:text-pink-900 hover:bg-pink-50 rounded transition-colors flex items-center gap-1"
                          title="Registrar pago manual"
                        >
                          <DollarSign size={14} />
                          Pago
                        </button>
                        <button
                          onClick={() => abrirModalDetalle(alumna.id)}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                          title="Ver información detallada"
                        >
                          <Eye size={14} />
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Vista Móvil - Cards Mejoradas */}
        <div className="md:hidden space-y-4 p-4">
          {alumnasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {busqueda ? 'No se encontraron alumnas con ese criterio' : 'No hay alumnas registradas'}
            </div>
          ) : (
            alumnasFiltradas.map((alumna) => (
              <div key={alumna.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
                {/* Header con Avatar y Nombre */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-700 font-semibold text-xl">
                      {alumna.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-gray-900 break-words mb-1">
                      {alumna.nombre}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      ID: {alumna.id}
                    </div>
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                        alumna.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {alumna.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                
                {/* Información de Contacto - Mejorada */}
                <div className="space-y-2.5 border-t border-gray-200 pt-3">
                  <div className="flex items-start gap-2.5">
                    <Mail size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">Email</div>
                      <span className="text-sm text-gray-900 break-all">{alumna.email}</span>
                    </div>
                  </div>
                  {alumna.telefono && (
                    <div className="flex items-start gap-2.5">
                      <Phone size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">Teléfono</div>
                        <span className="text-sm text-gray-900">{alumna.telefono}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <Calendar size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">Fecha de Registro</div>
                      <span className="text-sm text-gray-900">
                        {format(parseISO(alumna.fecha_registro), "dd 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Acciones - Botones más pequeños */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => abrirModalPago(alumna)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-pink-600 hover:text-pink-900 hover:bg-pink-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-pink-200"
                  >
                    <DollarSign size={14} />
                    Pago
                  </button>
                  <button
                    onClick={() => abrirModalDetalle(alumna.id)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-blue-200"
                  >
                    <Eye size={14} />
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para Registrar Pago en Efectivo */}
      {mostrarModalPago && alumnaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl md:rounded-2xl shadow-xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                  <DollarSign className="text-pink-600 flex-shrink-0" size={20} className="sm:w-6 sm:h-6" />
                  <span className="truncate">Registrar Pago</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">
                  Alumna: <span className="font-medium">{alumnaSeleccionada.nombre}</span>
                </p>
              </div>
              <button
                onClick={cerrarModalPago}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Mensajes */}
            {mensaje.texto && (
              <div
                className={`mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg ${
                  mensaje.tipo === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {mensaje.tipo === 'success' ? (
                    <CheckCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  ) : (
                    <X size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm sm:text-base">{mensaje.texto}</p>
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleRegistrarPago} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
              {/* Tipo de Plan */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Tipo de Plan
                </label>
                <select
                  value={PLANES.find(p => p.tipo_plan === formPago.tipo_plan && p.precio === formPago.monto)?.id || 
                         PLANES.find(p => p.tipo_plan === formPago.tipo_plan)?.id || 'mensual'}
                  onChange={(e) => handleCambioPlan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  {PLANES.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${plan.precio} MXN
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto Base (solo editable para planes no mensuales) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Monto Base del Plan (MXN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Desglose y Total para Mensualidad */}
              {formPago.tipo_plan === 'mensual' && (
                <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h4 className="font-semibold text-pink-900 text-xs sm:text-sm mb-1.5 sm:mb-2">Desglose del Pago:</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Mensualidad:</span>
                      <span className="font-medium text-gray-900">${formPago.monto.toFixed(2)}</span>
                    </div>
                    
                    {!alumnaTieneInscripcion ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Inscripción:</span>
                          <span className="font-medium text-gray-900">${COSTO_INSCRIPCION.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-pink-300 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-pink-900 text-base">TOTAL A COBRAR:</span>
                            <span className="font-bold text-pink-900 text-lg">${calcularMontoTotal().toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-pink-700 mt-2">
                          ℹ️ La inscripción se cobrará automáticamente porque la alumna no tiene inscripción pagada.
                        </p>
                      </>
                    ) : (
                      <div className="border-t border-pink-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-pink-900 text-base">TOTAL A COBRAR:</span>
                          <span className="font-bold text-pink-900 text-lg">${formPago.monto.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                          ✓ La alumna ya tiene inscripción pagada, solo se cobrará la mensualidad.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fecha de Pago */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  value={formPago.fecha_pago}
                  onChange={(e) => setFormPago({ ...formPago, fecha_pago: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Descripción (Opcional) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formPago.descripcion}
                  onChange={(e) => setFormPago({ ...formPago, descripcion: e.target.value })}
                  placeholder="Ej: Pago en efectivo recibido en caja"
                  rows="2"
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Botones */}
              {!pagoRegistrado ? (
                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={cerrarModalPago}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    {guardando ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">Guardando...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Registrar</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium mb-2">¡Pago registrado exitosamente!</p>
                    <p className="text-sm text-green-700">Ahora puedes asignar una clase a la alumna.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        cerrarModalPago();
                        abrirModalReservacion();
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                    >
                      <Calendar size={20} className="stroke-2" />
                      Asignar Clase
                    </button>
                    <button
                      type="button"
                      onClick={cerrarModalPago}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear Reservación */}
      {mostrarModalReservacion && alumnaSeleccionada && (
        <ModalReservacion
          alumna={alumnaSeleccionada}
          onClose={cerrarModalReservacion}
        />
      )}

      {/* Modal para Registro Rápido de Alumna */}
      {mostrarModalRegistroRapido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl md:rounded-2xl shadow-xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                  <Users className="text-pink-600 flex-shrink-0" size={20} className="sm:w-6 sm:h-6" />
                  <span className="truncate">Registro Rápido</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  Para alumnas que no manejan tecnología
                </p>
              </div>
              <button
                onClick={cerrarModalRegistroRapido}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Mensajes */}
            {mensaje.texto && (
              <div
                className={`mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg ${
                  mensaje.tipo === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {mensaje.tipo === 'success' ? (
                    <CheckCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  ) : (
                    <X size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm sm:text-base">{mensaje.texto}</p>
                </div>
              </div>
            )}

            {/* Credenciales Generadas */}
            {credencialesGeneradas && (
              <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1.5 sm:mb-2">Credenciales generadas:</p>
                <div className="space-y-1 text-xs sm:text-sm text-blue-800 break-all">
                  <p><strong>Email:</strong> {credencialesGeneradas.email}</p>
                  <p><strong>Password:</strong> {credencialesGeneradas.password}</p>
                </div>
                <p className="text-xs text-blue-600 mt-1.5 sm:mt-2">Guarda estas credenciales. La alumna puede iniciar sesión con ellas.</p>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleRegistroRapido} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
              {/* Nombre (Requerido) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formRegistroRapido.nombre}
                  onChange={(e) => setFormRegistroRapido({ ...formRegistroRapido, nombre: e.target.value })}
                  placeholder="Ej: María García López"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Teléfono (Opcional) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  value={formRegistroRapido.telefono}
                  onChange={(e) => setFormRegistroRapido({ ...formRegistroRapido, telefono: e.target.value })}
                  placeholder="Ej: 5551234567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Checkbox para registrar pago */}
              <div className="flex items-center gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="registrarPago"
                  checked={formRegistroRapido.registrarPago}
                  onChange={(e) => setFormRegistroRapido({ ...formRegistroRapido, registrarPago: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 flex-shrink-0"
                />
                <label htmlFor="registrarPago" className="text-xs sm:text-sm font-medium text-gray-700">
                  Registrar pago en efectivo ahora
                </label>
              </div>

              {/* Campos de Pago (solo si está marcado) */}
              {formRegistroRapido.registrarPago && (
                <>
                  {/* Tipo de Plan */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Tipo de Plan
                    </label>
                    <select
                      value={PLANES.find(p => p.tipo_plan === formRegistroRapido.tipo_plan && p.precio === formRegistroRapido.monto)?.id || 
                             PLANES.find(p => p.tipo_plan === formRegistroRapido.tipo_plan)?.id || 'mensual'}
                      onChange={(e) => handleCambioPlanRegistro(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required={formRegistroRapido.registrarPago}
                    >
                      {PLANES.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre} - ${plan.precio} MXN
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monto Base */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Monto Base del Plan (MXN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formRegistroRapido.monto}
                      onChange={(e) => setFormRegistroRapido({ ...formRegistroRapido, monto: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required={formRegistroRapido.registrarPago}
                    />
                  </div>

                  {/* Desglose y Total para Mensualidad en Registro Rápido */}
                  {formRegistroRapido.tipo_plan === 'mensual' && (
                    <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <h4 className="font-semibold text-pink-900 text-xs sm:text-sm mb-1.5 sm:mb-2">Desglose del Pago:</h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Mensualidad:</span>
                          <span className="font-medium text-gray-900">${formRegistroRapido.monto.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Inscripción:</span>
                          <span className="font-medium text-gray-900">${COSTO_INSCRIPCION.toFixed(2)}</span>
                        </div>
                        
                        <div className="border-t border-pink-300 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-pink-900 text-base">TOTAL A COBRAR:</span>
                            <span className="font-bold text-pink-900 text-lg">${(formRegistroRapido.monto + COSTO_INSCRIPCION).toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-pink-700 mt-2">
                          ℹ️ Al registrar una nueva alumna con mensualidad, siempre se cobra la inscripción ($120) + mensualidad.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fecha de Pago */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Fecha de Pago
                    </label>
                    <input
                      type="date"
                      value={formRegistroRapido.fecha_pago}
                      onChange={(e) => setFormRegistroRapido({ ...formRegistroRapido, fecha_pago: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required={formRegistroRapido.registrarPago}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      value={formRegistroRapido.descripcion}
                      onChange={(e) => setFormRegistroRapido({ ...formRegistroRapido, descripcion: e.target.value })}
                      placeholder="Ej: Pago en efectivo recibido en caja"
                      rows="2"
                      className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cerrarModalRegistroRapido}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={registrando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registrando}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  {registrando ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Registrando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span>Registrar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Ver Detalle de Alumna */}
      {mostrarModalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl md:rounded-2xl shadow-xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                  <Eye className="text-blue-600 flex-shrink-0" size={20} className="sm:w-6 sm:h-6" />
                  <span className="truncate">Detalle de Alumna</span>
                </h2>
                {detalleAlumna && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">
                    {detalleAlumna.nombre}
                  </p>
                )}
              </div>
              <button
                onClick={cerrarModalDetalle}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Mensajes */}
            {mensaje.texto && mensaje.tipo === 'error' && (
              <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                <div className="flex items-center gap-2">
                  <X size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  <p className="text-sm sm:text-base">{mensaje.texto}</p>
                </div>
              </div>
            )}

            {/* Contenido */}
            {cargandoDetalle ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : detalleAlumna ? (
              <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                {/* Información Personal */}
                <div className="card">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <Users className="text-blue-600 flex-shrink-0" size={18} className="sm:w-5 sm:h-5" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nombre</label>
                      <p className="text-gray-900">{detalleAlumna.nombre}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 break-all" title={detalleAlumna.email}>
                        {detalleAlumna.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Teléfono</label>
                      <p className="text-gray-900">{detalleAlumna.telefono || 'No registrado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                      <p className="text-gray-900">
                        {format(parseISO(detalleAlumna.fecha_registro), "dd 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          detalleAlumna.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {detalleAlumna.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pagos */}
                <div className="card">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <CreditCard className="text-blue-600 flex-shrink-0" size={18} className="sm:w-5 sm:h-5" />
                    Historial de Pagos ({detalleAlumna.pagos?.length || 0})
                  </h3>
                  {detalleAlumna.pagos && detalleAlumna.pagos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {detalleAlumna.pagos.map((pago) => {
                            // Verificar si el pago incluye inscripción
                            // Si es mensualidad y el monto es $1100 o más, y la descripción menciona inscripción
                            const esMensualidad = pago.tipo_plan === 'mensual';
                            const montoPago = parseFloat(pago.monto);
                            const tieneInscripcionEnDescripcion = pago.descripcion && 
                                                                  (pago.descripcion.toLowerCase().includes('inscripción') || 
                                                                   pago.descripcion.toLowerCase().includes('inscripcion'));
                            const incluyeInscripcion = esMensualidad && montoPago >= (980 + COSTO_INSCRIPCION) && tieneInscripcionEnDescripcion;
                            const montoBase = incluyeInscripcion ? montoPago - COSTO_INSCRIPCION : montoPago;
                            
                            return (
                            <tr key={pago.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {format(parseISO(pago.fecha_pago), "dd/MM/yyyy", { locale: es })}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 capitalize">{pago.tipo_plan}</td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900">${parseFloat(pago.monto).toFixed(2)}</span>
                                  {incluyeInscripcion && (
                                    <span className="text-xs text-gray-500 mt-1">
                                      Mensualidad: ${montoBase.toFixed(2)} + Inscripción: $${COSTO_INSCRIPCION.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 capitalize">{pago.metodo_pago}</td>
                              <td className="px-4 py-2 text-sm">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    pago.estatus === 'completado'
                                      ? 'bg-green-100 text-green-800'
                                      : pago.estatus === 'pendiente'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {pago.estatus === 'completado' ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 size={12} />
                                      Completado
                                    </span>
                                  ) : pago.estatus === 'pendiente' ? (
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      Pendiente
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <XCircle size={12} />
                                      Rechazado
                                    </span>
                                  )}
                                </span>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay pagos registrados</p>
                  )}
                </div>

                {/* Reservaciones */}
                <div className="card">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <Calendar className="text-blue-600 flex-shrink-0" size={18} className="sm:w-5 sm:h-5" />
                    Reservaciones Recientes ({detalleAlumna.reservaciones?.length || 0})
                  </h3>
                  {detalleAlumna.reservaciones && detalleAlumna.reservaciones.length > 0 ? (
                    <div className="space-y-3">
                      {detalleAlumna.reservaciones.map((reservacion) => (
                        <div
                          key={reservacion.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{reservacion.nombre_clase}</p>
                              <p className="text-sm text-gray-600">
                                {reservacion.dia_semana} - {reservacion.hora_inicio} a {reservacion.hora_fin}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Fecha: {format(parseISO(reservacion.fecha_reserva), "dd/MM/yyyy", { locale: es })}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                reservacion.estatus === 'confirmada'
                                  ? 'bg-green-100 text-green-800'
                                  : reservacion.estatus === 'no_asistio'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {reservacion.estatus === 'confirmada' ? 'Confirmada' : 
                               reservacion.estatus === 'no_asistio' ? 'No asistió' : 
                               reservacion.estatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay reservaciones registradas</p>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      cerrarModalDetalle();
                      setAlumnaSeleccionada(detalleAlumna);
                      abrirModalReservacion();
                    }}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-xs sm:text-sm"
                  >
                    <Calendar size={18} className="sm:w-5 sm:h-5 stroke-2" />
                    Asignar Clase
                  </button>
                  <button
                    onClick={cerrarModalDetalle}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal para Crear Reservación */}
      {mostrarModalReservacion && alumnaSeleccionada && (
        <ModalReservacion
          alumna={alumnaSeleccionada}
          onClose={cerrarModalReservacion}
        />
      )}
    </div>
  );
}

// Componente Modal de Reservación
function ModalReservacion({ alumna, onClose }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  useEffect(() => {
    loadClases();
  }, [fechaSeleccionada]);

  const loadClases = async () => {
    setLoading(true);
    try {
      const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
      const res = await clasesAPI.getDisponibles({ fecha: fechaStr });
      setClases(res.data || []);
    } catch (error) {
      console.error('Error al cargar clases:', error);
      setClases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearReservacion = async () => {
    if (!horarioSeleccionado) {
      setMensaje({
        tipo: 'error',
        texto: 'Por favor selecciona una clase',
      });
      return;
    }

    setCreando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
      await adminAPI.crearReservacionAlumna(alumna.id, horarioSeleccionado, fechaStr);
      
      setMensaje({
        tipo: 'success',
        texto: 'Reservación creada exitosamente',
      });
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al crear la reservación',
      });
    } finally {
      setCreando(false);
    }
  };

  // Generar fechas de la semana (lunes a viernes)
  const inicioSemana = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 });
  const fechasSemana = eachDayOfInterval({
    start: inicioSemana,
    end: addDays(inicioSemana, 4), // Solo lunes a viernes
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-xl md:rounded-2xl shadow-xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} />
              Asignar Clase a Alumna
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Alumna: <span className="font-medium">{alumna.nombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div
            className={`mx-6 mt-4 p-4 rounded-lg ${
              mensaje.tipo === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Selector de Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una Fecha
            </label>
            
            {/* Input de fecha personalizado */}
            <div className="mb-3">
              <input
                type="date"
                value={format(fechaSeleccionada, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const nuevaFecha = new Date(e.target.value);
                  if (!isNaN(nuevaFecha.getTime())) {
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    nuevaFecha.setHours(0, 0, 0, 0);
                    if (nuevaFecha >= hoy) {
                      setFechaSeleccionada(nuevaFecha);
                    } else {
                      setMensaje({
                        tipo: 'error',
                        texto: 'No se pueden crear reservaciones para fechas pasadas',
                      });
                    }
                  }
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Navegación rápida: Semana actual */}
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-2">Navegación rápida:</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFechaSeleccionada(new Date())}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={() => setFechaSeleccionada(addDays(new Date(), 1))}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Mañana
                </button>
                <button
                  onClick={() => {
                    const hoy = new Date();
                    const proximoLunes = addDays(hoy, (8 - hoy.getDay()) % 7 || 7);
                    setFechaSeleccionada(proximoLunes);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Próximo Lunes
                </button>
              </div>
            </div>
            
            {/* Vista de semana actual (solo Lunes a Viernes) */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Semana actual (Lunes a Viernes):</p>
              <div className="flex gap-2 flex-wrap">
                {fechasSemana.map((fecha) => {
                  const esPasado = fecha < new Date() && format(fecha, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
                  return (
                    <button
                      key={fecha.toISOString()}
                      onClick={() => !esPasado && setFechaSeleccionada(fecha)}
                      disabled={esPasado}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        format(fecha, 'yyyy-MM-dd') === format(fechaSeleccionada, 'yyyy-MM-dd')
                          ? 'bg-blue-600 text-white'
                          : esPasado
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {format(fecha, 'EEE d', { locale: es })}
                    </button>
                  );
                })}
              </div>
              {/* Botones para cambiar de semana */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setFechaSeleccionada(subDays(fechaSeleccionada, 7))}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  ← Semana anterior
                </button>
                <button
                  onClick={() => setFechaSeleccionada(addDays(fechaSeleccionada, 7))}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Semana siguiente →
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Clases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una Clase
            </label>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : clases.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay clases disponibles para esta fecha
              </p>
            ) : (
              <div className="space-y-2">
                {clases.map((clase) => {
                  const lugaresDisponibles = clase.lugares_disponibles || 0;
                  const capacidadMaxima = clase.capacidad_maxima || CAPACIDAD_MAXIMA_CLASE;
                  const reservacionesActuales = clase.reservaciones_actuales || 0;
                  const hayEspacios = lugaresDisponibles > 0;
                  
                  return (
                    <button
                      key={clase.horario_id}
                      onClick={() => setHorarioSeleccionado(clase.horario_id)}
                      disabled={!hayEspacios}
                      className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                        horarioSeleccionado === clase.horario_id
                          ? 'border-blue-600 bg-blue-50'
                          : hayEspacios
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{clase.nombre_clase}</p>
                            {!hayEspacios && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                Lleno
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {(() => {
                              const formatearHora = (hora24) => {
                                if (!hora24) return '';
                                const [horas, minutos] = hora24.split(':');
                                const hora = parseInt(horas, 10);
                                const min = minutos || '00';
                                if (hora === 0) return `12:${min} AM`;
                                else if (hora < 12) return `${hora}:${min} AM`;
                                else if (hora === 12) return `12:${min} PM`;
                                else return `${hora - 12}:${min} PM`;
                              };
                              return `${formatearHora(clase.hora_inicio)} - ${formatearHora(clase.hora_fin)}`;
                            })()}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              <strong className="text-gray-700">{lugaresDisponibles}</strong> de <strong className="text-gray-700">{capacidadMaxima}</strong> espacios disponibles
                            </span>
                            {reservacionesActuales > 0 && (
                              <span className="text-gray-400">
                                ({reservacionesActuales} reservada{reservacionesActuales > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        </div>
                        {horarioSeleccionado === clase.horario_id && hayEspacios && (
                          <CheckCircle className="text-blue-600 flex-shrink-0" size={20} />
                        )}
                        {!hayEspacios && (
                          <XCircle className="text-red-400 flex-shrink-0" size={20} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={creando}
            >
              Cancelar
            </button>
            <button
              onClick={handleCrearReservacion}
              disabled={creando || !horarioSeleccionado}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Crear Reservación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

