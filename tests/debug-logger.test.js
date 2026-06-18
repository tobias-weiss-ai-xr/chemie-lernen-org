/**
 * Unit Tests for Debug Logger (debug-logger.js)
 * Tests debug logging enable/disable and output methods.
 */

const { createDebugLogger } = require('../myhugoapp/static/js/utils/debug-logger.js');

describe('Debug Logger', () => {
  let debug;
  let consoleSpy;

  beforeEach(() => {
    localStorage.clear();
    debug = createDebugLogger();
    consoleSpy = {};
  });

  afterEach(() => {
    Object.keys(consoleSpy).forEach(method => {
      if (consoleSpy[method]) consoleSpy[method].mockRestore();
    });
  });

  describe('enable/disable', () => {
    test('starts disabled by default', () => {
      expect(debug.isEnabled()).toBe(false);
    });

    test('enable() sets enabled to true', () => {
      debug.enable();
      expect(debug.isEnabled()).toBe(true);
    });

    test('enable() persists to localStorage', () => {
      debug.enable();
      expect(localStorage.getItem('chemie_debug')).toBe('1');
    });

    test('disable() sets enabled to false', () => {
      debug.enable();
      debug.disable();
      expect(debug.isEnabled()).toBe(false);
    });

    test('disable() removes from localStorage', () => {
      debug.enable();
      debug.disable();
      expect(localStorage.getItem('chemie_debug')).toBeNull();
    });
  });

  describe('toggle', () => {
    test('toggle enables when disabled', () => {
      const result = debug.toggle();
      expect(debug.isEnabled()).toBe(true);
      expect(result).toBe(true);
    });

    test('toggle disables when enabled', () => {
      debug.enable();
      const result = debug.toggle();
      expect(debug.isEnabled()).toBe(false);
      expect(result).toBe(false);
    });
  });

  describe('logging methods (disabled)', () => {
    test('log does not call console.log when disabled', () => {
      consoleSpy.log = jest.spyOn(console, 'log').mockImplementation(() => {});
      debug.log('test message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    test('error does not call console.error when disabled', () => {
      consoleSpy.error = jest.spyOn(console, 'error').mockImplementation(() => {});
      debug.error('test error');
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    test('warn does not call console.warn when disabled', () => {
      consoleSpy.warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      debug.warn('test warning');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('logging methods (enabled)', () => {
    beforeEach(() => {
      debug.enable();
    });

    test('log calls console.log when enabled', () => {
      consoleSpy.log = jest.spyOn(console, 'log').mockImplementation(() => {});
      debug.log('test message');
      expect(consoleSpy.log).toHaveBeenCalledWith('test message');
    });

    test('error calls console.error when enabled', () => {
      consoleSpy.error = jest.spyOn(console, 'error').mockImplementation(() => {});
      debug.error('test error');
      expect(consoleSpy.error).toHaveBeenCalledWith('test error');
    });

    test('warn calls console.warn when enabled', () => {
      consoleSpy.warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      debug.warn('test warning');
      expect(consoleSpy.warn).toHaveBeenCalledWith('test warning');
    });

    test('info calls console.info when enabled', () => {
      consoleSpy.info = jest.spyOn(console, 'info').mockImplementation(() => {});
      debug.info('test info');
      expect(consoleSpy.info).toHaveBeenCalledWith('test info');
    });

    test('log passes multiple arguments', () => {
      consoleSpy.log = jest.spyOn(console, 'log').mockImplementation(() => {});
      debug.log('msg', 42, { key: 'val' });
      expect(consoleSpy.log).toHaveBeenCalledWith('msg', 42, { key: 'val' });
    });
  });
});
