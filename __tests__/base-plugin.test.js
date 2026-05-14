'use strict';

const { BasePlugin } = require('../src/index.js');

function makeContext() {
  const apiCalls = [];
  return {
    hooks: {
      register: jest.fn(),
    },
    api: {
      get: jest.fn((path, handler) => apiCalls.push({ method: 'get', path, handler })),
      post: jest.fn((path, handler) => apiCalls.push({ method: 'post', path, handler })),
    },
    settings: {
      get: jest.fn((key, defaultValue) => (key === 'known' ? 'value' : defaultValue)),
      set: jest.fn(async () => {}),
    },
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
    _apiCalls: apiCalls,
  };
}

describe('BasePlugin', () => {
  test('stores id and metadata at construction', () => {
    const p = new BasePlugin('my-plugin', { name: 'My', version: '1.0.0' });
    expect(p.id).toBe('my-plugin');
    expect(p.metadata).toEqual({ name: 'My', version: '1.0.0' });
  });

  test('initializes empty hook and route lists', () => {
    const p = new BasePlugin('p', { name: 'P', version: '1' });
    expect(p._hooks).toEqual([]);
    expect(p._routes).toEqual([]);
    expect(p._context).toBeNull();
  });

  test('activate stores the context and calls onActivate', async () => {
    const onActivate = jest.fn(async () => {});
    class P extends BasePlugin {
      onActivate(ctx) {
        return onActivate(ctx);
      }
    }
    const p = new P('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await p.activate(ctx);
    expect(p._context).toBe(ctx);
    expect(onActivate).toHaveBeenCalledWith(ctx);
  });

  test('deactivate calls onDeactivate and clears context', async () => {
    const onDeactivate = jest.fn(async () => {});
    class P extends BasePlugin {
      onDeactivate() {
        return onDeactivate();
      }
    }
    const p = new P('id', { name: 'n', version: '1' });
    await p.activate(makeContext());
    await p.deactivate();
    expect(onDeactivate).toHaveBeenCalled();
    expect(p._context).toBeNull();
  });

  test('registerHook stores entries locally and registers with context', async () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await p.activate(ctx);

    const handler = () => {};
    p.registerHook('content:save', handler);

    expect(ctx.hooks.register).toHaveBeenCalledWith('content:save', handler);
    expect(p._hooks).toEqual([{ event: 'content:save', handler }]);
  });

  test('registerHook still stores locally even without active context', () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    const handler = () => {};
    p.registerHook('content:save', handler);
    expect(p._hooks).toEqual([{ event: 'content:save', handler }]);
  });

  test('registerRoute invokes the correct HTTP method on context.api', async () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await p.activate(ctx);

    const handler = () => {};
    p.registerRoute('GET', '/status', handler);

    expect(ctx.api.get).toHaveBeenCalledWith('/status', handler);
    expect(p._routes).toEqual([{ method: 'GET', path: '/status', handler }]);
  });

  test('registerRoute lowercases the method name when calling api', async () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await p.activate(ctx);

    p.registerRoute('POST', '/things', () => {});
    expect(ctx.api.post).toHaveBeenCalled();
  });

  test('getSetting returns default when no context is attached', () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    expect(p.getSetting('anything', 'fallback')).toBe('fallback');
  });

  test('getSetting delegates to context.settings.get', async () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await p.activate(ctx);
    expect(p.getSetting('known', 'fallback')).toBe('value');
    expect(ctx.settings.get).toHaveBeenCalledWith('known', 'fallback');
  });

  test('setSetting delegates to context.settings.set', async () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await p.activate(ctx);
    await p.setSetting('key', 'value');
    expect(ctx.settings.set).toHaveBeenCalledWith('key', 'value');
  });

  test('log forwards to context.logger with plugin id', async () => {
    const p = new BasePlugin('my-plugin', { name: 'n', version: '1' });
    const ctx = makeContext();
    await p.activate(ctx);
    p.log('info', 'hello', { foo: 'bar' });
    expect(ctx.logger.info).toHaveBeenCalledWith('hello', {
      plugin: 'my-plugin',
      foo: 'bar',
    });
  });

  test('log is a no-op when context is not attached', () => {
    const p = new BasePlugin('id', { name: 'n', version: '1' });
    expect(() => p.log('info', 'msg')).not.toThrow();
  });
});
