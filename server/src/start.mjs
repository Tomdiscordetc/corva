import { readConfig } from './config.mjs';
import { createCorvaServer } from './app.mjs';

const config = readConfig();
let mailer = null;
if (config.smtp) {
  if (!config.mailFrom) throw new Error('SMTP_FROM ist bei aktivem SMTP erforderlich.');
  const { default: nodemailer } = await import('nodemailer');
  mailer = nodemailer.createTransport(config.smtp);
}
const app = await createCorvaServer(config, { mailer });
app.server.listen(config.port, config.host, () => console.log(`Corva server: http://${config.host}:${config.port} | Public origin: ${config.origin}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await app.close(); mailer?.close(); process.exit(0); });
