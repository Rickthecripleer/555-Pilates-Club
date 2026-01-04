import { useState, useEffect } from 'react';
import { pagosAPI } from '../services/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, User, DollarSign, Calendar, FileImage } from 'lucide-react';

// Función para obtener el nombre descriptivo del plan
const getNombrePlan = (tipoPlan) => {
  const nombres = {
    'inscripcion': 'Inscripción',
    'mensual': 'Mensualidad',
    'semanal': 'Plan Semanal',
    'paquete': 'Paquete de Clases',
    'sesion': 'Clase Individual'
  };
  return nombres[tipoPlan] || tipoPlan;
};

export default function AdminPagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [filtro, setFiltro] = useState('pendientes'); // pendientes, todos

  useEffect(() => {
    loadPagos();
  }, [filtro]);

  const loadPagos = async () => {
    setLoading(true);
    try {
      let res;
      if (filtro === 'pendientes') {
        res = await pagosAPI.getPagosPendientes();
      } else {
        res = await pagosAPI.getAllPagos();
      }
      setPagos(res.data || []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidar = async (pagoId, aprobar) => {
    if (!window.confirm(
      aprobar
        ? '¿Estás seguro de aprobar este pago? Se activará el plan para la alumna.'
        : '¿Estás seguro de rechazar este pago?'
    )) {
      return;
    }

    setProcesando(pagoId);
    try {
      await pagosAPI.validarPago(pagoId, aprobar);
      await loadPagos(); // Recargar lista
    } catch (error) {
      console.error('Error al validar pago:', error);
      alert(error.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pagos</h1>
        <p className="text-gray-600">Revisa y valida los comprobantes de pago</p>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltro('pendientes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'pendientes'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'todos'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Lista de Pagos */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-1">
              {filtro === 'pendientes'
                ? 'No hay pagos pendientes'
                : 'No hay pagos registrados'}
            </p>
            <p className="text-sm">
              {filtro === 'pendientes'
                ? 'Todos los pagos han sido procesados'
                : 'Aún no se han registrado pagos'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagos.map((pago) => (
              <div
                key={pago.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Información del Pago */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded ${
                              pago.estatus === 'pendiente'
                                ? 'bg-yellow-100 text-yellow-700'
                                : pago.estatus === 'completado'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {pago.estatus}
                          </span>
                          <span className="px-3 py-1 text-sm font-medium bg-pink-100 text-pink-700 rounded capitalize">
                            {pago.tipo_plan}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          Pago de {getNombrePlan(pago.tipo_plan)}
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">
                          ${parseFloat(pago.monto).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={18} />
                        <div>
                          <p className="font-medium text-gray-900">{pago.alumna_nombre || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{pago.alumna_email || ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={18} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(parseISO(pago.fecha_pago), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {pago.metodo_pago}
                          </p>
                        </div>
                      </div>
                    </div>

                    {pago.descripcion && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Descripción:</p>
                        <p>{pago.descripcion}</p>
                      </div>
                    )}

                    {pago.comprobante_url && (
                      <div>
                        <a
                          href={`http://localhost:3000${pago.comprobante_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
                        >
                          <FileImage size={18} />
                          Ver comprobante
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Acciones (solo para pendientes) */}
                  {pago.estatus === 'pendiente' && (
                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:min-w-[200px]">
                      <button
                        onClick={() => handleValidar(pago.id, true)}
                        disabled={procesando === pago.id}
                        className="btn-primary flex items-center justify-center gap-2"
                      >
                        {procesando === pago.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Aprobar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleValidar(pago.id, false)}
                        disabled={procesando === pago.id}
                        className="btn-danger flex items-center justify-center gap-2"
                      >
                        {procesando === pago.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <XCircle size={18} />
                            Rechazar
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Estado procesado */}
                  {pago.estatus !== 'pendiente' && (
                    <div className="flex items-center gap-2 text-sm">
                      {pago.estatus === 'completado' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="font-medium">Pago aprobado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle size={20} />
                          <span className="font-medium">Pago rechazado</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

