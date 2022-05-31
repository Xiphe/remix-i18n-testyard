import { RemixBrowser } from '@remix-run/react';
import i18next from 'i18next';
import { hydrate } from 'react-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import {
  config as i18nConfig,
  clientBackend,
  getRouteNameSpaces,
} from '~/util/i18n';

async function bootstrap() {
  await i18next
    .use(clientBackend)
    .use(initReactI18next)
    .init({
      ...i18nConfig,
      lng: document.querySelector('html')!.getAttribute('lang')!,
      ns: getRouteNameSpaces(__remixRouteModules),
    });
  console.log('INITIATED');

  hydrate(
    <I18nextProvider i18n={i18next}>
      <RemixBrowser />
    </I18nextProvider>,
    document,
  );
}

bootstrap().catch((err) => {
  document.body.innerHTML = `
    <h1>A really unexpected error ocurred 🤯</h1>
    <pre><code>${err instanceof Error ? err.stack : String(err)}</code></pre>
  `;
});
