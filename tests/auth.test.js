import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { authService, decodeJwtPayload, isTokenExpired } from '../src/services/auth.service.js';
import apiClient, { setAuthToken, getAuthToken, clearAuthToken, ADMIN_TOKEN_KEY } from '../src/lib/api.js';

describe('Admin Authentication & Rate Limit Error Handling Tests', () => {
  let originalPost, originalGet;

  beforeEach(() => {
    originalPost = apiClient.post;
    originalGet = apiClient.get;
    clearAuthToken();
  });

  afterEach(() => {
    apiClient.post = originalPost;
    apiClient.get = originalGet;
    clearAuthToken();
  });

  test('1. authService.login validates email and password input client-side', async () => {
    await assert.rejects(
      async () => {
        await authService.login({ email: '', password: 'password123' });
      },
      { message: 'Please enter your administrator email address.' }
    );

    await assert.rejects(
      async () => {
        await authService.login({ email: 'admin@sinka.com', password: '' });
      },
      { message: 'Please enter your administrator password.' }
    );
  });

  test('2. authService.login sends credentials to /admin/auth/login and stores 24h JWT', async () => {
    let capturedUrl = '';
    let capturedPayload = null;

    const mockAdminProfile = {
      id: 'admin_123',
      email: 'admin@sinka.com',
      role: 'admin',
    };
    const mockToken = 'mock.jwt.token';

    apiClient.post = async (url, payload) => {
      capturedUrl = url;
      capturedPayload = payload;
      return {
        data: {
          success: true,
          data: {
            token: mockToken,
            user: mockAdminProfile,
          },
        },
      };
    };

    const user = await authService.login({
      email: '  Admin@Sinka.COM ',
      password: 'SecurePassword123!',
    });

    assert.equal(capturedUrl, '/admin/auth/login');
    assert.equal(capturedPayload.email, 'admin@sinka.com'); // Lowercased and trimmed
    assert.equal(capturedPayload.password, 'SecurePassword123!');
    assert.equal(user.email, 'admin@sinka.com');
    assert.equal(user.role, 'admin');
    assert.equal(getAuthToken(), mockToken);
  });

  test('3. authService.login rejects non-admin users and clears token', async () => {
    apiClient.post = async () => ({
      data: {
        success: true,
        data: {
          token: 'customer.token',
          user: { id: 'cust_1', email: 'user@example.com', role: 'customer' },
        },
      },
    });

    await assert.rejects(
      async () => {
        await authService.login({ email: 'user@example.com', password: 'pwd' });
      },
      /Access denied: Your account does not possess administrator privileges/
    );

    assert.equal(getAuthToken(), null);
  });

  test('4. apiClient interceptor extracts HTTP 429 message and Retry-After header', async () => {
    // Simulate axios rejection with 429 and Retry-After header
    const mock429Error = {
      response: {
        status: 429,
        headers: {
          'retry-after': '900',
        },
        data: {
          success: false,
          error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many failed admin login attempts. Please try again after 15 minutes.',
          },
        },
      },
    };

    // Extract the response interceptor rejection handler
    const responseInterceptor = apiClient.interceptors.response.handlers[0];

    try {
      await responseInterceptor.rejected(mock429Error);
      assert.fail('Should have thrown standardized error');
    } catch (err) {
      assert.equal(err.status, 429);
      assert.equal(err.code, 'AUTH_RATE_LIMIT_EXCEEDED');
      assert.equal(err.message, 'Too many failed admin login attempts. Please try again after 15 minutes.');
      assert.equal(err.retryAfter, 900);
    }
  });

  test('5. apiClient interceptor provides Retry-After fallback when backend message is missing', async () => {
    const mock429ErrorWithoutMessage = {
      response: {
        status: 429,
        headers: {
          'retry-after': '60',
        },
        data: {},
      },
    };

    const responseInterceptor = apiClient.interceptors.response.handlers[0];

    try {
      await responseInterceptor.rejected(mock429ErrorWithoutMessage);
      assert.fail('Should have thrown standardized error');
    } catch (err) {
      assert.equal(err.status, 429);
      assert.equal(err.message, 'Too many requests. Please wait 60 seconds before trying again.');
      assert.equal(err.retryAfter, 60);
    }
  });

  test('6. authService.logout purges token from storage and calls backend', async () => {
    setAuthToken('existing_token');
    assert.equal(getAuthToken(), 'existing_token');

    let logoutCalled = false;
    apiClient.post = async (url) => {
      if (url === '/admin/auth/logout') logoutCalled = true;
      return { data: { success: true } };
    };

    await authService.logout();
    assert.equal(logoutCalled, true);
    assert.equal(getAuthToken(), null);
    assert.equal(ADMIN_TOKEN_KEY, 'sinka_admin_token');
  });

  test('7. decodeJwtPayload and isTokenExpired advisory utilities operate correctly', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in past

    // Build unsigned mock JWTs with base64url payload
    const makeJwt = (payload) => {
      const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
      return `eyJhbGciOiJIUzI1NiJ9.${p}.mock_signature`;
    };

    const validJwt = makeJwt({ adminId: '123', exp: futureExp });
    const expiredJwt = makeJwt({ adminId: '123', exp: pastExp });

    assert.equal(decodeJwtPayload(validJwt).adminId, '123');
    assert.equal(isTokenExpired(validJwt), false);
    assert.equal(isTokenExpired(expiredJwt), true);
    assert.equal(isTokenExpired('not-a-token'), false);
  });
});
