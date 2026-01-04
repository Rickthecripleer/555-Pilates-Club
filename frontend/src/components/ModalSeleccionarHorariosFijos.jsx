import { useState, useEffect } from 'react';
import { horariosFijosAPI } from '../services/api';
import { format, addDays } from 'date-fns';
import { X, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

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

const diasSemanaNombres = {
  'lunes': 'Lunes',
  'martes': 'Martes',
  'miercoles': 'Miércoles',
  'jueves': 'Jueves',
  'viernes': 'Viernes',
  'sabado': 'Sábado',
  'domingo': 'Domingo'
};

export default function ModalSeleccionarHorariosFijos({ 
  pago, 
  fechaInicio, 
  fechaFin, 
  onClose, 
  onSuccess 
}) {
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarHorarios();
  }, []);

  const cargarHorarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const fechaInicioStr = format(fechaInicio, 'yyyy-MM-dd');
      const fechaFinStr = format(fechaFin, 'yyyy-MM-dd');
      
      const res = await horariosFijosAPI.getDisponibles('mensual', fechaInicioStr, fechaFinStr);
      setHorariosDisponibles(res.data || []);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      setError('Error al cargar los horarios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarHorario = (horarioId) => {
    if (horariosSeleccionados.includes(horarioId)) {
      // Deseleccionar
      setHorariosSeleccionados(horariosSeleccionados.filter(id => id !== horarioId));
    } else {
      // Seleccionar (máximo 2)
      if (horariosSeleccionados.length < 2) {
        setHorariosSeleccionados([...horariosSeleccionados, horarioId]);
      } else {
        setError('Solo puedes seleccionar 2 horarios diferentes');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleGuardar = async () => {
    if (horariosSeleccionados.length !== 2) {
      setError('Debes seleccionar exactamente 2 horarios diferentes');
      return;
    }

    // Verificar que los horarios sean diferentes
    if (horariosSeleccionados[0] === horariosSeleccionados[1]) {
      setError('Los dos horarios deben ser diferentes');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      await horariosFijosAPI.crearHorariosFijos(pago.id, horariosSeleccionados);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error al crear horarios fijos:', error);
      setError(error.response?.data?.message || 'Error al crear los horarios fijos');
    } finally {
      setGuardando(false);
    }
  };

  // Agrupar horarios por día de la semana
  const horariosPorDia = horariosDisponibles.reduce((acc, horario) => {
    if (!acc[horario.dia_semana]) {
      acc[horario.dia_semana] = [];
    }
    acc[horario.dia_semana].push(horario);
    return acc;
  }, {});

  const ordenDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-pink-600" size={24} />
              Selecciona tus 2 Horarios Fijos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Elige 2 horarios diferentes que se repetirán automáticamente durante tu plan mensual
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="animate-spin text-pink-600" size={32} />
            </div>
          ) : (
            <>
              {/* Información de selección */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-blue-600" size={20} />
                  <p className="font-semibold text-blue-900">
                    Horarios seleccionados: {horariosSeleccionados.length} / 2
                  </p>
                </div>
                {horariosSeleccionados.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {horariosSeleccionados.map((horarioId) => {
                      const horario = horariosDisponibles.find(h => h.id === horarioId);
                      if (!horario) return null;
                      return (
                        <p key={horarioId} className="text-sm text-blue-800">
                          • {diasSemanaNombres[horario.dia_semana]} {formatearHora(horario.hora_inicio)} - {horario.nombre_clase}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lista de horarios por día */}
              <div className="space-y-6">
                {ordenDias.map((dia) => {
                  const horariosDelDia = horariosPorDia[dia] || [];
                  if (horariosDelDia.length === 0) return null;

                  return (
                    <div key={dia} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                          {diasSemanaNombres[dia]}
                        </h3>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {horariosDelDia.map((horario) => {
                          const estaSeleccionado = horariosSeleccionados.includes(horario.id);
                          const estaDisponible = horario.disponible !== false;

                          return (
                            <button
                              key={horario.id}
                              onClick={() => estaDisponible && handleSeleccionarHorario(horario.id)}
                              disabled={!estaDisponible || (horariosSeleccionados.length >= 2 && !estaSeleccionado)}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${
                                estaSeleccionado
                                  ? 'border-pink-600 bg-pink-50 shadow-md'
                                  : estaDisponible
                                  ? 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50'
                                  : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                              } ${
                                !estaDisponible || (horariosSeleccionados.length >= 2 && !estaSeleccionado)
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {formatearHora(horario.hora_inicio)} - {formatearHora(horario.hora_fin)}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {horario.nombre_clase}
                                  </p>
                                </div>
                                {estaSeleccionado && (
                                  <CheckCircle className="text-pink-600 flex-shrink-0 ml-2" size={20} />
                                )}
                              </div>
                              {!estaDisponible && (
                                <p className="text-xs text-red-600 mt-2">
                                  No disponible
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {horariosDisponibles.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="mx-auto mb-2" size={32} />
                  <p>No hay horarios disponibles para este período</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || horariosSeleccionados.length !== 2}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {guardando ? (
              <>
                <Loader className="animate-spin" size={18} />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Guardar Horarios Fijos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


