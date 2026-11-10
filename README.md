# notstock.app

The Not Stock website: home, support, creators and the legal pages.

- `node build.mjs` builds the site into `_site/` (no dependencies).
- `data/legal.json` is exported from the app's own legal texts, so the website always matches the app. Don't edit it by hand: it's updated automatically from the app repository.
- Every push to `main` publishes the site with GitHub Pages.
