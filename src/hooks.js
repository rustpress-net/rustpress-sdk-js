/**
 * RustPress SDK - Hooks subpath export
 *
 * Re-exports hook-related symbols for `require('rustpress-sdk/hooks')`.
 *
 * @module rustpress-sdk/hooks
 */

'use strict';

const {
  TriggerTiming,
  defineHook,
  beforeHook,
  afterHook,
  parseTrigger,
  buildTrigger,
  isValidTrigger,
} = require('./index.js');

module.exports = {
  TriggerTiming,
  defineHook,
  beforeHook,
  afterHook,
  parseTrigger,
  buildTrigger,
  isValidTrigger,
};
