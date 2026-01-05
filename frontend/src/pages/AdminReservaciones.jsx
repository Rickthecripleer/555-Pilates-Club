import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { format, parseISO, addDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Phone, Tag } from 'lucide-react';

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

export default function AdminReservaciones() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [reservaciones, setReservaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReservaciones();
  }, [fechaSeleccionada]);

  const loadReservaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
      const res = await adminAPI.getReservacionesPorDia(fechaStr);
      setReservaciones(res.data || []);
    } catch (error) {
      console.error('Error al cargar reservaciones:', error);
      setError('Error al cargar las reservaciones del día');
    } finally {
      setLoading(false);
    }
  };

  const cambiarDia = (direccion) => {
    setFechaSeleccionada(addDays(fechaSeleccionada, direccion));
  };

  const seleccionarHoy = () => {
    setFechaSeleccionada(new Date());
  };

  // Obtener nombre del día de la semana
  const nombreDia = format(fechaSeleccionada, 'EEEE', { locale: es });
  const fechaFormateada = format(fechaSeleccionada, "d 'de' MMMM 'de' yyyy", { locale: es });

  // Agrupar reservaciones por horario
  const horariosAgrupados = reservaciones.reduce((acc, horario) => {
    const key = `${horario.hora_inicio}-${horario.hora_fin}`;
    if (!acc[key]) {
      acc[key] = {
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        horarios: []
      };
    }
    acc[key].horarios.push(horario);
    return acc;
  }, {});

  const totalReservaciones = reservaciones.reduce((sum, h) => sum + h.total_reservaciones, 0);
  // Contar mensualidad: reservaciones automáticas O reservaciones con tipo_plan = 'mensual'
  const reservacionesAutomaticas = reservaciones.reduce((sum, h) => 
    sum + h.reservaciones.filter(r => 
      r.es_automatica || r.es_mensualidad || r.tipo_plan === 'mensual'
    ).length, 0
  );
  // Contar individuales: solo las que NO son mensualidad
  const reservacionesManuales = reservaciones.reduce((sum, h) => 
    sum + h.reservaciones.filter(r => 
      !r.es_automatica && r.tipo_plan !== 'mensual' && !r.es_mensualidad
    ).length, 0
  );

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div className="w-full sm:w-auto text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Control de Asistencia
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Visualiza las reservaciones del día organizadas por horario
          </p>
        </div>

        {/* Selector de Fecha */}
        <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          <button
            onClick={() => cambiarDia(-1)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Día anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
            <Calendar size={18} className="text-gray-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 capitalize">{nombreDia}</p>
              <p className="text-xs text-gray-600">{fechaFormateada}</p>
            </div>
          </div>
          
          <button
            onClick={() => cambiarDia(1)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Día siguiente"
          >
            <ChevronRight size={20} />
          </button>
          
          {!isSameDay(fechaSeleccionada, new Date()) && (
            <button
              onClick={seleccionarHoy}
              className="px-3 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-600" size={20} />
            <p className="text-sm font-medium text-gray-700">Total Reservaciones</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalReservaciones}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-600" size={20} />
            <p className="text-sm font-medium text-gray-700">Mensualidad</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{reservacionesAutomaticas}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="text-purple-600" size={20} />
            <p className="text-sm font-medium text-gray-700">Individuales</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{reservacionesManuales}</p>
        </div>
      </div>

      {/* Lista de Horarios */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      ) : reservaciones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-600 font-medium">No hay clases programadas para este día</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(horariosAgrupados).map((grupo, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del Horario */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="text-pink-600" size={20} />
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {formatearHora(grupo.hora_inicio)} - {formatearHora(grupo.hora_fin)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-gray-600">Total</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {grupo.horarios.reduce((sum, h) => sum + h.total_reservaciones, 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clases en este horario */}
              <div className="divide-y divide-gray-100">
                {grupo.horarios.map((horario) => (
                  <div key={horario.horario_id} className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                          {horario.nombre_clase}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users size={16} />
                            {horario.total_reservaciones} / {horario.capacidad_maxima}
                          </span>
                          {horario.lugares_disponibles > 0 ? (
                            <span className="text-green-600 font-medium">
                              {horario.lugares_disponibles} lugares disponibles
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">Lleno</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lista de Alumnas */}
                    {horario.reservaciones.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500">No hay reservaciones para esta clase</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {horario.reservaciones.map((reserva) => (
                          <div
                            key={reserva.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              reserva.es_automatica
                                ? 'bg-green-50 border-green-200'
                                : 'bg-purple-50 border-purple-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                                reserva.es_automatica ? 'bg-green-500' : 'bg-purple-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 truncate">
                                    {reserva.nombre_alumna}
                                  </p>
                                  {(reserva.es_automatica || reserva.es_mensualidad || reserva.tipo_plan === 'mensual') && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-200 text-green-800 rounded-full whitespace-nowrap">
                                      Mensualidad
                                    </span>
                                  )}
                                  {!reserva.es_automatica && reserva.tipo_plan !== 'mensual' && !reserva.es_mensualidad && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-200 text-purple-800 rounded-full whitespace-nowrap">
                                      Individual
                                    </span>
                                  )}
                                </div>
                                {reserva.telefono && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Phone size={12} />
                                    <span className="truncate">{reserva.telefono}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                reserva.estatus === 'confirmada'
                                  ? 'bg-blue-100 text-blue-800'
                                  : reserva.estatus === 'completada'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {reserva.estatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


