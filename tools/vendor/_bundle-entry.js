// Browser bundle entry point for A2WF tools.
// Bundled by esbuild into tools/vendor/ajv-browser-bundle.js.
// Exposes Ajv 2020 and ajv-formats as globals so static HTML tools can use them
// without ES module loaders.

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

window.A2WF_Ajv2020 = Ajv2020.default || Ajv2020;
window.A2WF_addFormats = addFormats.default || addFormats;
