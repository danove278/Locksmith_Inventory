import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!newUser.username.trim() || !newUser.password) {
      setError('Usuario y contrasena son requeridos');
      return;
    }
    try {
      await createUser(newUser);
      setNewUser({ username: '', password: '', role: 'user' });
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ username: user.username, password: '', role: user.role });
  };

  const saveEdit = async (id) => {
    setError('');
    try {
      const body = { username: editForm.username, role: editForm.role };
      if (editForm.password) body.password = editForm.password;
      await updateUser(id, body);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este usuario?')) return;
    try {
      await deleteUser(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion de Usuarios</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          + Agregar usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay usuarios.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3 font-medium">Usuario</th>
                <th className="pb-3 font-medium">Rol</th>
                <th className="pb-3 font-medium">Fecha creacion</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editingId === u.id;
                return (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3">
                      {isEditing ? (
                        <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="border rounded px-2 py-1 w-40" />
                      ) : (
                        <span className="font-medium">{u.username}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {isEditing ? (
                        <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="border rounded px-2 py-1">
                          <option value="admin">Admin</option>
                          <option value="user">Usuario</option>
                        </select>
                      ) : (
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3 text-right">
                      {isEditing ? (
                        <div className="flex justify-end items-center gap-2">
                          <input
                            type="password"
                            placeholder="Nueva contrasena"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            className="border rounded px-2 py-1 w-36 text-sm"
                          />
                          <button onClick={() => saveEdit(u.id)} className="text-sm text-blue-600 hover:underline">Guardar</button>
                          <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(u)} className="text-sm text-blue-600 hover:underline">Editar</button>
                          <button onClick={() => handleDelete(u.id)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Agregar Usuario</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
