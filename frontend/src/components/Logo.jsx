import { useState, useEffect } from 'react';

/**
 * Componente Logo - 555 Pilates Club
 * 
 * INSTRUCCIONES PARA AGREGAR EL LOGO:
 * 1. Coloca tu logo en: frontend/public/logo-555-pilates.png
 * 2. El logo debe ser circular o cuadrado (se mostrará en un círculo)
 * 3. Tamaño recomendado: 200x200px o mayor (alta resolución)
 * 4. Formato: PNG con fondo transparente o con fondo rosa claro
 * 
 * El componente automáticamente detectará si existe el archivo y lo mostrará.
 * Si no existe, mostrará un placeholder con el texto "555 Pilates Club"
 */

export default function Logo({ size = 'md', className = '' }) {
  const [logoExists, setLogoExists] = useState(false);

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const logoSize = sizes[size] || sizes.md;
  const textSize = textSizes[size] || textSizes.md;

  // Verificar si el logo existe
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoExists(true);
    img.onerror = () => setLogoExists(false);
    img.src = '/logo-555-pilates.png';
  }, []);

  return (
    <div className={`${logoSize} rounded-full bg-pink-200 flex items-center justify-center shadow-sm ${className}`}>
      {logoExists ? (
        <img 
          src="/logo-555-pilates.png" 
          alt="555 Pilates Club Salina Cruz"
          className="w-full h-full object-contain rounded-full"
        />
      ) : (
        <div className="text-center flex flex-col items-center justify-center">
          <div className={`font-bold text-pink-700 mb-1 ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : size === 'xl' ? 'text-5xl' : 'text-3xl'}`}>
            555
          </div>
          <div className={`font-semibold text-pink-600 uppercase tracking-wide ${textSize}`}>
            Pilates Club
          </div>
        </div>
      )}
    </div>
  );
}
