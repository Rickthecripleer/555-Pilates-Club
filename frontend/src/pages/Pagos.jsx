import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pagosAPI } from '../services/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Upload, CreditCard, CheckCircle, Clock, XCircle, FileImage, X, MessageCircle } from 'lucide-react';
import DatosBancarios from '../components/DatosBancarios';
import { WHATSAPP_NUMBER } from '../config/whatsapp';
import { COSTO_INSCRIPCION } from '../config/constants';

// Configuración de planes
const PLANES = [
  {
    id: 'inscripcion',
    nombre: 'Inscripción',
    precio: COSTO_INSCRIPCION,
    vigencia: 'Pago único',
    descripcion: 'Costo de inscripción (requerida antes de adquirir Mensualidad)',
    tipo_plan: 'inscripcion',
    requiereInscripcion: false, // La inscripción no requiere inscripción previa
  },
  {
    id: 'mensual',
    nombre: 'Mensualidad',
    precio: 980,
    vigencia: '30 días',
            descripcion: 'Acceso ilimitado a todas las clases durante el mes. Puedes reservar cualquier horario disponible y cambiarlo cuando lo necesites',
    tipo_plan: 'mensual',
    requiereInscripcion: true, // Requiere inscripción de $120 (o se agrega automáticamente)
  },
  {
    id: '4-clases',
    nombre: 'Cuatro sesiones semanales',
    precio: 380,
    vigencia: '7 días',
    descripcion: '4 clases que puedes usar durante la semana',
    tipo_plan: 'paquete',
    creditos: 4,
    requiereInscripcion: false, // No requiere inscripción
  },
  {
    id: '3-clases',
    nombre: 'Tres sesiones semanales',
    precio: 280,
    vigencia: '7 días',
    descripcion: '3 clases que puedes usar durante la semana',
    tipo_plan: 'paquete',
    creditos: 3,
    requiereInscripcion: false, // No requiere inscripción
  },
  {
    id: '2-clases',
    nombre: 'Dos sesiones semanales',
    precio: 180,
    vigencia: '7 días',
    descripcion: '2 clases que puedes usar durante la semana',
    tipo_plan: 'paquete',
    creditos: 2,
    requiereInscripcion: false, // No requiere inscripción
  },
  {
    id: 'sesion',
    nombre: 'Sesión Individual',
    precio: 100,
    vigencia: '90 días',
    descripcion: 'Una clase individual que puedes reservar cuando gustes',
    tipo_plan: 'sesion',
    requiereInscripcion: false, // No requiere inscripción
  },
];

export default function Pagos() {
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [mostrarDatosBancarios, setMostrarDatosBancarios] = useState(false);
  const [formData, setFormData] = useState({
    monto: '',
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    metodo_pago: 'transferencia',
    tipo_plan: 'sesion',
    descripcion: '',
  });
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [misPagos, setMisPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [pagoCompletado, setPagoCompletado] = useState(null);
  const [tieneInscripcion, setTieneInscripcion] = useState(false);
  const [verificandoInscripcion, setVerificandoInscripcion] = useState(true);
  

  // Cargar datos cada vez que se navega a esta página
  useEffect(() => {
    loadPagos();
    verificarInscripcion();
  }, [location.pathname]);

  // También verificar cuando la ventana recibe foco (usuario vuelve a la pestaña)
  useEffect(() => {
    const handleFocus = () => {
      verificarInscripcion();
      loadPagos(); // También recargar pagos por si hubo cambios
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const verificarInscripcion = async () => {
    setVerificandoInscripcion(true);
    try {
      const res = await pagosAPI.verificarInscripcion();
      const tieneInscripcionValue = res.data?.tieneInscripcion || false;
      setTieneInscripcion(tieneInscripcionValue);
      console.log('Inscripción verificada:', tieneInscripcionValue, res.data);
    } catch (error) {
      console.error('Error al verificar inscripción:', error);
      setTieneInscripcion(false);
    } finally {
      setVerificandoInscripcion(false);
    }
  };

  const loadPagos = async () => {
    setLoading(true);
    try {
      const res = await pagosAPI.getMisPagos();
      setMisPagos(res.data || []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPlan = async (plan) => {
    // IMPORTANTE: El backend calculará automáticamente si necesita agregar inscripción
    // El frontend solo envía el precio base del plan
    // El backend verificará si tiene inscripción y agregará el costo si es necesario
    
    setPlanSeleccionado(plan);
    setFormData({
      ...formData,
      tipo_plan: plan.tipo_plan,
      monto: plan.precio.toString(), // Enviar solo el precio base, el backend calculará el total
    });
    setMensaje({ tipo: '', texto: '' });
    setArchivo(null);
    setPreview(null);
    setPagoCompletado(null);
    setMostrarDatosBancarios(true);

    // Scroll suave hacia el formulario después de un pequeño delay para que se renderice
    setTimeout(() => {
      const formularioElement = document.getElementById('formulario-pago');
      if (formularioElement) {
        formularioElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMensaje({
          tipo: 'error',
          texto: 'Solo se permiten archivos de imagen',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMensaje({
          tipo: 'error',
          texto: 'El archivo es demasiado grande. Máximo 5MB',
        });
        return;
      }

      setArchivo(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (!archivo) {
      setMensaje({
        tipo: 'error',
        texto: 'Debes subir un comprobante de pago',
      });
      return;
    }

    setSubiendo(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('comprobante', archivo);
      // IMPORTANTE: Enviar solo el precio base del plan, el backend calculará si necesita agregar inscripción
      // Si el frontend ya agregó la inscripción, el backend la agregará de nuevo causando doble cobro
      formDataToSend.append('monto', planSeleccionado?.precio?.toString() || formData.monto);
      formDataToSend.append('fecha_pago', formData.fecha_pago);
      formDataToSend.append('metodo_pago', formData.metodo_pago);
      formDataToSend.append('tipo_plan', formData.tipo_plan);
      if (formData.descripcion) {
        formDataToSend.append('descripcion', formData.descripcion);
      }

      const response = await pagosAPI.subirComprobante(formDataToSend);

      setMensaje({
        tipo: 'success',
        texto: 'Comprobante subido exitosamente. Esperando validación del administrador.',
      });

      // Guardar información del pago para WhatsApp
      setPagoCompletado({
        id: response.data?.pago_id,
        monto: parseFloat(formData.monto),
        tipo_plan: formData.tipo_plan,
        plan_nombre: planSeleccionado?.nombre || formData.tipo_plan,
      });

      // Reset form
      setFormData({
        monto: '',
        fecha_pago: format(new Date(), 'yyyy-MM-dd'),
        metodo_pago: 'transferencia',
        tipo_plan: 'sesion',
        descripcion: '',
      });
      setArchivo(null);
      setPreview(null);
      e.target.reset();

      await loadPagos();
      
      // Actualizar verificación de inscripción después de subir cualquier pago
      // (por si acaso era inscripción)
      await verificarInscripcion();
    } catch (error) {
      console.error('Error al subir comprobante:', error);
      
      // Manejar errores de validación del backend
      if (error.response?.data?.errors) {
        const errores = error.response.data.errors;
        const mensajesErrores = errores.map((err) => err.msg || err.message).join(', ');
        setMensaje({
          tipo: 'error',
          texto: `Errores de validación: ${mensajesErrores}`,
        });
      } else {
        setMensaje({
          tipo: 'error',
          texto: error.response?.data?.message || 'Error al subir el comprobante',
        });
      }
    } finally {
      setSubiendo(false);
    }
  };

  const generarMensajeWhatsApp = () => {
    if (!pagoCompletado) return '';

    // Mensaje sin emojis para evitar problemas de codificación
    const mensaje = `Hola! Acabo de realizar un pago:

*Plan:* ${pagoCompletado.plan_nombre}
*Monto:* $${pagoCompletado.monto.toFixed(2)}
*ID Pago:* ${pagoCompletado.id}

Ya subi el comprobante en el sistema. Por favor, validalo cuando tengas oportunidad.`;

    return encodeURIComponent(mensaje);
  };

  const getEstatusIcon = (estatus) => {
    switch (estatus) {
      case 'completado':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'pendiente':
        return <Clock className="text-yellow-600" size={20} />;
      case 'cancelado':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return null;
    }
  };

  const getEstatusColor = (estatus) => {
    switch (estatus) {
      case 'completado':
        return 'bg-green-100 text-green-700';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] py-4 sm:py-8 px-3 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 sm:mb-4 tracking-tight">
            Elige tu Plan
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-light px-2">
            Selecciona el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        {/* Mensaje informativo sobre inscripción */}
        {!verificandoInscripcion && (
          <div className={`mb-4 sm:mb-6 border rounded-xl sm:rounded-2xl p-4 sm:p-6 ${tieneInscripcion ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {tieneInscripcion ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-0.5" />
                ) : (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-2 sm:ml-3 flex-1">
                <h3 className={`text-base sm:text-lg font-semibold mb-1 ${tieneInscripcion ? 'text-green-800' : 'text-blue-800'}`}>
                  {tieneInscripcion ? 'Inscripción Pagada' : 'Información sobre Inscripción'}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${tieneInscripcion ? 'text-green-700' : 'text-blue-700'}`}>
                  {tieneInscripcion ? (
                    <>
                      <strong>Ya tienes inscripción pagada.</strong> Al comprar <strong>Mensualidad</strong>, solo pagarás <strong>${PLANES.find(p => p.tipo_plan === 'mensual')?.precio || 980}</strong>.
                      <br />
                      <span className="text-xs text-green-600 mt-1 block">La inscripción solo se cobra una vez y es válida de por vida.</span>
                    </>
                  ) : (
                    <>
                      Al comprar el plan de <strong>Mensualidad</strong>, la inscripción de <strong>${COSTO_INSCRIPCION}</strong> se agregará automáticamente al precio total (solo la primera vez). 
                      Puedes cambiar tus horarios o nivel de clase durante el mes si lo necesitas.
                      <br />
                      <span className="text-xs text-blue-600 mt-1 block">Una vez pagada, la inscripción es válida de por vida y no se volverá a cobrar en futuras mensualidades.</span>
                      <br />
                      Los demás planes <strong>no requieren inscripción</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de Planes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {PLANES.filter((plan) => {
            // Ocultar la tarjeta de "Inscripción" si el usuario no tiene inscripción
            // porque se agregará automáticamente a la mensualidad
            if (plan.tipo_plan === 'inscripcion' && !tieneInscripcion && !verificandoInscripcion) {
              return false; // No mostrar inscripción si no la tiene (se agregará automáticamente)
            }
            return true;
          }).map((plan) => {
            // Calcular precio final (incluye inscripción si es mensualidad y no tiene inscripción)
            let precioMostrar = plan.precio;
            if (plan.tipo_plan === 'mensual' && !tieneInscripcion && !verificandoInscripcion) {
              precioMostrar = plan.precio + COSTO_INSCRIPCION;
            }
            
            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-lg transition-all duration-300 flex flex-col border border-slate-100"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-3 tracking-tight">
                  {plan.nombre}
                </h3>
                
                <div className="mb-3 sm:mb-4">
                  {plan.tipo_plan === 'mensual' && !tieneInscripcion && !verificandoInscripcion ? (
                    <div>
                      {/* Precio principal */}
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl sm:text-4xl font-bold text-slate-800">
                          ${precioMostrar}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 ml-1 font-light">MXN</span>
                      </div>
                      {/* Desglose del precio */}
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-2 mt-1.5">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Desglose:</p>
                        <div className="space-y-0.5 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span>Mensualidad:</span>
                            <span className="font-medium">${plan.precio}.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Inscripción:</span>
                            <span className="font-medium">${COSTO_INSCRIPCION}.00</span>
                          </div>
                          <div className="border-t border-pink-200 pt-0.5 mt-0.5 flex justify-between font-bold text-pink-700">
                            <span>Total:</span>
                            <span>${precioMostrar}.00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-bold text-slate-800">
                        ${precioMostrar}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-500 ml-1 font-light">MXN</span>
                    </div>
                  )}
                </div>

                <div className="mb-3 sm:mb-4 flex-grow">
                  <p className="text-xs text-slate-600 mb-1.5 sm:mb-2 font-medium">
                    Vigencia: <span className="text-slate-800">{plan.vigencia}</span>
                  </p>
                  <p className="text-xs text-slate-500 leading-snug font-light line-clamp-3">
                    {plan.descripcion}
                  </p>
                </div>

                <button
                  onClick={() => handleSeleccionarPlan(plan)}
                  className="mt-auto py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm tracking-wide bg-slate-800 text-white hover:bg-slate-700 active:scale-95"
                >
                  Comprar
                </button>
              </div>
            );
          })}
        </div>

        {/* Sección de Datos Bancarios y Formulario */}
        {mostrarDatosBancarios && planSeleccionado && (
          <div id="formulario-pago" className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-10 mb-6 sm:mb-12 border-2 border-pink-200 animate-fade-in">
            <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800 tracking-tight">
                    {planSeleccionado.nombre}
                  </h2>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 font-light">
                  Total a pagar: <span className="font-semibold text-slate-800">${formData.monto} MXN</span>
                  {planSeleccionado.tipo_plan === 'mensual' && !tieneInscripcion && (
                    <span className="text-xs sm:text-sm text-slate-500 block mt-1">
                      (Mensualidad: ${planSeleccionado.precio} + Inscripción: ${COSTO_INSCRIPCION})
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setMostrarDatosBancarios(false);
                  setPlanSeleccionado(null);
                  setPagoCompletado(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg flex-shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Datos Bancarios */}
            <div className="mb-8">
              <DatosBancarios />
            </div>

            {/* Formulario de Pago */}
            {!pagoCompletado ? (
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div>
                  <label htmlFor="fecha_pago" className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Transferencia *
                  </label>
                  <input
                    id="fecha_pago"
                    name="fecha_pago"
                    type="date"
                    value={formData.fecha_pago}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="comprobante" className="block text-sm font-medium text-slate-700 mb-2">
                    Comprobante de Pago *
                  </label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="h-full w-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileImage className="text-slate-400 mb-3" size={48} />
                          <p className="mb-2 text-sm text-slate-500">
                            <span className="font-semibold">Click para subir</span> o arrastra y suelta
                          </p>
                          <p className="text-xs text-slate-400">
                            PNG, JPG, GIF hasta 5MB
                          </p>
                        </div>
                      )}
                      <input
                        id="comprobante"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  {archivo && (
                    <p className="mt-2 text-sm text-slate-600">
                      Archivo seleccionado: {archivo.name} ({(archivo.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={subiendo}
                  className="w-full bg-slate-800 text-white py-3.5 px-6 rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
                >
                  {subiendo ? 'Subiendo...' : 'Subir Comprobante'}
                </button>
              </form>
            ) : (
              /* Mensaje de éxito y botón de WhatsApp */
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5 sm:mt-1" size={20} className="sm:w-6 sm:h-6" />
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-1 sm:mb-2">
                        ¡Comprobante subido exitosamente!
                      </h3>
                      <p className="text-sm sm:text-base text-green-700">
                        Tu comprobante ha sido recibido y está pendiente de validación por parte del administrador.
                        Recibirás una notificación una vez que sea aprobado.
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${generarMensajeWhatsApp()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 sm:gap-3 w-full bg-[#25D366] text-white py-3 sm:py-3.5 px-5 sm:px-6 rounded-lg sm:rounded-xl hover:bg-[#20BA5A] active:scale-[0.98] transition-all duration-200 font-medium text-xs sm:text-sm tracking-wide shadow-sm"
                >
                  <MessageCircle size={18} className="sm:w-5 sm:h-5" />
                  <span className="text-center">Notificar por WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setMostrarDatosBancarios(false);
                    setPlanSeleccionado(null);
                    setPagoCompletado(null);
                    setArchivo(null);
                    setPreview(null);
                  }}
                  className="w-full bg-slate-200 text-slate-700 py-3 px-5 sm:px-6 rounded-lg hover:bg-slate-300 active:scale-[0.98] transition-all duration-200 font-medium text-xs sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Historial de Pagos */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-10 border border-slate-100">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3 tracking-tight">
            <CreditCard className="text-slate-600 flex-shrink-0" size={24} className="sm:w-7 sm:h-7" />
            <span>Historial de Pagos</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-slate-800"></div>
            </div>
          ) : misPagos.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-slate-500">
              <CreditCard size={40} className="sm:w-12 sm:h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm sm:text-base">No tienes pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {misPagos.map((pago) => (
                <div
                  key={pago.id}
                  className="border border-slate-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                        {getEstatusIcon(pago.estatus)}
                        <span
                          className={`px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium rounded-full ${getEstatusColor(
                            pago.estatus
                          )}`}
                        >
                          {pago.estatus}
                        </span>
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full capitalize">
                          {pago.tipo_plan}
                        </span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 sm:mb-2">
                        ${parseFloat(pago.monto).toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 mb-1">
                        {format(parseISO(pago.fecha_pago), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 capitalize mb-1.5 sm:mb-2">
                        {pago.metodo_pago}
                      </p>
                      {pago.fecha_vencimiento_plan && (
                        <p className="text-xs text-slate-500">
                          Vence: {format(parseISO(pago.fecha_vencimiento_plan), "d 'de' MMMM", { locale: es })}
                        </p>
                      )}
                      {pago.comprobante_url && (
                        <a
                          href={`http://localhost:3000${pago.comprobante_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-600 hover:text-slate-800 mt-2 inline-flex items-center gap-1 underline"
                        >
                          <FileImage size={14} />
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
