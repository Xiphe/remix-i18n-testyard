import type { MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from '@remix-run/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nLoader } from '~/util/i18n';

export const handle = {
  i18n: 'main',
};

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
  viewport: 'width=device-width,initial-scale=1',
});

export default function App() {
  const { i18n } = useTranslation();
  const [
    {
      params: { lang = 'en' },
    },
  ] = useMatches();
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return (
    <html lang={i18n.language} dir={i18n.dir()}>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <I18nLoader />
        <LiveReload />
      </body>
    </html>
  );
}
