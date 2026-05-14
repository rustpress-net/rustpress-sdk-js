'use strict';

const { BaseTheme } = require('../src/index.js');

function makeContext() {
  return {
    assets: {
      url: jest.fn(path => `https://cdn.example.com/${path}`),
    },
    partials: {
      render: jest.fn(async (name, data) => `<div data-name="${name}">${JSON.stringify(data)}</div>`),
    },
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
}

describe('BaseTheme', () => {
  test('stores id and metadata at construction', () => {
    const t = new BaseTheme('my-theme', { name: 'My Theme', version: '1.0.0' });
    expect(t.id).toBe('my-theme');
    expect(t.metadata.name).toBe('My Theme');
    expect(t._context).toBeNull();
  });

  test('activate attaches context and calls onActivate', async () => {
    const onActivate = jest.fn(async () => {});
    class T extends BaseTheme {
      onActivate(ctx) {
        return onActivate(ctx);
      }
    }
    const t = new T('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await t.activate(ctx);
    expect(t._context).toBe(ctx);
    expect(onActivate).toHaveBeenCalledWith(ctx);
  });

  test('deactivate calls onDeactivate and clears context', async () => {
    const onDeactivate = jest.fn(async () => {});
    class T extends BaseTheme {
      onDeactivate() {
        return onDeactivate();
      }
    }
    const t = new T('id', { name: 'n', version: '1' });
    await t.activate(makeContext());
    await t.deactivate();
    expect(onDeactivate).toHaveBeenCalled();
    expect(t._context).toBeNull();
  });

  test('asset returns the input path when no context is attached', () => {
    const t = new BaseTheme('id', { name: 'n', version: '1' });
    expect(t.asset('logo.png')).toBe('logo.png');
  });

  test('asset delegates to context.assets.url when active', async () => {
    const t = new BaseTheme('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await t.activate(ctx);
    expect(t.asset('logo.png')).toBe('https://cdn.example.com/logo.png');
    expect(ctx.assets.url).toHaveBeenCalledWith('logo.png');
  });

  test('partial returns empty string when no context is attached', async () => {
    const t = new BaseTheme('id', { name: 'n', version: '1' });
    expect(await t.partial('header')).toBe('');
  });

  test('partial renders via context.partials when active', async () => {
    const t = new BaseTheme('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await t.activate(ctx);
    const out = await t.partial('header', { title: 'Hello' });
    expect(out).toContain('header');
    expect(out).toContain('Hello');
    expect(ctx.partials.render).toHaveBeenCalledWith('header', { title: 'Hello' });
  });

  test('log forwards to context.logger including theme id', async () => {
    const t = new BaseTheme('my-theme', { name: 'n', version: '1' });
    const ctx = makeContext();
    await t.activate(ctx);
    t.log('warn', 'something');
    expect(ctx.logger.warn).toHaveBeenCalledWith('something', { theme: 'my-theme' });
  });
});
