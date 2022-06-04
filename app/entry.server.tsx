import type { EntryContext } from '@remix-run/server-runtime';
import { RemixServer } from '@remix-run/react';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { setup as setupI18n } from '~/util/i18n.server';

export default async function handleRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  context: EntryContext,
) {
  console.log('HANDLE REQUEST');
  const i18n = await setupI18n(request, context);
  if (i18n instanceof Response) {
    return i18n;
  }

  let markup = renderToString(
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
