import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { validateEnvironment } from './config/validateEnv.js';

const port = Number(process.env.PORT || 5000);
let server;

try {
  validateEnvironment();
  await connectDB();
  server = app.listen(port, () => console.log(`SecureTrack API listening on ${port}`));
} catch (error) {
  console.error('Startup failed:', error.message);
  process.exit(1);
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down SecureTrack gracefully`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  process.exit(0);
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
