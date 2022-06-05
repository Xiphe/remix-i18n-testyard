import { RemixBrowser } from '@remix-run/react';
import { hydrate } from 'react-dom';
import { setup as setupI18n } from '~/util/i18n';

(async function bootstrap() {
  const I18n = await setupI18n();

  hydrate(
    <I18n>
      <RemixBrowser />
    </I18n>,
    document,
  );
})().catch((err) => {
  console.error(err);
  document.body.innerHTML = `
    <h1>A really unexpected error ocurred 🤯</h1>
    <pre><code>${err instanceof Error ? err.stack : String(err)}</code></pre>
  `;
});
