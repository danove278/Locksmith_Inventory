import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAccessories, addAccessory, updateAccessory, deleteAccessory } from '../api';
import AccessoryList from '../components/AccessoryList';
import AddAccessoryModal from '../components/AddAccessoryModal';

export default function InventoryPage() {
  const [accessories, setAccessories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { refreshAlerts } = useOutletContext();

  const load = async () => {
    try {
      const data = await getAccessories();
      setAccessories(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (form) => {
    await addAccessory(form);
    await load();
    refreshAlerts();
  };

  const handleUpdate = async (id, form) => {
    await updateAccessory(id, form);
    await load();
    refreshAlerts();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este accesorio?')) return;
    await deleteAccessory(id);
    await load();
    refreshAlerts();
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Agregar accesorio
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <AccessoryList accessories={accessories} onUpdate={handleUpdate} onDelete={handleDelete} />
      </div>

      {showModal && (
        <AddAccessoryModal onClose={() => setShowModal(false)} onSave={handleAdd} />
      )}
    </div>
  );
}
