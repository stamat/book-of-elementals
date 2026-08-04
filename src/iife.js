// The "whole book" script-tag build. Importing an element module registers it,
// so including this file is all there is to it - nothing lands on `window` and
// there is no instantiation call, because there is no API to call.
//
// For one element, include its own bundle instead: dist/elementals/accordion.min.js
import './elementals/accordion/index.js';
import './elementals/disclosure/index.js';
import './elementals/menu/index.js';
import './elementals/navbar/index.js';
import './elementals/segmented/index.js';
import './elementals/switch/index.js';
import './elementals/tabs/index.js';
