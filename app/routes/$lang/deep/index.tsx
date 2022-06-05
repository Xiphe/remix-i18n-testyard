import { useTranslation } from 'react-i18next';
import { Link } from '@remix-run/react';

export const handle = {
  i18n: 'home',
};

export default function Component() {
  let { t, i18n } = useTranslation('home');
  return (
    <>
      <h1>{t('title')}</h1>
      <Link to={`/${i18n.language}`} prefetch="intent">
        Back
      </Link>
    </>
  );
}
