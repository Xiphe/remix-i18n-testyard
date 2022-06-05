import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
  Outlet,
} from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { I18nMeta } from './util/i18n';

export default function Root() {
  const { i18n } = useTranslation();

  return (
    <html lang={i18n.language} dir={i18n.dir()}>
      <head>
        <Meta />
        <Links />
        <I18nMeta />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
