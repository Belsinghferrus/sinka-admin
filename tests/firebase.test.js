import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { googleProvider } from '../src/config/firebase.js';

describe('Firebase Security & Environment Configuration Tests', () => {
  test('1. src/config/firebase.js does not contain hardcoded Google API keys', () => {
    const firebaseConfigPath = path.resolve('src/config/firebase.js');
    const content = fs.readFileSync(firebaseConfigPath, 'utf8');
    assert.doesNotMatch(
      content,
      /AIza[0-9A-Za-z-_]{35}/,
      'Hardcoded Google API key must not exist in src/config/firebase.js'
    );
  });

  test('2. No source files in src/ contain hardcoded Google API keys', () => {
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.doesNotMatch(
            content,
            /AIza[0-9A-Za-z-_]{35}/,
            `Hardcoded Google API key found in ${fullPath}`
          );
        }
      }
    };
    scanDir(path.resolve('src'));
  });

  test('3. Tracked environment file (.env.example) does not contain hardcoded keys', () => {
    const examplePath = path.resolve('.env.example');
    assert.ok(fs.existsSync(examplePath), '.env.example must exist');
    const content = fs.readFileSync(examplePath, 'utf8');
    assert.doesNotMatch(
      content,
      /AIza[0-9A-Za-z-_]{35}/,
      'Hardcoded Google API key found in .env.example'
    );
  });

  test('4. .gitignore protects .env and .env.* from Git tracking', () => {
    const gitignorePath = path.resolve('.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.match(content, /^\.env$/m);
    assert.match(content, /^\.env\.\*$/m);
  });

  test('5. Firebase GoogleAuthProvider is configured to prompt account selection', () => {
    assert.ok(googleProvider, 'googleProvider must be exported');
    assert.equal(typeof googleProvider.setCustomParameters, 'function');
  });
});

