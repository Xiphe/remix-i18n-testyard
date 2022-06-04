import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
  Outlet,
} from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { useUpdateLanguage, I18nInitialPreload } from './util/i18n';
import { I18nHandoff } from './util/i18n.server';

export default function Root() {
  const { i18n } = useTranslation();
  useUpdateLanguage();

  return (
    <html lang={i18n.language} dir={i18n.dir()}>
      <head>
        <Meta />
        <Links />
        <meta name="test2" />
        <I18nInitialPreload />
        <meta name="test" />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        {typeof document === 'undefined' ? <I18nHandoff /> : null}
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
