import type { I18nHandle } from '~/util/i18n';
import { Link, Outlet, useLocation } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export const handle: I18nHandle = {
  i18n: 'common',
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
      <Link to={langSwitch} prefetch="intent">
        Switch Language
      </Link>
      <br />
      <Outlet />
    </>
  );
}
