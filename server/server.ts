import type { RequestHandler } from 'express';
import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { join } from 'node:path';
import { createRequestHandler as createRemixRequestHandler } from '@remix-run/express';
import { config as i18nConfig } from '~/util/i18n';

const defaultLang = i18nConfig.supportedLngs[0];
const BUILD_DIR = join(process.cwd(), 'build');

const app = express();
app.use(compression());
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use(
  '/build',
  express.static('public/build', { immutable: true, maxAge: '1y' }),
);
i18nConfig.supportedLngs.forEach((lng) => {
  app.use(
    `/locales/${lng}`,
    express.static(`public/locales/${lng}`, { immutable: true, maxAge: '1y' }),
  );
});

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }));

app.use(morgan('tiny'));

function createRequestHandler(): RequestHandler {
  const remixHandler = createRemixRequestHandler({
    build: require(BUILD_DIR),
    mode: process.env.NODE_ENV,
  });

  return (req, res, next) => {
    if (req.path === '/') {
      // TODO: BETTER LNG-REDIRECT
      res
        .status(302)
        .append('Cache-Control', 's-maxage=0,max-age=86400')
        .location(`/${defaultLang}`)
        .type('html')
        .send();
      return;
    } else if (!i18nConfig.supportedLngs.includes(req.path.split('/')[1])) {
      // TODO: RENDER REMIX 404 PAGE
      res.status(404).send();
      return;
    }

    remixHandler(req, res, next);
  };
}

app.all('*', createRequestHandler());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
