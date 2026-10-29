// The shared lab libraries: this repo's three.js must be the version of the pinned chalk-format catalog, or the labs it publishes
// would not share their three.js with other labs (docs/library-sync.md). The keys themselves are checked when the libraries are built.
import path from 'node:path';
import { CATALOG_FILE, libraryPreflight, loadCatalog } from '../../lib/library/catalog.mjs';
import { ROOT } from '../../lib/paths.mjs';

const FILE = path.relative(ROOT, CATALOG_FILE);

export default {
  name: 'libraries',
  scope: 'repo',
  async run() {
    let catalog;
    try {
      catalog = loadCatalog();
    } catch (err) {
      return [{ level: 'error', file: FILE, message: err.message }];
    }
    return libraryPreflight({ root: ROOT, catalog }).map((message) => ({ level: 'error', file: FILE, message }));
  },
};
