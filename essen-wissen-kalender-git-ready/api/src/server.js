import app from './app.js';
import { config } from './config.js';
import { closePool } from './db.js';

const server = app.listen(config.port, () => console.log(`Essen-Wissen API laeuft auf Port ${config.port}`));
async function shutdown(signal) { console.log(`${signal}: Server wird beendet.`); server.close(async () => { await closePool(); process.exit(0); }); }
process.on('SIGTERM', () => shutdown('SIGTERM')); process.on('SIGINT', () => shutdown('SIGINT'));
