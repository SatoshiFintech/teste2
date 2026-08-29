import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const script = `
  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  delete process.env.ALLOWED_ORIGINS;
  import('./src/config/env.ts').then(() => {
    console.log('unexpected-success');
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
`;

test('production environment must require JWT_SECRET and ALLOWED_ORIGINS', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('..', import.meta.url).pathname,
    encoding: 'utf-8',
  });

  assert.equal(result.status, 1, result.stdout + result.stderr);
  const output = `${result.stdout}${result.stderr}`;
  assert.match(output, /JWT_SECRET|ALLOWED_ORIGINS/i, output);
});
