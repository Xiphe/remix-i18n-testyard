import { Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

// TODO: PRELOAD jo manually

export const handle = {
  i18n: 'jo',
};

export default function IndexRoute() {
  let { t, i18n, ready } = useTranslation('jo');

  if (!ready) {
    return (
      <h1>
        LOADINGLOADINGLOADINGLOADINGLOADINGLOADINGLOADINGLOADINGLOADINGLOADINGLOADING
      </h1>
    );
  }

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
