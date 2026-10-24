// Entry point: shows model.glb with the shared student viewer and connects it to the book.
import { startFigure } from '@shared/figure.js';
import { createModelViewer } from '@shared/model-viewer.js';
import { createI18n } from './i18n.js';

await startFigure({
  create: (root, options) => createModelViewer(root, { t: createI18n(options.lang), src: './model.glb', theme: options.bg || 'light' }),
  events: ['view'],
  commands: (viewer) => ({ 'export-glb': () => viewer.exportFile() }), // a model figure exports its file unchanged
});
