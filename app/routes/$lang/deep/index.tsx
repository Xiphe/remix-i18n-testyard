import type { LoaderFunction } from '@remix-run/server-runtime';
import type { LinksFunction } from '@remix-run/node';
import { useTranslation } from 'react-i18next';
import { json } from '@remix-run/node';
import { getLinkHeader } from '~/util/i18n.server';
import { Link } from '@remix-run/react';

export const handle = {
  i18n: 'home',
};
export const loader: LoaderFunction = async ({ request }) => {
  return json(null, { headers: await getLinkHeader(request, handle) });
};
export const links: LinksFunction = () => [
  { href: 'https://example.org', rel: 'prefetch', as: 'fetch' },
];

export default function Component() {
  let { t, i18n } = useTranslation('home');
  return (
    <>
      <h1>{t('title')}</h1>
      <Link to={`/${i18n.language}`}>Back</Link>
    </>
  );
}
