import type { LoaderFunction } from '@remix-run/node';
import type { I18nHandle } from '~/util/i18n';
import { json } from '@remix-run/node';
import { Link, Outlet, useLocation } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { getLinkHeader } from '~/util/i18n.server';

export const handle: I18nHandle = {
  i18n: 'common',
};

export const loader: LoaderFunction = async ({ request }) => {
  return json(null, { headers: await getLinkHeader(request, handle) });
};

export default function Component() {
  const { t, i18n } = useTranslation();
  const loc = useLocation();
  const langSwitch = {
    ...loc,
    pathname: [
      i18n.language === 'en' ? '/es' : '/en',
      ...loc.pathname.split('/').slice(2),
    ].join('/'),
  };

  return (
    <>
      <h1>{t('greeting')}</h1>
      <Link to={langSwitch}>Switch Language</Link>
      <br />
      <Outlet />
    </>
  );
}
