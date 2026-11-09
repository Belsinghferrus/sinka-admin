import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { API_BASE_URL, BACKEND_URL } from '../src/config/env.js';
import apiClient, { ADMIN_TOKEN_KEY, getAuthToken, setAuthToken, clearAuthToken } from '../src/lib/api.js';
import serviceApiClient from '../src/services/api.js';

describe('Vite Multi-Environment API Configuration Tests', () => {
  test('1. .env.development defines local development backend URL on port 5001', () => {
    const devEnvPath = path.resolve('.env.development');
    assert.ok(fs.existsSync(devEnvPath), '.env.development must exist');
    const content = fs.readFileSync(devEnvPath, 'utf8');
    assert.match(content, /VITE_API_BASE_URL=http:\/\/localhost:5001/);
  });

  test('2. .env.production defines Render production backend URL', () => {
    const prodEnvPath = path.resolve('.env.production');
    assert.ok(fs.existsSync(prodEnvPath), '.env.production must exist');
    const content = fs.readFileSync(prodEnvPath, 'utf8');
    assert.match(content, /VITE_API_BASE_URL=https:\/\/sinka-backend-xxgb\.onrender\.com/);
  });

  test('3. .env.example defines template with no secrets', () => {
    const exampleEnvPath = path.resolve('.env.example');
    assert.ok(fs.existsSync(exampleEnvPath), '.env.example must exist');
    const content = fs.readFileSync(exampleEnvPath, 'utf8');
    assert.match(content, /VITE_API_BASE_URL=http:\/\/localhost:5001/);
    assert.doesNotMatch(content, /secret|password|key.*=.+/i);
  });

  test('4. .gitignore protects local override environment files', () => {
    const gitignorePath = path.resolve('.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.match(content, /\.env\.local/);
    assert.match(content, /\.env\.\*\.local/);
  });

  test('5. src/config/env.js normalizes BACKEND_URL and API_BASE_URL', () => {
    // In Node test runner without env var, fallback is used
    assert.ok(BACKEND_URL.startsWith('http://') || BACKEND_URL.startsWith('https://'));
    assert.ok(API_BASE_URL.endsWith('/api'), 'API_BASE_URL must end with /api');
    assert.equal(API_BASE_URL, `${BACKEND_URL}/api`);
  });

  test('6. apiClient uses centralized API_BASE_URL as its baseURL', () => {
    assert.equal(apiClient.defaults.baseURL, API_BASE_URL);
  });

  test('7. src/services/api.js re-exports apiClient and token utilities', () => {
    assert.equal(serviceApiClient, apiClient);
    assert.equal(typeof setAuthToken, 'function');
    assert.equal(typeof getAuthToken, 'function');
    assert.equal(typeof clearAuthToken, 'function');
    assert.equal(ADMIN_TOKEN_KEY, 'sinka_admin_token');
  });

  test('8. Netlify configuration file netlify.toml is present with SPA redirects', () => {
    const netlifyPath = path.resolve('netlify.toml');
    assert.ok(fs.existsSync(netlifyPath), 'netlify.toml must exist');
    const content = fs.readFileSync(netlifyPath, 'utf8');
    assert.match(content, /publish\s*=\s*"dist"/);
    assert.match(content, /to\s*=\s*"\/index\.html"/);
    assert.match(content, /status\s*=\s*200/);
  });

  test('9. No production backend URLs are hardcoded in components, pages, hooks, or services', () => {
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
          // Exclude env.js itself if it contains documentation comments
          if (fullPath.endsWith('config/env.js')) continue;
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.doesNotMatch(
            content,
            /sinka-backend-xxgb\.onrender\.com/,
            `Hardcoded production backend URL found in ${fullPath}`
          );
        }
      }
    };

    scanDir(path.resolve('src'));
  });
});

