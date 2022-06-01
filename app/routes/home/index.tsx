import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export const loader = () => {
  return { hi: 'ho' };
};

export const handle = {
  i18n: 'home',
};
export default function Component() {
  console.log(useLoaderData());
  let { t } = useTranslation('home');
  return <h1>{t('title')}</h1>;
}
