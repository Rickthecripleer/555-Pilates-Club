import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reservacionesAPI, pagosAPI, cambiosHorarioAPI } from '../services/api';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Package, Clock, RefreshCw } from 'lucide-react';
import { format, isAfter, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function Dashboard() {
  const location = useLocation();
  const { user, isAlumna } = useAuth();
  const [acceso, setAcceso] = useState(null);
  const [proximoVencimiento, setProximoVencimiento] = useState(null);
  const [reservacionesProximas, setReservacionesProximas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [infoCambios, setInfoCambios] = useState(null);

  useEffect(() => {
    if (isAlumna()) {
      loadData();
    }
  }, [user, location.pathname]);

  const loadData = async () => {
    try {
      // Verificar acceso
      const accesoRes = await reservacionesAPI.verificarAcceso();
      setAcceso(accesoRes.data);

      // Obtener pagos para encontrar próximo vencimiento
      const pagosRes = await pagosAPI.getMisPagos();
      const pagosActivos = pagosRes.data
        .filter(p => p.estatus === 'completado' && p.fecha_vencimiento_plan)
        .map(p => ({
          ...p,
          fechaVencimiento: parseISO(p.fecha_vencimiento_plan),
        }))
        .sort((a, b) => a.fechaVencimiento - b.fechaVencimiento);

      if (pagosActivos.length > 0) {
        setProximoVencimiento(pagosActivos[0]);
      }

      // Obtener reservaciones próximas (próximos 7 días)
      const fechaDesde = format(new Date(), 'yyyy-MM-dd');
      const fechaHasta = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const reservRes = await reservacionesAPI.getMisReservaciones({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        estatus: 'confirmada',
      });
      setReservacionesProximas(reservRes.data.slice(0, 3));

      // Obtener información de cambios de horario (solo para mensualidad)
      if (proximoVencimiento?.tipo_plan === 'mensual') {
        try {
          const cambiosRes = await cambiosHorarioAPI.getInfo();
          setInfoCambios(cambiosRes.data);
        } catch (error) {
          console.error('Error al obtener info de cambios:', error);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAlumna()) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Panel de Administración</h2>
        <p className="text-gray-600">Bienvenido, {user?.nombre}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Calcular días restantes
  const calcularDiasRestantes = (fechaVencimiento) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    return differenceInDays(vencimiento, hoy);
  };

  // Obtener nombre amigable del plan
  const obtenerNombrePlan = (tipoPlan, monto) => {
    const nombres = {
      'mensual': 'Mensualidad',
      'semanal': 'Plan Semanal',
      'paquete': monto === 180 ? '2 Clases Semanales' : 
                 monto === 280 ? '3 Clases Semanales' : 
                 monto === 380 ? '4 Clases Semanales' : 'Paquete',
      'sesion': 'Sesión Individual',
      'inscripcion': 'Inscripción'
    };
    return nombres[tipoPlan] || tipoPlan;
  };

  const vencimientoProximo = proximoVencimiento && isAfter(proximoVencimiento.fechaVencimiento, new Date());
  const diasRestantes = proximoVencimiento ? calcularDiasRestantes(proximoVencimiento.fechaVencimiento) : null;
  const nombrePlan = proximoVencimiento ? obtenerNombrePlan(proximoVencimiento.tipo_plan, proximoVencimiento.monto) : null;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">
          ¡Hola, {user?.nombre}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center sm:text-left">Bienvenida a tu panel de control</p>
      </div>

      {/* Tarjetas de Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Activo / Vencimiento */}
        {proximoVencimiento ? (
          <div className={`card ${
            vencimientoProximo 
              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
              : diasRestantes <= 3
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
              : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="text-gray-600" size={20} />
                  <p className="text-sm font-medium text-gray-700">
                    Tu Plan Actual
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {nombrePlan}
                </p>
                {diasRestantes !== null && (
                  <div className="mt-3">
                    {diasRestantes > 0 ? (
                      <div className="flex items-center gap-2">
                        <Clock className="text-gray-600" size={16} />
                        <p className="text-sm font-medium text-gray-700">
                          {diasRestantes === 1 
                            ? 'Vence mañana' 
                            : diasRestantes <= 7
                            ? `Te quedan ${diasRestantes} días`
                            : `Vence el ${format(proximoVencimiento.fechaVencimiento, "dd 'de' MMMM", { locale: es })}`
                          }
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-red-700">
                        Tu plan ha vencido
                      </p>
                    )}
                  </div>
                )}
              </div>
              {vencimientoProximo ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={32} />
              ) : (
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={32} />
              )}
            </div>
          </div>
        ) : (
          <div className="card bg-gray-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Plan Activo
                </p>
                <p className="text-lg font-bold text-gray-500">
                  No disponible
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Realiza un pago para activar tu plan
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Reservaciones */}
        <div className={`card ${
          acceso?.tieneAcceso 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-gray-600" size={20} />
                <p className="text-sm font-medium text-gray-700">
                  Estado de Reservaciones
                </p>
              </div>
              <p className={`text-lg font-bold mb-1 ${
                acceso?.tieneAcceso ? 'text-blue-900' : 'text-gray-700'
              }`}>
                {acceso?.tieneAcceso ? 'Puedes reservar' : 'No puedes reservar'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {acceso?.motivo || 'Verificando...'}
              </p>
            </div>
            {acceso?.tieneAcceso ? (
              <CheckCircle className="text-blue-600 flex-shrink-0" size={32} />
            ) : (
              <AlertCircle className="text-gray-400 flex-shrink-0" size={32} />
            )}
          </div>
        </div>
      </div>


      {/* Reservaciones Próximas */}
      {reservacionesProximas.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-pink-600" size={20} />
            <h2 className="text-xl font-bold">Próximas Reservaciones</h2>
          </div>
          <div className="space-y-3">
            {reservacionesProximas.map((res) => (
              <div
                key={res.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{res.nombre_clase}</p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(res.fecha_reserva), "EEEE, d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatearHora(res.hora_inicio)} - {formatearHora(res.hora_fin)}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-pink-100 text-pink-700 rounded">
                  {res.estatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información sobre mensualidad y cambios de horario */}
      {proximoVencimiento?.tipo_plan === 'mensual' && (
        <div className="card bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-pink-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Plan Mensual Activo
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                Con tu plan mensual tienes acceso ilimitado a todas las clases durante el mes. Puedes reservar cualquier clase disponible y cambiar de horario si lo necesitas (tienes 1 cambio permitido por mes).
              </p>
              
              {infoCambios && (
                <div className={`mt-3 p-3 rounded-lg ${
                  infoCambios.puedeCambiar 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className={infoCambios.puedeCambiar ? 'text-blue-600' : 'text-yellow-600'} size={18} />
                    <p className={`text-sm font-semibold ${
                      infoCambios.puedeCambiar ? 'text-blue-900' : 'text-yellow-900'
                    }`}>
                      Cambios de Horario Disponibles
                    </p>
                  </div>
                    <p className={`text-xs ${
                      infoCambios.puedeCambiar ? 'text-blue-800' : 'text-yellow-800'
                    }`}>
                      {infoCambios.puedeCambiar 
                        ? `Tienes ${infoCambios.cambiosDisponibles} cambio de horario disponible. Si tienes un imprevisto, puedes cancelar tus reservaciones y reservar en otro horario.`
                        : 'Ya usaste tu cambio de horario permitido. Puedes seguir reservando clases normalmente.'
                      }
                    </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





