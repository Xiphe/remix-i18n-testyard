import type {
  EntryRouteModule,
  RouteModules,
} from '@remix-run/server-runtime/routeModules';
import type { Options as BackendOptions } from '~/../packages/i18next-hashed/client';
import type { RouteModules as ReactRouteModules } from '@remix-run/react/routeModules';
import type { InitOptions } from 'i18next';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { I18NextHashedClientBackend } from '~/../packages/i18next-hashed/client';
import { useMatches } from '@remix-run/react';
import { useEffect } from 'react';
import { I18nInitialPreload as I18nInitialPreloadServer } from './i18n.server';

declare global {
  var __i18next_hashed_manifest: Record<string, string>;
}

export interface I18nHandle {
  i18n: string | string[];
  [k: string]: unknown;
}

const initialPreload: string[] = [];
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-i18n-preload]').forEach(($el) => {
    initialPreload.push($el.getAttribute('href')!);
  });
}
export const I18nInitialPreload =
  typeof document === 'undefined'
    ? I18nInitialPreloadServer
    : () => (
        <>
          {initialPreload.map((href) => (
            <link
              key={href}
              rel="prefetch"
              data-i18n-preload
              as="json"
              href={href}
            />
          ))}
        </>
      );

export const config: Omit<InitOptions, 'supportedLngs'> & {
  supportedLngs: string[];
} = {
  supportedLngs: ['en', 'es'],
  fallbackLng: false,
  defaultNS: 'common',
  react: { useSuspense: false },
};

type RouteWithValidI18nHandle = Omit<EntryRouteModule, 'handle'> & {
  handle: I18nHandle;
};

export function useUpdateLanguage() {
  const [
    {
      params: { lang },
    },
  ] = useMatches();
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);
}

export function getRouteNamespaces(
  routeModules: RouteModules<EntryRouteModule> | ReactRouteModules,
) {
  return [
    ...new Set(
      Object.values(routeModules)
        .filter(hasValidI18nHandle)
        .flatMap(({ handle: { i18n } }) => i18n),
    ),
  ];
}

function hasValidI18nHandle(
  route: EntryRouteModule,
): route is RouteWithValidI18nHandle {
  const i18n = route.handle?.i18n;

  return (
    typeof i18n === 'string' ||
    (Array.isArray(i18n) && i18n.every((ns) => typeof ns === 'string'))
  );
}

export async function setup() {
  const beOptions: BackendOptions = {
    baseUrl: '/locales',
    manifest: __i18next_hashed_manifest,
  };

  const be = new I18NextHashedClientBackend();
  const i18n = i18next.use(initReactI18next).use(be);

  const errors: Error[] = [];
  i18n.on('failedLoading', (_, __, msg: any) => {
    errors.push(msg instanceof Error ? msg : new Error(msg));
  });

  await i18n.init({
    ...config,
    lng:
      document.querySelector('html')?.getAttribute('lang') ||
      config.supportedLngs[0],
    ns: getRouteNamespaces(__remixRouteModules),
    backend: beOptions as any,
  });

  if (errors.length) {
    throw new Error(
      `Failed to initiate translations:\n  ${errors
        .map(({ message }) => message)
        .join('\n  ')}`,
    );
  }

  return i18n;
}
