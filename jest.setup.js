require('@testing-library/jest-dom');
const { TransformStream } = require('web-streams-polyfill');
global.TransformStream = TransformStream;
global.ResizeObserver = require('resize-observer-polyfill')
