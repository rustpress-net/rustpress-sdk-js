'use strict';

const {
  defineHook,
  beforeHook,
  afterHook,
  TriggerTiming,
} = require('../src/index.js');

describe('Hook factory functions', () => {
  describe('defineHook', () => {
    test('produces a hook with metadata and handler', () => {
      const handler = async () => {};
      const hook = defineHook(
        {
          name: 'orderValidation',
          trigger: '@@rustpress.ecommerce.Order.create@@',
          timing: 'before',
        },
        handler
      );

      expect(hook.metadata.name).toBe('orderValidation');
      expect(hook.metadata.trigger).toBe('@@rustpress.ecommerce.Order.create@@');
      expect(hook.metadata.timing).toBe('before');
      expect(hook.handler).toBe(handler);
    });

    test('defaults priority to 100 when not provided', () => {
      const hook = defineHook(
        {
          name: 'h',
          trigger: '@@rustpress.a.B.c@@',
          timing: 'before',
        },
        () => {}
      );
      expect(hook.metadata.priority).toBe(100);
    });

    test('preserves explicit priority', () => {
      const hook = defineHook(
        {
          name: 'h',
          trigger: '@@rustpress.a.B.c@@',
          timing: 'after',
          priority: 5,
        },
        () => {}
      );
      expect(hook.metadata.priority).toBe(5);
    });

    test('defaults enabled to true when not provided', () => {
      const hook = defineHook(
        {
          name: 'h',
          trigger: '@@rustpress.a.B.c@@',
          timing: 'before',
        },
        () => {}
      );
      expect(hook.metadata.enabled).toBe(true);
    });

    test('respects explicit enabled: false', () => {
      const hook = defineHook(
        {
          name: 'h',
          trigger: '@@rustpress.a.B.c@@',
          timing: 'before',
          enabled: false,
        },
        () => {}
      );
      expect(hook.metadata.enabled).toBe(false);
    });

    test('throws if name is missing', () => {
      expect(() =>
        defineHook(
          { trigger: '@@rustpress.a.B.c@@', timing: 'before' },
          () => {}
        )
      ).toThrow(/name is required/);
    });

    test('throws if trigger is missing', () => {
      expect(() =>
        defineHook({ name: 'h', timing: 'before' }, () => {})
      ).toThrow(/trigger is required/);
    });

    test('throws if timing is invalid', () => {
      expect(() =>
        defineHook(
          { name: 'h', trigger: '@@rustpress.a.B.c@@', timing: 'middle' },
          () => {}
        )
      ).toThrow(/timing/);
    });

    test('throws if handler is not a function', () => {
      expect(() =>
        defineHook(
          { name: 'h', trigger: '@@rustpress.a.B.c@@', timing: 'before' },
          'not a function'
        )
      ).toThrow(/handler must be a function/);
    });

    test('preserves arbitrary metadata fields', () => {
      const hook = defineHook(
        {
          name: 'h',
          trigger: '@@rustpress.a.B.c@@',
          timing: 'before',
          author: 'Alice',
          tags: ['ecommerce', 'validation'],
          description: 'Validates orders',
        },
        () => {}
      );
      expect(hook.metadata.author).toBe('Alice');
      expect(hook.metadata.tags).toEqual(['ecommerce', 'validation']);
      expect(hook.metadata.description).toBe('Validates orders');
    });
  });

  describe('beforeHook', () => {
    test('creates a hook with timing "before"', () => {
      const hook = beforeHook('@@rustpress.a.B.c@@', () => {});
      expect(hook.metadata.timing).toBe(TriggerTiming.BEFORE);
    });

    test('auto-generates a name from the trigger', () => {
      const hook = beforeHook('@@rustpress.a.B.c@@', () => {});
      expect(hook.metadata.name).toMatch(/^before_/);
    });

    test('accepts a custom name via options', () => {
      const hook = beforeHook('@@rustpress.a.B.c@@', () => {}, {
        name: 'myCustomName',
      });
      expect(hook.metadata.name).toBe('myCustomName');
    });

    test('passes through additional options into metadata', () => {
      const hook = beforeHook('@@rustpress.a.B.c@@', () => {}, {
        name: 'h',
        priority: 10,
        tags: ['t'],
      });
      expect(hook.metadata.priority).toBe(10);
      expect(hook.metadata.tags).toEqual(['t']);
    });
  });

  describe('afterHook', () => {
    test('creates a hook with timing "after"', () => {
      const hook = afterHook('@@rustpress.a.B.c@@', () => {});
      expect(hook.metadata.timing).toBe(TriggerTiming.AFTER);
    });

    test('auto-generates a name prefixed with after_', () => {
      const hook = afterHook('@@rustpress.a.B.c@@', () => {});
      expect(hook.metadata.name).toMatch(/^after_/);
    });

    test('handler is invokable and receives args', async () => {
      const calls = [];
      const hook = afterHook('@@rustpress.a.B.c@@', async (args, ctx) => {
        calls.push({ args, ctx });
        return 'ok';
      });
      const result = await hook.handler({ x: 1 }, { y: 2 });
      expect(result).toBe('ok');
      expect(calls[0].args).toEqual({ x: 1 });
      expect(calls[0].ctx).toEqual({ y: 2 });
    });
  });
});
