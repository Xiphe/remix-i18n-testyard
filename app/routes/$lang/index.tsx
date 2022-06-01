import { Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export default function IndexRoute() {
  let { t } = useTranslation('main');

  return (
    <>
      <h1>{t('title')}</h1>
      <Link to="/de">DE</Link>
      <br />
      <Link to="/en">EN</Link>
      <br />
      <Link to="deep">Go Deeper</Link>
    </>
  );
}
