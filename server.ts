import express from 'express';
import path from 'path';
import apiRouter from './server/api';
import { Database } from './server/db';

const app = express();
const PORT = 3000;

// Initialize the database and load seed data
Database.load();

// Middleware
app.use(express.json({ limit: '50mb' }));

// API Routes
app.use('/api', apiRouter);

// Serve static assets in production
const distPath = path.join(process.cwd(), 'dist');
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.static(distPath));

// Fallback all other routes to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NIHR Intranet] Production server is running on http://0.0.0.0:${PORT}`);
});
