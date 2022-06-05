import type { EntryContext } from '@remix-run/server-runtime';
import { RemixServer } from '@remix-run/react';
import { renderToString } from 'react-dom/server';
import { setup as setupI18n } from '~/util/i18n.server';

export default async function handleRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  context: EntryContext,
) {
  const I18n = await setupI18n(request, context);
  if (I18n instanceof Response) {
    return I18n;
  }

  let markup = renderToString(
    <I18n>
      <RemixServer context={context} url={request.url} />
    </I18n>,
  );

  headers.set('Content-Type', 'text/html');

  return new Response('<!DOCTYPE html>' + markup, {
    status: statusCode,
    headers: headers,
  });
}
