'use strict';

const {
  parseTrigger,
  buildTrigger,
  isValidTrigger,
} = require('../src/index.js');

describe('Trigger pattern utilities', () => {
  describe('parseTrigger', () => {
    test('parses a well-formed trigger pattern into components', () => {
      const parts = parseTrigger('@@rustpress.ecommerce.Order.create@@');
      expect(parts).toEqual({
        plugin: 'ecommerce',
        class: 'Order',
        method: 'create',
      });
    });

    test('parses plugin names with hyphens and underscores', () => {
      const parts = parseTrigger('@@rustpress.my-plugin_v2.User.login@@');
      expect(parts).not.toBeNull();
      expect(parts.plugin).toBe('my-plugin_v2');
      expect(parts.class).toBe('User');
      expect(parts.method).toBe('login');
    });

    test('returns null for completely invalid input', () => {
      expect(parseTrigger('not-a-trigger')).toBeNull();
    });

    test('returns null when missing leading @@', () => {
      expect(parseTrigger('rustpress.ecommerce.Order.create@@')).toBeNull();
    });

    test('returns null when missing trailing @@', () => {
      expect(parseTrigger('@@rustpress.ecommerce.Order.create')).toBeNull();
    });

    test('returns null when method segment is missing', () => {
      expect(parseTrigger('@@rustpress.ecommerce.Order@@')).toBeNull();
    });

    test('returns null when prefix is wrong', () => {
      expect(parseTrigger('@@notrustpress.ecommerce.Order.create@@')).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(parseTrigger('')).toBeNull();
    });
  });

  describe('buildTrigger', () => {
    test('produces a valid trigger string from components', () => {
      const trigger = buildTrigger('ecommerce', 'Order', 'create');
      expect(trigger).toBe('@@rustpress.ecommerce.Order.create@@');
    });

    test('round-trips with parseTrigger', () => {
      const original = buildTrigger('cms', 'Post', 'publish');
      const parsed = parseTrigger(original);
      expect(parsed).toEqual({
        plugin: 'cms',
        class: 'Post',
        method: 'publish',
      });
    });

    test('handles plugin names with hyphens', () => {
      const trigger = buildTrigger('my-plugin', 'Widget', 'render');
      expect(trigger).toBe('@@rustpress.my-plugin.Widget.render@@');
      expect(isValidTrigger(trigger)).toBe(true);
    });
  });

  describe('isValidTrigger', () => {
    test('accepts a well-formed trigger', () => {
      expect(isValidTrigger('@@rustpress.ecommerce.Order.create@@')).toBe(true);
    });

    test('rejects plain strings', () => {
      expect(isValidTrigger('invalid')).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isValidTrigger('')).toBe(false);
    });

    test('rejects trigger with extra segments', () => {
      expect(
        isValidTrigger('@@rustpress.plugin.Class.method.extra@@')
      ).toBe(false);
    });

    test('rejects trigger with disallowed characters in class', () => {
      expect(
        isValidTrigger('@@rustpress.plugin.Cla$$.method@@')
      ).toBe(false);
    });
  });
});
