import { useState, useEffect } from 'react';

export default function DatosBancarios() {
  const [datosBancarios, setDatosBancarios] = useState({
    banco: 'BBVA',
    cuenta: '153 492 8787',
    tarjeta: '4152 3144 3073 4171',
    titular: 'SODELVA MORALES',
    referencia: '555 Pilates Club',
  });

  // Opcional: Cargar desde API
  useEffect(() => {
    // Si quieres cargar desde el backend:
    // fetch('/api/config/bancario')
    //   .then(res => res.json())
    //   .then(data => setDatosBancarios(data))
    //   .catch(err => console.error(err));
  }, []);

  const [copiado, setCopiado] = useState(null);

  const copiarAlPortapapeles = (texto, label) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(label);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Datos para Transferencia
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
          <span className="font-medium text-slate-700">Banco:</span>
          <span className="text-slate-800 font-medium">{datosBancarios.banco}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
          <span className="font-medium text-slate-700">Titular:</span>
          <span className="text-slate-800 font-medium">{datosBancarios.titular}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
          <span className="font-medium text-slate-700">Número de cuenta:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-800 font-mono font-medium">{datosBancarios.cuenta}</span>
            <button
              onClick={() => copiarAlPortapapeles(datosBancarios.cuenta.replace(/\s/g, ''), 'cuenta')}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all ${
                copiado === 'cuenta'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 border border-slate-200'
              }`}
              title="Copiar Número de cuenta"
            >
              {copiado === 'cuenta' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
          <span className="font-medium text-slate-700">Número de tarjeta:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-800 font-mono font-medium">{datosBancarios.tarjeta}</span>
            <button
              onClick={() => copiarAlPortapapeles(datosBancarios.tarjeta.replace(/\s/g, ''), 'tarjeta')}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all ${
                copiado === 'tarjeta'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 border border-slate-200'
              }`}
              title="Copiar Número de tarjeta"
            >
              {copiado === 'tarjeta' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <div className="py-2">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-slate-700">Referencia:</span>
          </div>
          <p className="text-xs text-slate-600 italic">
            Escribe tu nombre completo en la referencia de la transferencia
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-4 pt-4 border-t border-slate-200">
        <strong>Importante:</strong> En la referencia de la transferencia, escribe tu nombre completo para facilitar la identificación de tu pago.
      </p>
    </div>
  );
}

