import { Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export default function Component() {
  let { t } = useTranslation();
  return (
    <>
      <h1>{t('greeting')}</h1>
      <Link to="home">Home</Link>
    </>
  );
}
