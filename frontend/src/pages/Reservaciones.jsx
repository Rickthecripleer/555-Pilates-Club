import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { clasesAPI, reservacionesAPI } from '../services/api';
import { format, parseISO, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const diasSemanaCorto = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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

export default function Reservaciones() {
  const [clases, setClases] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [acceso, setAcceso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar datos cuando cambia la fecha o cuando se navega a esta página
  useEffect(() => {
    loadAcceso();
    loadClases();
  }, [fechaSeleccionada, location.pathname]);

  const loadAcceso = async () => {
    try {
      const res = await reservacionesAPI.verificarAcceso();
      setAcceso(res.data);
    } catch (error) {
      console.error('Error al verificar acceso:', error);
    }
  };

  const loadClases = async () => {
    setLoading(true);
    try {
      const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
      const res = await clasesAPI.getDisponibles({ fecha: fechaStr });
      setClases(res.data || []);
    } catch (error) {
      console.error('Error al cargar clases:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar clases disponibles' });
    } finally {
      setLoading(false);
    }
  };

  const handleReservar = async (horarioId) => {
    if (!acceso?.tieneAcceso) {
      setMensaje({
        tipo: 'error',
        texto: 'No tienes acceso para reservar. Realiza un pago para activar tu plan.',
      });
      return;
    }

    setCreando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
      await reservacionesAPI.crearReservacion(horarioId, fechaStr);
      
      setMensaje({
        tipo: 'success',
        texto: '¡Reservación creada exitosamente!',
      });
      
      // Recargar datos
      await Promise.all([loadClases(), loadAcceso()]);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al crear la reservación',
      });
    } finally {
      setCreando(false);
    }
  };

  // Generar fechas de la semana actual
  const inicioSemana = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 });
  const fechasSemana = eachDayOfInterval({
    start: inicioSemana,
    end: addDays(inicioSemana, 6),
  });

  const cambiarSemana = (direccion) => {
    setFechaSeleccionada(addDays(fechaSeleccionada, direccion * 7));
  };

  const seleccionarFecha = (fecha) => {
    setFechaSeleccionada(fecha);
  };

  // Agrupar clases por horario
  const clasesAgrupadas = clases.reduce((acc, clase) => {
    const key = `${clase.horario_id}-${clase.hora_inicio}`;
    if (!acc[key]) {
      acc[key] = {
        horario_id: clase.horario_id,
        nombre_clase: clase.nombre_clase,
        descripcion: clase.descripcion,
        hora_inicio: clase.hora_inicio,
        hora_fin: clase.hora_fin,
        lugares_disponibles: clase.lugares_disponibles,
        capacidad_maxima: clase.capacidad_maxima,
        reservaciones_actuales: clase.reservaciones_actuales,
      };
    }
    return acc;
  }, {});

  const clasesLista = Object.values(clasesAgrupadas);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">Reservar Clase</h1>
        <p className="text-sm sm:text-base text-gray-600 text-center sm:text-left">Selecciona una fecha y horario disponible</p>
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

      {/* Estado de Acceso */}
      {acceso && !acceso.tieneAcceso && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-900 mb-1">
                No puedes hacer reservaciones
              </p>
              <p className="text-sm text-yellow-700">{acceso.motivo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Fecha */}
      <div className="card w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="text-pink-600" size={18} />
            <span>Seleccionar Fecha</span>
          </h2>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={() => cambiarSemana(-1)}
              className="btn-secondary text-xs sm:text-sm px-3 sm:px-4"
            >
              ← Semana anterior
            </button>
            <button
              onClick={() => cambiarSemana(1)}
              className="btn-secondary text-xs sm:text-sm px-3 sm:px-4"
            >
              Semana siguiente →
            </button>
          </div>
        </div>

        {/* Calendario Semanal */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4 w-full max-w-full overflow-x-hidden">
          {fechasSemana.map((fecha, index) => {
            const esHoy = format(fecha, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const esSeleccionada =
              format(fecha, 'yyyy-MM-dd') === format(fechaSeleccionada, 'yyyy-MM-dd');
            const diaSemana = diasSemana[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1];
            const esFinDeSemana = diaSemana === 'sabado' || diaSemana === 'domingo';

            return (
              <button
                key={index}
                onClick={() => !esFinDeSemana && seleccionarFecha(fecha)}
                disabled={esFinDeSemana}
                className={`p-2 sm:p-3 rounded-lg text-center transition-all w-full min-w-0 ${
                  esSeleccionada
                    ? 'bg-pink-600 text-white'
                    : esHoy && !esFinDeSemana
                    ? 'bg-pink-100 text-pink-700 border-2 border-pink-300'
                    : esFinDeSemana
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
                title={esFinDeSemana ? 'No hay clases los fines de semana' : ''}
              >
                <p className="text-[10px] sm:text-xs font-medium mb-1">
                  {diasSemanaCorto[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]}
                </p>
                <p className="text-sm sm:text-lg font-bold">{format(fecha, 'd')}</p>
              </button>
            );
          })}
        </div>

        <p className="text-xs sm:text-sm text-gray-600 text-center break-words">
          {format(fechaSeleccionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Lista de Clases Disponibles */}
      <div className="card w-full max-w-full overflow-x-hidden">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="text-pink-600" size={20} />
          Clases Disponibles
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          </div>
        ) : clasesLista.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
            <p>
              {['sabado', 'domingo'].includes(format(fechaSeleccionada, 'EEEE', { locale: es }).toLowerCase()) 
                ? 'No hay clases disponibles los fines de semana. Las clases son de lunes a viernes.'
                : 'No hay clases disponibles para esta fecha'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clasesLista.map((clase) => (
              <div
                key={clase.horario_id}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow w-full max-w-full overflow-x-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">
                      {clase.nombre_clase}
                    </h3>
                    {clase.descripcion && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">{clase.descripcion}</p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="flex-shrink-0" />
                        <span className="font-medium">
                          {formatearHora(clase.hora_inicio)} - {formatearHora(clase.hora_fin)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} className="flex-shrink-0" />
                        <span>
                          {clase.lugares_disponibles} de {clase.capacidad_maxima} lugares
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReservar(clase.horario_id)}
                    disabled={!acceso?.tieneAcceso || creando || clase.lugares_disponibles === 0}
                    className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4"
                  >
                    {creando ? 'Reservando...' : 'Reservar'}
                  </button>
                </div>

                {/* Indicador de disponibilidad */}
                {clase.lugares_disponibles > 0 && clase.lugares_disponibles <= 3 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-yellow-600">
                    <AlertCircle size={16} />
                    <span>Quedan pocos lugares disponibles</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}





