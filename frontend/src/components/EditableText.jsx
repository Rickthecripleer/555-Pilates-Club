import { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EditableText({ 
  value, 
  onSave, 
  seccion, 
  campo, 
  tipo = 'texto',
  className = '',
  as: Component = 'p',
  placeholder = 'Escribe aquí...',
  modoEdicion = false
}) {
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  // Actualizar el valor cuando cambie la prop
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  // Si modoEdicion se desactiva o no es admin, cerrar edición
  useEffect(() => {
    if ((!modoEdicion || !isAdmin()) && isEditing) {
      setIsEditing(false);
    }
  }, [modoEdicion, isAdmin]);

  const handleSave = async () => {
    // Verificar que sea admin antes de guardar
    if (!isAdmin()) {
      alert('No tienes permisos para editar');
      setIsEditing(false);
      return;
    }

    if (editValue === value) {
      // No hay cambios, solo cerrar edición
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(seccion, campo, editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      let errorMessage = 'Error al guardar los cambios';
      
      if (error?.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Mensaje más amigable
      if (errorMessage.includes('tabla') || errorMessage.includes('table')) {
        errorMessage = 'La base de datos no está configurada. Por favor contacta al administrador del sistema.';
      }
      
      alert(`Error: ${errorMessage}`);
      // Restaurar el valor original en caso de error
      setEditValue(value || '');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  // Solo mostrar opciones de edición si es admin y modoEdicion está activo
  const puedeEditar = isAdmin() && modoEdicion;

  if (!isEditing) {
    const displayValue = value || placeholder;
    return (
      <div className={`group relative ${className}`}>
        <Component className="inline">{displayValue}</Component>
        {puedeEditar && (
          <button
            onClick={() => {
              setEditValue(value || '');
              setIsEditing(true);
            }}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 text-sm"
            title="Editar"
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {tipo === 'texto' || tipo === 'descripcion' ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y min-h-[80px]"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder={placeholder}
        />
      )}
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          title="Guardar"
        >
          <Save size={16} />
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
          title="Cancelar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

