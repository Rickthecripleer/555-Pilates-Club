import { useState, useEffect, useRef } from 'react';
import { Heart, Users, Sparkles, Award, Shield, Scale, Users2, Eye, MapPin, Phone, Facebook, MessageCircle, Edit2, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contenidoAPI } from '../services/api';
import EditableText from '../components/EditableText';

export default function Nosotros() {
  const { isAdmin } = useAuth();
  const [contenido, setContenido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageVersion, setImageVersion] = useState(Date.now()); // Para forzar re-render de imágenes
  const fileInputHeroRef = useRef(null);
  const fileInputIntroduccionRef = useRef(null);

  useEffect(() => {
    cargarContenido();
  }, []);

  const cargarContenido = async () => {
    try {
      const response = await contenidoAPI.obtenerContenido();
      if (response.success) {
        setContenido(response.data);
      }
    } catch (error) {
      console.error('Error al cargar contenido:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (seccion, campo, nuevoContenido) => {
    try {
      const response = await contenidoAPI.actualizarContenido(seccion, campo, nuevoContenido);
      
      if (!response.success) {
        throw new Error(response.message || 'Error al guardar');
      }

      // Actualizar el estado local inmediatamente
      setContenido(prev => {
        const nuevoEstado = { ...prev };
        if (!nuevoEstado[seccion]) {
          nuevoEstado[seccion] = {};
        }
        nuevoEstado[seccion][campo] = {
          tipo: 'imagen',
          contenido: nuevoContenido,
          orden: 0
        };
        return nuevoEstado;
      });
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      throw error;
    }
  };

  // Función helper para obtener la URL base del backend
  const getBackendUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      const apiUrl = import.meta.env.VITE_API_URL;
      // Si es una URL completa, extraer el dominio
      if (apiUrl.startsWith('http')) {
        try {
          const url = new URL(apiUrl);
          return `${url.protocol}//${url.host}`;
        } catch (e) {
          return apiUrl.replace('/api', '');
        }
      }
      return apiUrl.replace('/api', '');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return `http://${window.location.hostname}:3000`;
  };

  // Función helper para obtener contenido con fallback
  const obtenerContenido = (seccion, campo, fallback = '') => {
    const valor = contenido?.[seccion]?.[campo]?.contenido || fallback;
    // Para imágenes, construir URL y agregar timestamp para evitar caché
    if (campo === 'imagen' && valor) {
      let imageUrl = valor;
      
      // Si es una ruta relativa que empieza con /uploads/, construir URL completa del backend
      if (valor.startsWith('/uploads/')) {
        const backendUrl = getBackendUrl();
        // Construir URL completa y agregar timestamp único para forzar refresh
        imageUrl = `${backendUrl}${valor}?v=${imageVersion}&t=${Date.now()}`;
      } else if (valor.startsWith('http')) {
        // Si ya es una URL completa, agregar timestamp para forzar refresh
        imageUrl = `${valor}?v=${imageVersion}&t=${Date.now()}`;
      } else {
        // Si no es una ruta conocida, construir URL completa del backend
        const backendUrl = getBackendUrl();
        imageUrl = `${backendUrl}${valor}?v=${imageVersion}&t=${Date.now()}`;
      }
      
      return imageUrl;
    }
    return valor;
  };

  // Manejar edición de imagen - abre directamente el explorador
  const handleEditarImagen = (seccion, campo, inputRef) => {
    if (inputRef && inputRef.current) {
      // Resetear el input para permitir seleccionar el mismo archivo de nuevo
      inputRef.current.value = '';
      inputRef.current.click();
    } else {
      console.error('Input ref no está disponible para:', seccion, campo);
    }
  };

  // Manejar subida de archivo
  const handleSubirImagen = async (e, seccion, campo) => {
    const file = e.target.files?.[0];
    if (!file) {
      // Resetear el input
      e.target.value = '';
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      e.target.value = '';
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      formData.append('seccion', seccion);
      formData.append('campo', campo);

      const response = await contenidoAPI.subirImagen(formData);
      
      if (response.success) {
        const newUrl = response.data.url;
        
        // Actualizar el estado local inmediatamente con la nueva URL
        setContenido(prev => {
          const nuevoEstado = { ...prev };
          if (!nuevoEstado[seccion]) nuevoEstado[seccion] = {};
          nuevoEstado[seccion][campo] = {
            tipo: 'imagen',
            contenido: newUrl,
            orden: 0
          };
          return nuevoEstado;
        });
        
        // Forzar actualización de imágenes con timestamp único
        const timestamp = Date.now();
        setImageVersion(timestamp);
        
        // Recargar contenido completo para asegurar sincronización
        await cargarContenido();
        
        // Forzar refresh de la imagen después de un pequeño delay
        setTimeout(() => {
          setImageVersion(Date.now());
        }, 200);
        
        // Forzar otro refresh después de que se haya cargado el contenido
        setTimeout(() => {
          setImageVersion(Date.now() + 1);
        }, 500);
        
        alert('Imagen actualizada correctamente');
      } else {
        throw new Error(response.message || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      let errorMessage = 'Error al subir la imagen. Intenta de nuevo.';
      
      if (error?.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setUploading(false);
      // Resetear el input
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex flex-col">
      {/* Hero Section - Moderno y Responsivo */}
      <section className="relative w-full h-[60vh] min-h-[400px] md:h-[70vh] md:min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
          <img
              key={`hero-${imageVersion}-${contenido?.hero?.imagen?.contenido || 'default'}`}
              src={obtenerContenido('hero', 'imagen', '/images/nosotros-hero.jpg')}
            alt="Estudio de Pilates"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) {
                e.target.nextElementSibling.style.display = 'flex';
              }
            }}
          />
          <div className="hidden absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-200 items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto text-pink-600" size={80} />
              <p className="mt-4 text-pink-700 text-lg">Imagen del estudio</p>
            </div>
            </div>
          </div>
        </div>
        
        {/* Input file oculto para hero - Fuera del contenedor de imagen */}
        {isAdmin() && modoEdicion && (
          <>
            <input
              ref={fileInputHeroRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleSubirImagen(e, 'hero', 'imagen')}
              className="hidden"
              id="file-input-hero"
            />
            <div className="absolute top-4 right-4 z-50" style={{ zIndex: 10000, position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditarImagen('hero', 'imagen', fileInputHeroRef);
                }}
                disabled={uploading}
                className="bg-white hover:bg-pink-50 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-pink-600 border-2 border-pink-300 transition-all disabled:opacity-50"
                title="Editar imagen"
                type="button"
              >
                <Edit2 size={16} />
                <span>{uploading ? 'Subiendo...' : 'Editar Imagen'}</span>
              </button>
            </div>
          </>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-0"></div>
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-3xl shadow-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-slate-800 mb-3 md:mb-4 break-words">
                Sobre Nosotros
              </h1>
              <nav className="text-xs sm:text-sm text-slate-600">
                <span className="text-pink-600">Inicio</span>
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 flex-grow">
        {/* Botón de edición para admin */}
        {isAdmin() && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setModoEdicion(!modoEdicion)}
              className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md ${
                modoEdicion
                  ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-pink-200'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Edit2 size={16} className="inline mr-2" />
              {modoEdicion ? 'Salir de Edición' : 'Modo Edición'}
            </button>
          </div>
        )}

        {/* Introducción - Layout Moderno */}
        <section className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            {isAdmin() && modoEdicion ? (
              <EditableText
                value={obtenerContenido('introduccion', 'titulo_principal', 'Descubre una nueva experiencia en Pilates')}
                onSave={handleGuardar}
                seccion="introduccion"
                campo="titulo_principal"
                tipo="titulo"
                className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 md:mb-6 break-words"
                as="h2"
                modoEdicion={modoEdicion}
              />
            ) : (
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 md:mb-6 break-words">
                {obtenerContenido('introduccion', 'titulo_principal', 'Descubre una nueva experiencia en Pilates')}
            </h2>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Imagen */}
            <div className="order-2 md:order-1 relative">
                <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px]">
                  <img
                    key={`intro-img-${imageVersion}-${contenido?.introduccion?.imagen?.contenido || 'default'}`}
                    src={obtenerContenido('introduccion', 'imagen', '/images/nosotros-estudio.jpg')}
                alt="Estudio de Pilates"
                  className="w-full h-full object-cover rounded-2xl shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextElementSibling) {
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
                <div className="hidden w-full h-full bg-gradient-to-br from-pink-100 to-rose-200 rounded-2xl shadow-lg items-center justify-center">
                <div className="text-center">
                  <Users className="mx-auto text-pink-600" size={60} />
                  <p className="mt-4 text-pink-700">Imagen del estudio</p>
                </div>
                </div>
                {/* Input file oculto para introduccion */}
                {isAdmin() && modoEdicion && (
                  <>
                    <input
                      ref={fileInputIntroduccionRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSubirImagen(e, 'introduccion', 'imagen')}
                      className="hidden"
                      id="file-input-introduccion"
                    />
                    <div className="absolute top-2 right-2 z-50" style={{ zIndex: 9999 }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditarImagen('introduccion', 'imagen', fileInputIntroduccionRef);
                        }}
                        disabled={uploading}
                        className="bg-white hover:bg-pink-50 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-pink-600 border-2 border-pink-300 transition-all disabled:opacity-50"
                        title="Editar imagen"
                        type="button"
                      >
                        <Edit2 size={16} />
                        <span>{uploading ? 'Subiendo...' : 'Editar'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Textos editables */}
            <div className="space-y-4 md:space-y-6 order-1 md:order-2">
              <div>
                {isAdmin() && modoEdicion ? (
                  <EditableText
                    value={obtenerContenido('introduccion', 'titulo_secundario', 'Un refugio de armonía y movimiento')}
                    onSave={handleGuardar}
                    seccion="introduccion"
                    campo="titulo_secundario"
                    tipo="titulo"
                    className="text-2xl sm:text-3xl md:text-4xl font-serif text-slate-800 mb-4 md:mb-6 break-words"
                    as="h3"
                    modoEdicion={modoEdicion}
                  />
                ) : (
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-slate-800 mb-4 md:mb-6 break-words">
                    {obtenerContenido('introduccion', 'titulo_secundario', 'Un refugio de armonía y movimiento')}
                  </h3>
                )}
              </div>
              
              {isAdmin() && modoEdicion ? (
                <EditableText
                  value={obtenerContenido('introduccion', 'parrafo_1', 'En nuestro estudio de Pilates ofrecemos una experiencia de bienestar integral basada en el método Pilates. Nos enfocamos en el movimiento consciente, la armonía corporal y el crecimiento personal, dentro de un ambiente sofisticado, cálido y lleno de intención.')}
                  onSave={handleGuardar}
                  seccion="introduccion"
                  campo="parrafo_1"
                  tipo="descripcion"
                  className="text-base sm:text-lg text-slate-700 leading-relaxed break-words"
                  as="p"
                  modoEdicion={modoEdicion}
                />
              ) : (
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed break-words">
                  {obtenerContenido('introduccion', 'parrafo_1', 'En nuestro estudio de Pilates ofrecemos una experiencia de bienestar integral basada en el método Pilates. Nos enfocamos en el movimiento consciente, la armonía corporal y el crecimiento personal, dentro de un ambiente sofisticado, cálido y lleno de intención.')}
                </p>
              )}
              
              {isAdmin() && modoEdicion ? (
                <EditableText
                  value={obtenerContenido('introduccion', 'parrafo_2', 'Nuestra misión es acompañarte en el camino hacia una conexión profunda entre cuerpo, mente y esencia, a través de atención personalizada, profesionalismo y espacios que invitan al equilibrio. Cultivamos el detalle, la empatía y la inclusión.')}
                  onSave={handleGuardar}
                  seccion="introduccion"
                  campo="parrafo_2"
                  tipo="descripcion"
                  className="text-base sm:text-lg text-slate-700 leading-relaxed break-words"
                  as="p"
                  modoEdicion={modoEdicion}
                />
              ) : (
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed break-words">
                  {obtenerContenido('introduccion', 'parrafo_2', 'Nuestra misión es acompañarte en el camino hacia una conexión profunda entre cuerpo, mente y esencia, a través de atención personalizada, profesionalismo y espacios que invitan al equilibrio. Cultivamos el detalle, la empatía y la inclusión.')}
                </p>
              )}

              {/* Lista de características */}
              <ul className="space-y-3 mt-6">
                {[1, 2, 3].map((num) => (
                  <li key={num} className="flex items-start gap-3">
                  <Sparkles className="text-pink-600 mt-1 flex-shrink-0" size={20} />
                    {isAdmin() && modoEdicion ? (
                      <EditableText
                        value={obtenerContenido('introduccion', `lista_item_${num}`, `Característica ${num}`)}
                        onSave={handleGuardar}
                        seccion="introduccion"
                        campo={`lista_item_${num}`}
                        tipo="texto"
                        className="text-base text-slate-700 flex-1 break-words"
                        as="span"
                        modoEdicion={modoEdicion}
                      />
                    ) : (
                      <span className="text-base text-slate-700 break-words">
                        {obtenerContenido('introduccion', `lista_item_${num}`, `Característica ${num}`)}
                      </span>
                    )}
                </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Clases - Grid Responsivo */}
        <section className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            {isAdmin() && modoEdicion ? (
              <EditableText
                value={obtenerContenido('clases', 'titulo', 'Nuestras Clases')}
                onSave={handleGuardar}
                seccion="clases"
                campo="titulo"
                tipo="titulo"
                className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 break-words"
                as="h2"
                modoEdicion={modoEdicion}
              />
            ) : (
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 break-words">
                {obtenerContenido('clases', 'titulo', 'Nuestras Clases')}
            </h2>
            )}
            {isAdmin() && modoEdicion ? (
              <EditableText
                value={obtenerContenido('clases', 'subtitulo', 'Diferentes modalidades para todos los niveles')}
                onSave={handleGuardar}
                seccion="clases"
                campo="subtitulo"
                tipo="texto"
                className="text-lg sm:text-xl text-slate-600 break-words"
                as="p"
                modoEdicion={modoEdicion}
              />
            ) : (
              <p className="text-lg sm:text-xl text-slate-600 break-words">
                {obtenerContenido('clases', 'subtitulo', 'Diferentes modalidades para todos los niveles')}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-300">
                {isAdmin() && modoEdicion ? (
                  <EditableText
                    value={obtenerContenido('clases', `clase_${num}_nombre`, `Clase ${num}`)}
                    onSave={handleGuardar}
                    seccion="clases"
                    campo={`clase_${num}_nombre`}
                    tipo="titulo"
                    className="text-xl sm:text-2xl font-serif text-slate-800 mb-3 md:mb-4 break-words"
                    as="h3"
                    modoEdicion={modoEdicion}
                  />
                ) : (
                  <h3 className="text-xl sm:text-2xl font-serif text-slate-800 mb-3 md:mb-4 break-words">
                    {obtenerContenido('clases', `clase_${num}_nombre`, `Clase ${num}`)}
                  </h3>
                )}
                {isAdmin() && modoEdicion ? (
                  <EditableText
                    value={obtenerContenido('clases', `clase_${num}_descripcion`, 'Descripción de la clase')}
                    onSave={handleGuardar}
                    seccion="clases"
                    campo={`clase_${num}_descripcion`}
                    tipo="descripcion"
                    className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4 break-words"
                    as="p"
                    modoEdicion={modoEdicion}
                  />
                ) : (
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4 break-words">
                    {obtenerContenido('clases', `clase_${num}_descripcion`, 'Descripción de la clase')}
                  </p>
                )}
                {isAdmin() && modoEdicion ? (
                  <div className="text-sm text-pink-600 font-medium">
                    Horarios:{' '}
                    <EditableText
                      value={obtenerContenido('clases', `clase_${num}_horarios`, 'Consultar horarios')}
                      onSave={handleGuardar}
                      seccion="clases"
                      campo={`clase_${num}_horarios`}
                      tipo="texto"
                      className="inline break-words"
                      as="span"
                      modoEdicion={modoEdicion}
                    />
                </div>
                ) : (
                  <div className="text-sm text-pink-600 font-medium break-words">
                    Horarios: {obtenerContenido('clases', `clase_${num}_horarios`, 'Consultar horarios')}
                </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Características - Grid Responsivo */}
        <section className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            {isAdmin() && modoEdicion ? (
              <EditableText
                value={obtenerContenido('caracteristicas', 'titulo', 'Características del Estudio')}
                onSave={handleGuardar}
                seccion="caracteristicas"
                campo="titulo"
                tipo="titulo"
                className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 break-words"
                as="h2"
                modoEdicion={modoEdicion}
              />
            ) : (
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 break-words">
                {obtenerContenido('caracteristicas', 'titulo', 'Características del Estudio')}
            </h2>
            )}
            {isAdmin() && modoEdicion ? (
              <EditableText
                value={obtenerContenido('caracteristicas', 'subtitulo', 'Lo que nos hace únicos')}
                onSave={handleGuardar}
                seccion="caracteristicas"
                campo="subtitulo"
                tipo="texto"
                className="text-lg sm:text-xl text-slate-600 break-words"
                as="p"
                modoEdicion={modoEdicion}
              />
            ) : (
              <p className="text-lg sm:text-xl text-slate-600 break-words">
                {obtenerContenido('caracteristicas', 'subtitulo', 'Lo que nos hace únicos')}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Award, num: 1 },
              { icon: Heart, num: 2 },
              { icon: Scale, num: 3 },
              { icon: Users2, num: 4 },
              { icon: Shield, num: 5 },
              { icon: Eye, num: 6 }
            ].map(({ icon: Icon, num }) => (
              <div key={num} className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <Icon className="text-pink-600 mb-4" size={36} />
                {isAdmin() && modoEdicion ? (
                  <EditableText
                    value={obtenerContenido('caracteristicas', `item_${num}_titulo`, `Característica ${num}`)}
                    onSave={handleGuardar}
                    seccion="caracteristicas"
                    campo={`item_${num}_titulo`}
                    tipo="titulo"
                    className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 break-words"
                    as="h3"
                    modoEdicion={modoEdicion}
                  />
                ) : (
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 break-words">
                    {obtenerContenido('caracteristicas', `item_${num}_titulo`, `Característica ${num}`)}
                  </h3>
                )}
                {isAdmin() && modoEdicion ? (
                  <EditableText
                    value={obtenerContenido('caracteristicas', `item_${num}_descripcion`, 'Descripción')}
                    onSave={handleGuardar}
                    seccion="caracteristicas"
                    campo={`item_${num}_descripcion`}
                    tipo="texto"
                    className="text-sm sm:text-base text-slate-600 break-words"
                    as="p"
                    modoEdicion={modoEdicion}
                  />
                ) : (
                  <p className="text-sm sm:text-base text-slate-600 break-words">
                    {obtenerContenido('caracteristicas', `item_${num}_descripcion`, 'Descripción')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Nuestros Valores - Grid Responsivo */}
        <section className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            {isAdmin() && modoEdicion ? (
              <EditableText
                value={obtenerContenido('valores', 'titulo', 'Nuestros Valores')}
                onSave={handleGuardar}
                seccion="valores"
                campo="titulo"
                tipo="titulo"
                className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 break-words"
                as="h2"
                modoEdicion={modoEdicion}
              />
            ) : (
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-800 mb-4 break-words">
                {obtenerContenido('valores', 'titulo', 'Nuestros Valores')}
            </h2>
            )}
            {isAdmin() && modoEdicion ? (
              <EditableText
                value={obtenerContenido('valores', 'subtitulo', 'Conecta contigo, transforma tu cuerpo y eleva tu esencia')}
                onSave={handleGuardar}
                seccion="valores"
                campo="subtitulo"
                tipo="texto"
                className="text-lg sm:text-xl text-slate-600 break-words"
                as="p"
                modoEdicion={modoEdicion}
              />
            ) : (
              <p className="text-lg sm:text-xl text-slate-600 break-words">
                {obtenerContenido('valores', 'subtitulo', 'Conecta contigo, transforma tu cuerpo y eleva tu esencia')}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Award, num: 1 },
              { icon: Heart, num: 2 },
              { icon: Scale, num: 3 },
              { icon: Users2, num: 4 },
              { icon: Shield, num: 5 },
              { icon: Eye, num: 6 }
            ].map(({ icon: Icon, num }) => (
              <div key={num} className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <Icon className="text-pink-600 mb-4" size={36} />
                {isAdmin() && modoEdicion ? (
                  <EditableText
                    value={obtenerContenido('valores', `valor_${num}_titulo`, `Valor ${num}`)}
                    onSave={handleGuardar}
                    seccion="valores"
                    campo={`valor_${num}_titulo`}
                    tipo="titulo"
                    className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 break-words"
                    as="h3"
                    modoEdicion={modoEdicion}
                  />
                ) : (
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 break-words">
                    {obtenerContenido('valores', `valor_${num}_titulo`, `Valor ${num}`)}
                  </h3>
                )}
                {isAdmin() && modoEdicion ? (
                  <EditableText
                    value={obtenerContenido('valores', `valor_${num}_descripcion`, 'Descripción del valor')}
                    onSave={handleGuardar}
                    seccion="valores"
                    campo={`valor_${num}_descripcion`}
                    tipo="texto"
                    className="text-sm sm:text-base text-slate-600 break-words"
                    as="p"
                    modoEdicion={modoEdicion}
                  />
                ) : (
                  <p className="text-sm sm:text-base text-slate-600 break-words">
                    {obtenerContenido('valores', `valor_${num}_descripcion`, 'Descripción del valor')}
                  </p>
                )}
          </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer - Ya actualizado */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-800 text-white mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mb-10">
            {/* Logo y Descripción */}
            <div className="lg:col-span-1">
              <h3 className="text-2xl lg:text-3xl font-serif mb-4 text-white font-bold">555 Pilates Club</h3>
              <p className="text-sm text-white/70 leading-relaxed mb-4 break-words">
                Tu espacio de bienestar y movimiento consciente. Transforma tu cuerpo, mente y esencia.
              </p>
              {/* Redes Sociales */}
              <div className="flex gap-4 mt-6">
                <a
                  href="https://www.instagram.com/555.pilatesclub/?igsh=amtjbjR2ZjN1Zndr&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-all hover:scale-110 transform duration-200"
                  aria-label="Instagram"
                >
                  <Instagram size={20} className="text-white" />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61585251038690&mibextid=wwXIfr&rdid=fLTuDXG3UFMOohGl&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1ZfDBzWb6P%2F%3Fmibextid%3DwwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-all hover:scale-110 transform duration-200"
                  aria-label="Facebook"
                >
                  <Facebook size={20} className="text-white" />
                </a>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-base font-semibold mb-5 text-white uppercase tracking-wide text-sm">Contacto</h4>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-1 flex-shrink-0 text-pink-400" size={18} />
                  <span className="text-white/80 text-sm leading-relaxed break-words">
                    Francisco I Madero, Colonia Hidalgo Oriente<br />
                    CP 70610, Salina Cruz, Oaxaca
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-1 flex-shrink-0 text-pink-400" size={18} />
                  <a 
                    href="tel:529711158933" 
                    className="text-white/80 hover:text-pink-400 transition-colors text-sm break-words"
                  >
                    971 115 8933
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <a
                    href="https://wa.me/529711158933"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-500 flex items-center justify-center transition-all hover:scale-110 transform duration-200"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle size={20} className="text-white" />
                  </a>
                  <span className="text-white/80 text-sm">WhatsApp</span>
                </li>
              </ul>
            </div>

            {/* Navegación */}
            <div>
              <h4 className="text-base font-semibold mb-5 text-white uppercase tracking-wide text-sm">Navegación</h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/" 
                    className="text-white/80 hover:text-pink-400 transition-colors text-sm inline-block hover:translate-x-1 transform duration-200"
                  >
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/reservaciones" 
                    className="text-white/80 hover:text-pink-400 transition-colors text-sm inline-block hover:translate-x-1 transform duration-200"
                  >
                    Reservar Clase
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/pagos" 
                    className="text-white/80 hover:text-pink-400 transition-colors text-sm inline-block hover:translate-x-1 transform duration-200"
                  >
                    Planes y Pagos
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/panel" 
                    className="text-white/80 hover:text-pink-400 transition-colors text-sm inline-block hover:translate-x-1 transform duration-200"
                  >
                    Panel de Control
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Línea divisoria y copyright */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-white/50 text-sm text-center sm:text-left break-words">
                © {new Date().getFullYear()} 555 Pilates Club. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

