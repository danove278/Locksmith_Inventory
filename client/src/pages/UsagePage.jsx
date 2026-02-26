import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { registerUsage, getUsageHistory, updateUsageRecord, deleteUsageRecord, toggleFlag } from '../api';
import { useAuth } from '../context/AuthContext';
import KeySearchSelect from '../components/KeySearchSelect';

function todayString() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function UsagePage() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [history, setHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(todayString());
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const { refreshAlerts } = useOutletContext();
  const { isAdmin } = useAuth();

  const loadHistory = () => {
    getUsageHistory(filterDate).then(setHistory).catch(() => {});
  };

  useEffect(() => { loadHistory(); }, [filterDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim() || !year || !selectedKey) {
      setMessage({ type: 'error', text: 'Todos los campos son requeridos' });
      return;
    }
    const qty = quantity === '' ? 1 : parseInt(quantity);
    if (qty < 1 || qty > 5) {
      setMessage({ type: 'error', text: 'La cantidad debe ser entre 1 y 5' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerUsage({
        accessory_id: selectedKey.id,
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year),
        quantity: qty,
      });
      setMessage({
        type: 'success',
        text: result.alert
          ? `Uso registrado (${qty}). ALERTA: Stock bajo en "${result.accessory.name}" (quedan ${result.accessory.quantity})`
          : `Uso registrado (${qty}). Quedan ${result.accessory.quantity} unidades de "${result.accessory.name}"`,
      });
      setBrand('');
      setModel('');
      setYear('');
      setQuantity('');
      setSelectedKey(null);
      loadHistory();
      refreshAlerts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFlag = async (id) => {
    try {
      await toggleFlag(id);
      loadHistory();
    } catch { /* ignore */ }
  };

  const handleDeleteRecord = async (id) => {
    if (!confirm('Eliminar este registro? Se restaurara el stock.')) return;
    try {
      await deleteUsageRecord(id);
      loadHistory();
      refreshAlerts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const startEdit = (rec) => {
    setEditingId(rec.id);
    setEditForm({ brand: rec.brand, model: rec.model, year: rec.year, quantity: rec.quantity || 1 });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    try {
      await updateUsageRecord(id, editForm);
      setEditingId(null);
      loadHistory();
      refreshAlerts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro de Uso</h2>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej: Toyota"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej: Corolla"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ej: 2024"
                min="1900"
                max="2100"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de llaves *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 1"
                min="1"
                max="5"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <KeySearchSelect value={selectedKey} onChange={setSelectedKey} />

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Registrar uso'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Ventas del {new Date(filterDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay registros de uso para esta fecha.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-2 py-3 w-10"></th>
                <th className="px-3 py-3 font-medium">Llave</th>
                <th className="px-3 py-3 font-medium">Marca</th>
                <th className="px-3 py-3 font-medium">Modelo</th>
                <th className="px-3 py-3 font-medium">Ano</th>
                <th className="px-3 py-3 font-medium text-center">Cant.</th>
                <th className="px-3 py-3 font-medium">Hora</th>
                <th className="px-3 py-3 font-medium">Usuario</th>
                {isAdmin && <th className="px-3 py-3 font-medium text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {history.map((rec) => {
                const isEditing = editingId === rec.id;
                return (
                  <tr key={rec.id} className={`border-b last:border-0 ${rec.flagged ? 'bg-red-50' : ''}`}>
                    <td className="px-2 py-3 text-center">
                      <button onClick={() => handleToggleFlag(rec.id)} title={rec.flagged ? 'Quitar bandera' : 'Marcar error'}>
                        {rec.flagged ? (
                          <span className="text-red-500 text-lg">&#9873;</span>
                        ) : (
                          <span className="text-gray-300 hover:text-red-400 text-lg">&#9872;</span>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium">{rec.accessory_name}</td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input type="text" value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} className="w-full border rounded px-2 py-1" />
                      ) : rec.brand}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input type="text" value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className="w-full border rounded px-2 py-1" />
                      ) : rec.model}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input type="number" value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) || '' })} className="w-20 border rounded px-2 py-1" />
                      ) : rec.year}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isEditing ? (
                        <input type="number" min="1" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })} className="w-16 border rounded px-2 py-1 text-center" />
                      ) : (rec.quantity || 1)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {new Date(rec.used_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">{rec.user_name || '—'}</td>
                    {isAdmin && (
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(rec.id)} className="text-sm text-blue-600 hover:underline mr-2">Guardar</button>
                            <button onClick={cancelEdit} className="text-sm text-gray-500 hover:underline">Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(rec)} className="text-sm text-blue-600 hover:underline mr-2">Editar</button>
                            <button onClick={() => handleDeleteRecord(rec.id)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
