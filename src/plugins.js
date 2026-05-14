/**
 * RustPress SDK - Plugins subpath export
 *
 * Re-exports plugin/theme/app base classes for `require('rustpress-sdk/plugins')`.
 *
 * @module rustpress-sdk/plugins
 */

'use strict';

const { BasePlugin, BaseTheme, BaseApp } = require('./index.js');

module.exports = {
  BasePlugin,
  BaseTheme,
  BaseApp,
};
