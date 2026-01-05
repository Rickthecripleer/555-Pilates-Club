// Función helper centralizada para obtener la URL base del backend
export const getBackendUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL.trim();
    
    // Si es una URL completa, extraer el dominio
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      try {
        const url = new URL(apiUrl);
        return `${url.protocol}//${url.host}`;
      } catch (e) {
        // Si falla el parsing, intentar extraer manualmente
        const match = apiUrl.match(/^(https?:\/\/[^\/]+)/);
        if (match) {
          return match[1];
        }
        // Si tiene /api al final, quitarlo
        return apiUrl.replace(/\/api\/?$/, '');
      }
    }
    
    // Si no empieza con http pero contiene onrender.com, agregar https://
    if (apiUrl.includes('onrender.com')) {
      const cleanUrl = apiUrl.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '');
      return `https://${cleanUrl}`;
    }
    
    // Si no empieza con http pero es una URL válida, agregar https://
    if (apiUrl.includes('.') && !apiUrl.includes('localhost')) {
      const cleanUrl = apiUrl.replace(/\/api\/?$/, '');
      return `https://${cleanUrl}`;
    }
    
    // Si tiene /api al final, quitarlo
    return apiUrl.replace(/\/api\/?$/, '');
  }
  
  // Fallback para desarrollo local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Fallback para producción: intentar inferir del hostname actual
  if (window.location.hostname.includes('onrender.com')) {
    // Si el frontend está en onrender, el backend probablemente también
    // Intentar construir la URL del backend basándose en el patrón
    return `https://${window.location.hostname.replace('pilates-frontend', 'five55-pilates-club').replace('frontend', 'backend')}`;
  }
  
  return `http://${window.location.hostname}:3000`;
};

