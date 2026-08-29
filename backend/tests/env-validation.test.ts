import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

test('production env requires JWT_SECRET and ALLOWED_ORIGINS', () => {
  const cwd = path.resolve(__dirname, '..');
  const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', `
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.ALLOWED_ORIGINS;
    import('./src/config/env.ts').then(() => {
      console.log('unexpected-success');
      process.exit(0);
    }).catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  `], { cwd, encoding: 'utf-8' });

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(`${result.stdout}${result.stderr}`, /JWT_SECRET|ALLOWED_ORIGINS/i);
});
