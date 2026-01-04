import axios from 'axios';

// Detectar si estamos en localhost o en la red
const getApiUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos en localhost, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  
  // Si estamos en la red (IP local), usar la misma IP pero puerto 3000
  const hostname = window.location.hostname;
  return `http://${hostname}:3000/api`;
};

const API_BASE_URL = getApiUrl();

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTENTICACIÓN ====================

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

// ==================== CLASES ====================

export const clasesAPI = {
  getDisponibles: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.dia_semana) params.append('dia_semana', filters.dia_semana);
    if (filters.hora_inicio) params.append('hora_inicio', filters.hora_inicio);
    if (filters.hora_fin) params.append('hora_fin', filters.hora_fin);
    if (filters.fecha) params.append('fecha', filters.fecha);
    
    const response = await api.get(`/clases/disponibles?${params.toString()}`);
    return response.data;
  },
};

// ==================== RESERVACIONES ====================

export const reservacionesAPI = {
  verificarAcceso: async () => {
    const response = await api.get('/reservaciones/verificar-acceso');
    return response.data;
  },
  
  getMisReservaciones: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.estatus) params.append('estatus', filters.estatus);
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    
    const response = await api.get(`/reservaciones/mis-reservaciones?${params.toString()}`);
    return response.data;
  },
  
  crearReservacion: async (horario_id, fecha_reserva) => {
    const response = await api.post('/reservaciones', {
      horario_id,
      fecha_reserva,
    });
    return response.data;
  },
  
  cancelarReservacion: async (reservacionId) => {
    const response = await api.put(`/reservaciones/${reservacionId}/cancelar`);
    return response.data;
  },
};

// ==================== CAMBIOS DE HORARIO ====================

export const cambiosHorarioAPI = {
  getInfo: async () => {
    const response = await api.get('/cambios-horario/info');
    return response.data;
  },
  
  registrar: async (horarioAnteriorId, horarioNuevoId, motivo) => {
    const response = await api.post('/cambios-horario/registrar', {
      horario_anterior_id: horarioAnteriorId,
      horario_nuevo_id: horarioNuevoId,
      motivo: motivo
    });
    return response.data;
  },
};

// ==================== PAGOS ====================

export const pagosAPI = {
  verificarInscripcion: async () => {
    const response = await api.get('/pagos/verificar-inscripcion');
    return response.data;
  },
  
  getMisPagos: async () => {
    const response = await api.get('/pagos/mis-pagos');
    return response.data;
  },
  
  subirComprobante: async (formData) => {
    const response = await api.post('/pagos/comprobante', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Endpoints de admin
  getPagosPendientes: async () => {
    const response = await api.get('/admin/pagos/pendientes');
    return response.data;
  },
  
  getAllPagos: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.estatus) params.append('estatus', filters.estatus);
    const response = await api.get(`/admin/pagos?${params.toString()}`);
    return response.data;
  },
  
  validarPago: async (pagoId, aprobar) => {
    const response = await api.put(`/admin/pagos/${pagoId}/validar`, { aprobar });
    return response.data;
  },
};

// ==================== HORARIOS FIJOS ====================

export const horariosFijosAPI = {
  verificarNecesidad: async () => {
    const response = await api.get('/horarios-fijos/verificar-necesidad');
    return response.data;
  },
  
  crearHorariosFijos: async (pagoId, horariosIds) => {
    const response = await api.post('/horarios-fijos/crear', {
      pago_id: pagoId,
      horarios_ids: horariosIds
    });
    return response.data;
  },
  
  getDisponibles: async (tipoPlan, fechaInicio, fechaFin) => {
    const params = new URLSearchParams();
    params.append('tipo_plan', tipoPlan);
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    const response = await api.get(`/horarios-fijos/disponibles?${params.toString()}`);
    return response.data;
  },
  
  getMisHorariosFijos: async () => {
    const response = await api.get('/horarios-fijos/mis-horarios');
    return response.data;
  },
};

// ==================== ADMIN - ALUMNAS ====================

export const adminAPI = {
  getAlumnas: async () => {
    const response = await api.get('/admin/alumnas');
    return response.data;
  },
  
  getAlumna: async (alumnaId) => {
    const response = await api.get(`/admin/alumnas/${alumnaId}`);
    return response.data;
  },
  
  registrarAlumnaRapida: async (datos) => {
    const response = await api.post('/admin/alumnas/registro-rapido', datos);
    return response.data;
  },
  
  registrarPagoEfectivo: async (alumnaId, datosPago) => {
    // Preparar datos para enviar horarios_seleccionados correctamente
    const datosEnvio = {
      ...datosPago,
      horarios_seleccionados: datosPago.horarios_seleccionados || undefined
    };
    const response = await api.post(`/admin/alumnas/${alumnaId}/pago-efectivo`, datosEnvio);
    return response.data;
  },
  
  crearReservacionAlumna: async (alumnaId, horarioId, fechaReserva) => {
    const response = await api.post(`/admin/alumnas/${alumnaId}/reservacion`, {
      horario_id: horarioId,
      fecha_reserva: fechaReserva,
    });
    return response.data;
  },
  
  getClasesDisponibles: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.fecha) params.append('fecha', filters.fecha);
    if (filters.dia_semana) params.append('dia_semana', filters.dia_semana);
    
    const response = await api.get(`/clases/disponibles?${params.toString()}`);
    return response.data;
  },
  
  getReservacionesPorDia: async (fecha) => {
    const response = await api.get(`/admin/reservaciones/dia?fecha=${fecha}`);
    return response.data;
  },
  
  getResumenReservaciones: async (fechaInicio, fechaFin) => {
    const response = await api.get(`/admin/reservaciones/resumen?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
    return response.data;
  },
};

// ==================== CONTENIDO NOSOTROS ====================

export const contenidoAPI = {
  obtenerContenido: async () => {
    const response = await api.get('/contenido/nosotros');
    return response.data;
  },
  
  obtenerContenidoPorSeccion: async (seccion) => {
    const response = await api.get(`/contenido/nosotros/${seccion}`);
    return response.data;
  },
  
  // Endpoints de admin
  actualizarContenido: async (seccion, campo, contenido) => {
    const response = await api.put('/admin/contenido/nosotros', {
      seccion,
      campo,
      contenido
    });
    return response.data;
  },
  
  actualizarContenidoMultiple: async (actualizaciones) => {
    const response = await api.put('/admin/contenido/nosotros/multiple', {
      actualizaciones
    });
    return response.data;
  },
  
  subirImagen: async (formData) => {
    const response = await api.post('/admin/contenido/nosotros/imagen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
