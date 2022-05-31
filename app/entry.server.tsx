import { RemixServer } from '@remix-run/react';
import type { EntryContext } from '@remix-run/server-runtime';
import { createInstance } from 'i18next';
import { renderToString } from 'react-dom/server';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { config as i18nConfig, getRouteNameSpaces } from '~/util/i18n';
import { serverBackend } from '~/util/i18n.server';

export default async function handleRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  context: EntryContext,
) {
  const i18n = createInstance();
  const langPath = new URL(request.url).pathname.split('/')[1];

  await i18n
    .use(serverBackend)
    .use(initReactI18next)
    .init({
      ...i18nConfig,
      lng: (i18nConfig.supportedLngs || []).includes(langPath)
        ? langPath
        : 'en',
      ns: getRouteNameSpaces(context.routeModules),
    });

  const markup = renderToString(
    <I18nextProvider i18n={i18n}>
      <RemixServer context={context} url={request.url} />
    </I18nextProvider>,
  );

  headers.set('Content-Type', 'text/html');

  return new Response('<!DOCTYPE html>' + markup, {
    status: statusCode,
    headers: headers,
  });
}
