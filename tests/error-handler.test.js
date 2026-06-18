/**
 * Unit Tests for Error Handler (error-handler.js)
 * Tests error storage, retrieval, and banner display.
 */

const {
  getStoredErrors,
  storeError,
  showErrorBanner,
  ERROR_STORAGE_KEY
} = require('../myhugoapp/static/js/utils/error-handler.js');

describe('Error Handler', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  describe('getStoredErrors', () => {
    test('returns empty array when no errors stored', () => {
      expect(getStoredErrors()).toEqual([]);
    });

    test('returns parsed errors from localStorage', () => {
      const errors = [{ msg: 'Test error', time: '2024-01-01T00:00:00.000Z' }];
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
      expect(getStoredErrors()).toEqual(errors);
    });

    test('returns empty array on corrupted localStorage data', () => {
      localStorage.setItem(ERROR_STORAGE_KEY, '{invalid json}');
      expect(getStoredErrors()).toEqual([]);
    });

    test('returns empty array when localStorage returns null', () => {
      expect(getStoredErrors()).toEqual([]);
    });
  });

  describe('storeError', () => {
    test('stores error with message', () => {
      storeError({ message: 'Test error' });
      const errors = getStoredErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].msg).toBe('Test error');
    });

    test('stores error with filename and line info', () => {
      storeError({ message: 'Fail', filename: 'test.js', lineno: 42, colno: 10 });
      const errors = getStoredErrors();
      expect(errors[0].url).toBe('test.js');
      expect(errors[0].line).toBe(42);
      expect(errors[0].col).toBe(10);
    });

    test('stores error with stack trace', () => {
      const stack = 'Error: test\n    at test.js:1:1';
      storeError({ message: 'Fail', error: { stack } });
      const errors = getStoredErrors();
      expect(errors[0].stack).toBe(stack);
    });

    test('stores timestamp in ISO format', () => {
      storeError({ message: 'Test' });
      const errors = getStoredErrors();
      expect(errors[0].time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('falls back to String(err) when message is falsy', () => {
      storeError({ message: null });
      const errors = getStoredErrors();
      expect(errors[0].msg).toBeTruthy();
    });

    test('keeps only last 50 errors', () => {
      for (let i = 0; i < 55; i++) {
        storeError({ message: 'Error ' + i });
      }
      const errors = getStoredErrors();
      expect(errors).toHaveLength(50);
      expect(errors[0].msg).toBe('Error 5');
      expect(errors[49].msg).toBe('Error 54');
    });

    test('appends to existing errors', () => {
      storeError({ message: 'First' });
      storeError({ message: 'Second' });
      const errors = getStoredErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].msg).toBe('First');
      expect(errors[1].msg).toBe('Second');
    });
  });

  describe('showErrorBanner', () => {
    test('creates banner element in DOM', () => {
      showErrorBanner('Something went wrong');
      const banner = document.getElementById('error-banner');
      expect(banner).toBeTruthy();
      expect(banner.id).toBe('error-banner');
    });

    test('does not show banner for Script error messages', () => {
      showErrorBanner('Script error');
      const banner = document.getElementById('error-banner');
      expect(banner).toBeNull();
    });

    test('does not show banner for local resource errors', () => {
      showErrorBanner('Not allowed to load local resource');
      const banner = document.getElementById('error-banner');
      expect(banner).toBeNull();
    });

    test('does not show banner for network/load errors', () => {
      showErrorBanner('Failed to load resource');
      const banner = document.getElementById('error-banner');
      expect(banner).toBeNull();
    });

    test('shows banner for runtime errors', () => {
      showErrorBanner('TypeError: undefined is not a function');
      const banner = document.getElementById('error-banner');
      expect(banner).toBeTruthy();
    });
  });
});
