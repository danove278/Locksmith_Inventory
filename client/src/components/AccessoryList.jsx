import { useState } from 'react';

export default function AccessoryList({ accessories, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (acc) => {
    setEditingId(acc.id);
    setEditForm({ quantity: acc.quantity, min_quantity: acc.min_quantity });
  };

  const saveEdit = async (id) => {
    await onUpdate(id, editForm);
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  if (accessories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay accesorios en el inventario. Agrega uno para comenzar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-3 font-medium">Nombre</th>
            <th className="pb-3 font-medium">Descripcion</th>
            <th className="pb-3 font-medium text-center">Cantidad</th>
            <th className="pb-3 font-medium text-center">Min. Alerta</th>
            <th className="pb-3 font-medium text-center">Estado</th>
            <th className="pb-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accessories.map((acc) => {
            const isLow = acc.min_quantity > 0 && acc.quantity <= acc.min_quantity;
            const isEditing = editingId === acc.id;
            return (
              <tr key={acc.id} className={`border-b last:border-0 ${isLow ? 'bg-amber-50' : ''}`}>
                <td className="py-3 font-medium">{acc.name}</td>
                <td className="py-3 text-gray-500 text-sm">{acc.description || '—'}</td>
                <td className="py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-20 border rounded px-2 py-1 text-center"
                    />
                  ) : (
                    <span className={isLow ? 'text-amber-700 font-bold' : ''}>{acc.quantity}</span>
                  )}
                </td>
                <td className="py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editForm.min_quantity}
                      onChange={(e) => setEditForm({ ...editForm, min_quantity: parseInt(e.target.value) || 0 })}
                      className="w-20 border rounded px-2 py-1 text-center"
                    />
                  ) : (
                    acc.min_quantity
                  )}
                </td>
                <td className="py-3 text-center">
                  {isLow ? (
                    <span className="inline-block bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-full">
                      Stock bajo
                    </span>
                  ) : (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      OK
                    </span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveEdit(acc.id)} className="text-sm text-blue-600 hover:underline">
                        Guardar
                      </button>
                      <button onClick={cancelEdit} className="text-sm text-gray-500 hover:underline">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(acc)} className="text-sm text-blue-600 hover:underline">
                        Editar
                      </button>
                      <button onClick={() => onDelete(acc.id)} className="text-sm text-red-600 hover:underline">
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
