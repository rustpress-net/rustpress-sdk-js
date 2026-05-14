'use strict';

const path = require('path');

// We exercise the subpath files directly by relative path. The package's
// `exports` map points at these same files for `rustpress-sdk/hooks` and
// `rustpress-sdk/plugins`. Resolving via the package name would require the
// package to be installed under node_modules, so we validate by file path here
// and rely on a separate package.json structure assertion below.
describe('Subpath exports', () => {
  test('rustpress-sdk/hooks (./src/hooks.js) exposes the hook API surface', () => {
    const hooks = require('../src/hooks.js');
    expect(typeof hooks.defineHook).toBe('function');
    expect(typeof hooks.beforeHook).toBe('function');
    expect(typeof hooks.afterHook).toBe('function');
    expect(typeof hooks.parseTrigger).toBe('function');
    expect(typeof hooks.buildTrigger).toBe('function');
    expect(typeof hooks.isValidTrigger).toBe('function');
    expect(hooks.TriggerTiming).toEqual({ BEFORE: 'before', AFTER: 'after' });
  });

  test('rustpress-sdk/plugins (./src/plugins.js) exposes the base classes', () => {
    const plugins = require('../src/plugins.js');
    expect(typeof plugins.BasePlugin).toBe('function');
    expect(typeof plugins.BaseTheme).toBe('function');
    expect(typeof plugins.BaseApp).toBe('function');
  });

  test('subpath exports return the same references as the main entry', () => {
    const main = require('../src/index.js');
    const hooks = require('../src/hooks.js');
    const plugins = require('../src/plugins.js');
    expect(hooks.defineHook).toBe(main.defineHook);
    expect(plugins.BasePlugin).toBe(main.BasePlugin);
    expect(plugins.BaseTheme).toBe(main.BaseTheme);
    expect(plugins.BaseApp).toBe(main.BaseApp);
  });

  test('package.json exports map references files that exist on disk', () => {
    const pkg = require('../package.json');
    const fs = require('fs');
    const exportsMap = pkg.exports;
    expect(exportsMap).toBeDefined();
    for (const [subpath, target] of Object.entries(exportsMap)) {
      const targetPath = typeof target === 'string' ? target : target.require || target.default;
      expect(targetPath).toBeTruthy();
      const abs = path.join(__dirname, '..', targetPath);
      expect(fs.existsSync(abs)).toBe(true);
    }
  });

  test('package.json main field points to a real file', () => {
    const pkg = require('../package.json');
    const fs = require('fs');
    const abs = path.join(__dirname, '..', pkg.main);
    expect(fs.existsSync(abs)).toBe(true);
  });

  test('package.json does not declare a "module" field (CJS-only for v1.0)', () => {
    const pkg = require('../package.json');
    expect(pkg.module).toBeUndefined();
  });

  test('main entry exports the documented public surface', () => {
    const sdk = require('../src/index.js');
    const expectedExports = [
      'VERSION',
      'SDK_NAME',
      'TriggerTiming',
      'NotificationType',
      'NotificationChannel',
      'ContentStatus',
      'defineHook',
      'beforeHook',
      'afterHook',
      'BasePlugin',
      'BaseTheme',
      'BaseApp',
      'parseTrigger',
      'buildTrigger',
      'isValidTrigger',
      'sleep',
      'retry',
      'debounce',
      'throttle',
      'deepClone',
      'deepMerge',
      'generateId',
      'formatDate',
      'SimpleHttpClient',
      'SimpleEventEmitter',
    ];
    for (const name of expectedExports) {
      expect(sdk[name]).toBeDefined();
    }
  });
});
