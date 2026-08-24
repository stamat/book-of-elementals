// The "whole book" script-tag build. Importing an element module registers it,
// so including this file is all there is to it - nothing lands on `window` and
// there is no instantiation call, because there is no API to call.
//
// For one element, include its own bundle instead: dist/elementals/accordion.min.js
import './elementals/accordion/index.js';
import './elementals/carousel/index.js';
import './elementals/checkbox-group/index.js';
import './elementals/combobox/index.js';
import './elementals/copy/index.js';
import './elementals/disclosure/index.js';
import './elementals/field/index.js';
import './elementals/marquee/index.js';
import './elementals/menu/index.js';
import './elementals/modal/index.js';
import './elementals/navbar/index.js';
import './elementals/password/index.js';
import './elementals/progress/index.js';
import './elementals/rearrangeable/index.js';
import './elementals/search/index.js';
import './elementals/segmented/index.js';
import './elementals/slider/index.js';
import './elementals/sortable-table/index.js';
import './elementals/splitter/index.js';
import './elementals/suggest/index.js';
import './elementals/switch/index.js';
import './elementals/tabs/index.js';
import './elementals/tilt/index.js';
import './elementals/toolbar/index.js';
import './elementals/tooltip/index.js';
import './elementals/tree-view/index.js';
