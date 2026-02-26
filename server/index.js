import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import db from './db.js';
import { authenticate, requireRole, JWT_SECRET } from './auth.js';



const app = express();
//const PORT = 3001;
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());

// ==================== AUTH ====================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contrasena son requeridos' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcryptjs.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// ==================== USERS (admin only) ====================

app.get('/api/users', authenticate, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at').all();
  res.json(rows);
});

app.post('/api/users', authenticate, requireRole('admin'), (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contrasena son requeridos' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'El nombre de usuario ya existe' });
  }
  const hashed = bcryptjs.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
    .run(username.trim(), hashed, role || 'user');
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

app.put('/api/users/:id', authenticate, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  if (username && username !== existing.username) {
    const duplicate = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
    if (duplicate) return res.status(400).json({ error: 'El nombre de usuario ya existe' });
  }
  const newUsername = username ? username.trim() : existing.username;
  const newPassword = password ? bcryptjs.hashSync(password, 10) : existing.password;
  const newRole = role || existing.role;
  db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?')
    .run(newUsername, newPassword, newRole, id);
  const updated = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/users/:id', authenticate, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  if (existing.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
    if (adminCount.count <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el ultimo administrador' });
    }
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Usuario eliminado' });
});

// ==================== ACCESSORIES ====================

app.get('/api/accessories', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM accessories ORDER BY name').all();
  res.json(rows);
});

app.get('/api/accessories/search', authenticate, (req, res) => {
  const q = req.query.q || '';
  const rows = db
    .prepare('SELECT * FROM accessories WHERE name LIKE ? AND quantity > 0 ORDER BY name')
    .all(`%${q}%`);
  res.json(rows);
});

app.get('/api/accessories/alerts', authenticate, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM accessories WHERE min_quantity > 0 AND quantity <= min_quantity ORDER BY name')
    .all();
  res.json(rows);
});

app.post('/api/accessories', authenticate, requireRole('admin'), (req, res) => {
  const { name, description, quantity, min_quantity } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  const result = db
    .prepare('INSERT INTO accessories (name, description, quantity, min_quantity) VALUES (?, ?, ?, ?)')
    .run(name.trim(), description || '', quantity || 0, min_quantity || 0);
  const accessory = db.prepare('SELECT * FROM accessories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(accessory);
});

app.put('/api/accessories/:id', authenticate, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { name, description, quantity, min_quantity } = req.body;
  const existing = db.prepare('SELECT * FROM accessories WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Accesorio no encontrado' });
  }
  db.prepare('UPDATE accessories SET name = ?, description = ?, quantity = ?, min_quantity = ? WHERE id = ?')
    .run(
      name !== undefined ? name.trim() : existing.name,
      description !== undefined ? description : existing.description,
      quantity !== undefined ? quantity : existing.quantity,
      min_quantity !== undefined ? min_quantity : existing.min_quantity,
      id
    );
  const updated = db.prepare('SELECT * FROM accessories WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/accessories/:id', authenticate, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM accessories WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Accesorio no encontrado' });
  }
  db.prepare('DELETE FROM usage_records WHERE accessory_id = ?').run(id);
  db.prepare('DELETE FROM accessories WHERE id = ?').run(id);
  res.json({ message: 'Accesorio eliminado' });
});

// ==================== USAGE RECORDS ====================

app.post('/api/usage', authenticate, (req, res) => {
  const { accessory_id, brand, model, year, quantity } = req.body;
  const qty = parseInt(quantity) || 1;
  if (!accessory_id || !brand || !model || !year) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (qty < 1) {
    return res.status(400).json({ error: 'La cantidad debe ser al menos 1' });
  }
  const accessory = db.prepare('SELECT * FROM accessories WHERE id = ?').get(accessory_id);
  if (!accessory) {
    return res.status(404).json({ error: 'Accesorio no encontrado' });
  }
  if (accessory.quantity < qty) {
    return res.status(400).json({ error: `Stock insuficiente. Disponibles: ${accessory.quantity}` });
  }

  const registerUsage = db.transaction(() => {
    db.prepare('UPDATE accessories SET quantity = quantity - ? WHERE id = ?').run(qty, accessory_id);
    db.prepare("INSERT INTO usage_records (accessory_id, brand, model, year, quantity, user_id, used_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))")
      .run(accessory_id, brand.trim(), model.trim(), year, qty, req.user.id);
  });
  registerUsage();

  const updatedAccessory = db.prepare('SELECT * FROM accessories WHERE id = ?').get(accessory_id);
  const alert = updatedAccessory.min_quantity > 0 && updatedAccessory.quantity <= updatedAccessory.min_quantity;
  res.status(201).json({ message: 'Uso registrado', accessory: updatedAccessory, alert });
});

app.get('/api/usage', authenticate, (req, res) => {
  const { date } = req.query;
  const dateFilter = date || null;
  const isAdmin = req.user.role === 'admin';
  const userFilter = isAdmin ? '' : 'AND ur.user_id = ?';
  const query = `
    SELECT ur.*, a.name as accessory_name, u.username as user_name
    FROM usage_records ur
    JOIN accessories a ON ur.accessory_id = a.id
    LEFT JOIN users u ON ur.user_id = u.id
    WHERE DATE(ur.used_at, 'localtime') = ${dateFilter ? '?' : "DATE('now', 'localtime')"}
    ${userFilter}
    ORDER BY ur.used_at DESC
  `;
  const params = [];
  if (dateFilter) params.push(dateFilter);
  if (!isAdmin) params.push(req.user.id);
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.put('/api/usage/:id', authenticate, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { brand, model, year, quantity } = req.body;
  const existing = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }
  const newQty = parseInt(quantity) || existing.quantity;
  const qtyDiff = newQty - existing.quantity;

  const updateUsage = db.transaction(() => {
    if (qtyDiff !== 0) {
      const accessory = db.prepare('SELECT * FROM accessories WHERE id = ?').get(existing.accessory_id);
      if (accessory.quantity - qtyDiff < 0) {
        throw new Error(`Stock insuficiente para ajustar. Disponibles: ${accessory.quantity}`);
      }
      db.prepare('UPDATE accessories SET quantity = quantity - ? WHERE id = ?').run(qtyDiff, existing.accessory_id);
    }
    db.prepare('UPDATE usage_records SET brand = ?, model = ?, year = ?, quantity = ? WHERE id = ?')
      .run(
        brand ? brand.trim() : existing.brand,
        model ? model.trim() : existing.model,
        year || existing.year,
        newQty,
        id
      );
  });

  try {
    updateUsage();
    const updated = db.prepare(`
      SELECT ur.*, a.name as accessory_name, u.username as user_name
      FROM usage_records ur
      JOIN accessories a ON ur.accessory_id = a.id
      LEFT JOIN users u ON ur.user_id = u.id
      WHERE ur.id = ?
    `).get(id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/usage/:id', authenticate, requireRole('admin'), (req, res) => {
  const record = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

  const deleteAndRestore = db.transaction(() => {
    db.prepare('UPDATE accessories SET quantity = quantity + ? WHERE id = ?').run(record.quantity, record.accessory_id);
    db.prepare('DELETE FROM usage_records WHERE id = ?').run(req.params.id);
  });
  deleteAndRestore();
  res.json({ message: 'Registro eliminado y stock restaurado' });
});

app.patch('/api/usage/:id/flag', authenticate, (req, res) => {
  const record = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });
  const newFlagged = record.flagged ? 0 : 1;
  db.prepare('UPDATE usage_records SET flagged = ? WHERE id = ?').run(newFlagged, req.params.id);
  res.json({ id: record.id, flagged: newFlagged });
});

import { join } from 'path';
// Servir frontend estático
app.use(express.static(join(__dirname, '../client/dist')));

// Cualquier ruta que no sea /api, devolver el index.html (para React Router)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
