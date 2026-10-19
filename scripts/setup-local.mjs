import {randomBytes} from 'node:crypto';
import {existsSync, readFileSync, appendFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const path = '.env.local';
const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
const additions = [];
if (!/^BETTER_AUTH_SECRET=/m.test(current) && !process.env.BETTER_AUTH_SECRET) additions.push(`BETTER_AUTH_SECRET=${randomBytes(48).toString('base64url')}`);
if (!/^BETTER_AUTH_URL=/m.test(current) && !process.env.BETTER_AUTH_URL) additions.push('BETTER_AUTH_URL=http://localhost:3000');
if (!/^AUTH_DATABASE_PATH=/m.test(current) && !process.env.AUTH_DATABASE_PATH) additions.push('AUTH_DATABASE_PATH=.data/varda.sqlite');
if (additions.length) {
  if (existsSync(path)) appendFileSync(path, `\n${additions.join('\n')}\n`);
  else writeFileSync(path, `${additions.join('\n')}\n`, {mode: 0o600});
}
const result = spawnSync(process.execPath, ['--env-file-if-exists=.env.local', '--import', 'tsx', 'scripts/migrate-auth.ts'], {stdio: 'inherit'});
process.exit(result.status ?? 1);
