import { Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export const handle = {
  i18n: 'jo',
};

export default function IndexRoute() {
  let { t, i18n } = useTranslation('jo');

  return (
    <>
      <h1>{t('Yo')}</h1>
      <Link to="/de/deep">DE</Link>
      <br />
      <Link to="/en/deep">EN</Link>
      <br />
      <Link to={`/${i18n.language}`}>back</Link>
    </>
  );
}
