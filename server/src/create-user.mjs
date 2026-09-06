import { readConfig } from './config.mjs';
import { openDatabase, createUser } from './database.mjs';

const config = readConfig();
const db = openDatabase(config.databasePath);
try {
  const user = await createUser(db, {
    email: process.env.CORVA_ADMIN_EMAIL,
    name: process.env.CORVA_ADMIN_NAME,
    password: process.env.CORVA_ADMIN_PASSWORD,
    role: process.env.CORVA_ADMIN_ROLE || 'admin',
    tenantId: process.env.CORVA_TENANT_ID,
    tenantName: process.env.CORVA_TENANT_NAME || 'Corva',
  });
  console.log(`Benutzer angelegt: ${user.email}\nBenutzer-ID: ${user.id}\nMandanten-ID: ${user.tenantId}`);
} catch (error) {
  console.error(error.code?.startsWith('ERR_SQLITE') ? 'Benutzer konnte nicht angelegt werden. E-Mail möglicherweise bereits vorhanden.' : error.message);
  process.exitCode = 1;
} finally { delete process.env.CORVA_ADMIN_PASSWORD; db.close(); }
