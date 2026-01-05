import { useEffect, useState } from 'react';
import { reservacionesAPI, cambiosHorarioAPI } from '../services/api';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Función para convertir hora de 24h a formato 12h con AM/PM
const formatearHora = (hora24) => {
  if (!hora24) return '';
  const [horas, minutos] = hora24.split(':');
  const hora = parseInt(horas, 10);
  const min = minutos || '00';
  
  if (hora === 0) {
    return `12:${min} AM`;
  } else if (hora < 12) {
    return `${hora}:${min} AM`;
  } else if (hora === 12) {
    return `12:${min} PM`;
  } else {
    return `${hora - 12}:${min} PM`;
  }
};

export default function MisReservaciones() {
  const [reservaciones, setReservaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [infoCambios, setInfoCambios] = useState(null);
  const [filtroEstatus, setFiltroEstatus] = useState('todas'); // todas, confirmadas, canceladas, completadas

  useEffect(() => {
    loadReservaciones();
    loadInfoCambios();
  }, [filtroEstatus]);

  const loadReservaciones = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filtroEstatus !== 'todas') {
        filters.estatus = filtroEstatus;
      }
      
      const res = await reservacionesAPI.getMisReservaciones(filters);
      // Ordenar: futuras primero, luego pasadas
      const hoy = startOfToday();
      const reservacionesOrdenadas = (res.data || []).sort((a, b) => {
        const fechaA = parseISO(a.fecha_reserva);
        const fechaB = parseISO(b.fecha_reserva);
        const esFuturaA = isAfter(fechaA, hoy) || format(fechaA, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');
        const esFuturaB = isAfter(fechaB, hoy) || format(fechaB, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');
        
        if (esFuturaA && !esFuturaB) return -1;
        if (!esFuturaA && esFuturaB) return 1;
        return fechaA - fechaB;
      });
      
      setReservaciones(reservacionesOrdenadas);
    } catch (error) {
      console.error('Error al cargar reservaciones:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar tus reservaciones' });
    } finally {
      setLoading(false);
    }
  };

  const loadInfoCambios = async () => {
    try {
      const res = await cambiosHorarioAPI.getInfo();
      setInfoCambios(res.data);
    } catch (error) {
      console.error('Error al cargar info de cambios:', error);
    }
  };

  const handleCancelar = async (reservacionId) => {
    if (!window.confirm('¿Estás segura de que quieres cancelar esta reservación?')) {
      return;
    }

    setCancelando(reservacionId);
    setMensaje({ tipo: '', texto: '' });

    try {
      await reservacionesAPI.cancelarReservacion(reservacionId);
      setMensaje({
        tipo: 'success',
        texto: 'Reservación cancelada exitosamente',
      });
      
      // Recargar datos
      await Promise.all([loadReservaciones(), loadInfoCambios()]);
      
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al cancelar la reservación',
      });
    } finally {
      setCancelando(null);
    }
  };

  // Agrupar reservaciones por fecha
  const reservacionesPorFecha = reservaciones.reduce((acc, res) => {
    const fechaStr = format(parseISO(res.fecha_reserva), 'yyyy-MM-dd');
    if (!acc[fechaStr]) {
      acc[fechaStr] = [];
    }
    acc[fechaStr].push(res);
    return acc;
  }, {});

  const hoy = startOfToday();
  const reservacionesFuturas = reservaciones.filter(r => {
    const fecha = parseISO(r.fecha_reserva);
    return (isAfter(fecha, hoy) || format(fecha, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd')) 
      && r.estatus === 'confirmada';
  });
  const reservacionesPasadas = reservaciones.filter(r => {
    const fecha = parseISO(r.fecha_reserva);
    return !isAfter(fecha, hoy) && format(fecha, 'yyyy-MM-dd') !== format(hoy, 'yyyy-MM-dd');
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden" style={{ position: 'relative', minWidth: 0 }}>
      <div className="w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">Mis Reservaciones</h1>
        <p className="text-sm sm:text-base text-gray-600 text-center sm:text-left">Gestiona tus reservaciones y cambios de horario</p>
      </div>

      {/* Mensajes */}
      {mensaje.texto && (
        <div
          className={`p-4 rounded-lg ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Información de cambios de horario (solo para mensualidad) */}
      {infoCambios && infoCambios.tienePlanMensual && (
        <div className={`card ${
          infoCambios.puedeCambiar 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <RefreshCw className={infoCambios.puedeCambiar ? 'text-blue-600' : 'text-yellow-600'} size={24} />
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${
                infoCambios.puedeCambiar ? 'text-blue-900' : 'text-yellow-900'
              }`}>
                Cambios de Horario Disponibles
              </h3>
              <p className={`text-sm ${
                infoCambios.puedeCambiar ? 'text-blue-800' : 'text-yellow-800'
              }`}>
                {infoCambios.puedeCambiar 
                  ? `Tienes ${infoCambios.cambiosDisponibles} cambio de horario disponible. Si tienes un imprevisto (trabajo, viaje, etc.) o el nivel de la clase te quedó muy básico/avanzado, puedes cancelar tus reservaciones y reservar en otro horario.`
                  : 'Ya usaste tu cambio de horario permitido para este mes. Puedes seguir reservando clases normalmente, pero no puedes hacer más cambios hasta el próximo mes.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full" style={{ maxWidth: '100%', overflowX: 'hidden', minWidth: 0 }}>
        <button
          onClick={() => setFiltroEstatus('todas')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            filtroEstatus === 'todas'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltroEstatus('confirmada')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            filtroEstatus === 'confirmada'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confirmadas
        </button>
        <button
          onClick={() => setFiltroEstatus('cancelada')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            filtroEstatus === 'cancelada'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Canceladas
        </button>
        <button
          onClick={() => setFiltroEstatus('completada')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            filtroEstatus === 'completada'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completadas
        </button>
      </div>

      {/* Lista de Reservaciones */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      ) : reservaciones.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No tienes reservaciones {filtroEstatus !== 'todas' ? `con estatus "${filtroEstatus}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-6" style={{ maxWidth: '100%', overflowX: 'hidden', minWidth: 0 }}>
          {/* Reservaciones Futuras */}
          {reservacionesFuturas.length > 0 && (
            <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Próximas Reservaciones</h2>
              <div className="space-y-3" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                {reservacionesFuturas.map((res) => {
                  const fecha = parseISO(res.fecha_reserva);
                  const esHoy = format(fecha, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');
                  const puedeCancelar = isAfter(fecha, hoy) || esHoy;

                  return (
                    <div
                      key={res.id}
                      className="card border-l-4 border-l-pink-500 w-full max-w-full overflow-x-hidden"
                      style={{ maxWidth: '100%', overflowX: 'hidden', position: 'relative', minWidth: 0 }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full" style={{ maxWidth: '100%', minWidth: 0 }}>
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">{res.nombre_clase}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                              res.estatus === 'confirmada'
                                ? 'bg-green-100 text-green-800'
                                : res.estatus === 'completada'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {res.estatus}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-1 min-w-0">
                              <Calendar size={14} className="flex-shrink-0" />
                              <span className="font-medium break-words">
                                {format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                                {esHoy && <span className="ml-2 text-pink-600 font-bold">(Hoy)</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock size={14} />
                              <span>
                                {formatearHora(res.hora_inicio)} - {formatearHora(res.hora_fin)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {puedeCancelar && res.estatus === 'confirmada' && (
                          <button
                            onClick={() => handleCancelar(res.id)}
                            disabled={cancelando === res.id}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto flex-shrink-0"
                          >
                            {cancelando === res.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                                <span className="text-xs sm:text-sm">Cancelando...</span>
                              </>
                            ) : (
                              <>
                                <X size={16} />
                                <span className="text-xs sm:text-sm">Cancelar</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reservaciones Pasadas */}
          {reservacionesPasadas.length > 0 && (
            <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reservaciones Pasadas</h2>
              <div className="space-y-3" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                {reservacionesPasadas.map((res) => {
                  const fecha = parseISO(res.fecha_reserva);
                  return (
                    <div
                      key={res.id}
                      className="card border-l-4 border-l-gray-300 opacity-75 w-full max-w-full overflow-x-hidden"
                      style={{ maxWidth: '100%', overflowX: 'hidden', position: 'relative', minWidth: 0 }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full" style={{ maxWidth: '100%', minWidth: 0 }}>
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-700 break-words">{res.nombre_clase}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                              res.estatus === 'completada'
                                ? 'bg-blue-100 text-blue-800'
                                : res.estatus === 'cancelada'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {res.estatus}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center gap-1 min-w-0">
                              <Calendar size={14} className="flex-shrink-0" />
                              <span className="break-words">
                                {format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock size={14} />
                              <span>
                                {formatearHora(res.hora_inicio)} - {formatearHora(res.hora_fin)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

