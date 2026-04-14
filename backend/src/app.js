const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const solicitudesRoutes = require('./routes/solicitudes');
const adminRoutes = require('./routes/admin');
const conductorRoutes = require('./routes/conductor');
const catalogosRoutes = require('./routes/catalogos');
const whatsappRoutes = require('./routes/whatsapp');
const conocimientoRoutes = require('./routes/conocimiento');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/conductor', conductorRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/conocimiento', conocimientoRoutes);

// Start: aplica migraciones pendientes y arranca el servidor
(async () => {
  try {
    const [, pendientes] = await db.migrate.latest({
      directory: path.join(__dirname, 'db', 'migrations')
    });
    if (pendientes && pendientes.length) {
      console.log(`Migraciones aplicadas: ${pendientes.length}`);
      pendientes.forEach(m => console.log(`  - ${m}`));
    } else {
      console.log('Base de datos al día (sin migraciones pendientes)');
    }
  } catch (err) {
    console.error('Error al aplicar migraciones:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
})();

module.exports = app;
