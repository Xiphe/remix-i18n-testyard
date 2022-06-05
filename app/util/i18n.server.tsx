import type { EntryContext } from '@remix-run/server-runtime';
import type { Options as BackendOptions } from '~/../packages/i18next-hashed/src/backend.server';
import type { ComponentType } from 'react';
import type { RouteWithValidI18nHandle } from '~/util/i18n';
import { hasValidI18nHandle, getLngFromPathname } from '~/util/i18n';
import { createContext, useContext } from 'react';
import { createInstance } from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { config as i18nConfig, getRouteNamespaces } from '~/util/i18n';
import { I18NextHashedServerBackend } from '~/../packages/i18next-hashed/src/backend.server';
import i18nManifest from '../manifest-i18n.json';
import { resolve } from 'node:path';

interface Context {
  backend: I18NextHashedServerBackend;
  routeNamespaces: Record<string, string | string[]>;
}
const I18nContext = createContext<Context | undefined>(undefined);

export function I18nMeta() {
  const { backend, routeNamespaces } = useI18nContext();
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__i18next_data=${JSON.stringify({
            manifest: i18nManifest,
            routeNamespaces,
          })};document.currentScript.remove()`,
        }}
      />
      {[...backend.prefetch].map((lng) => (
        <link
          key={lng}
          rel="prefetch"
          data-i18n-preload
          as="json"
          href={`/locales/${lng}`}
        />
      ))}
    </>
  );
}

function useI18nContext() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('Must useI18nContext inside setup');
  }
  return ctx;
}

export async function setup(
  request: Request,
  context: EntryContext,
): Promise<Response | ComponentType> {
  const { pathname } = new URL(request.url);
  if (pathname === '/') {
    // TODO: BETTER LNG-REDIRECT
    return new Response(null, {
      status: 302,
      headers: {
        location: `/${i18nConfig.supportedLngs[0]}`,
        'cache-control': 's-maxage=0,max-age=86400',
      },
    });
  }

  const backend = new I18NextHashedServerBackend();
  const backendOpts: BackendOptions = {
    localesDir: resolve(process.cwd(), 'public/locales'),
    manifest: i18nManifest,
  };
  const i18n = createInstance().use(initReactI18next).use(backend);

  const errors: Error[] = [];
  i18n.on('failedLoading', (_, __, msg: any) => {
    errors.push(msg instanceof Error ? msg : new Error(msg));
  });

  const matchedRoutIds = context.matches.map(({ route }) => route.id);

  await i18n.init({
    ...i18nConfig,
    lng: getLngFromPathname(pathname),
    ns: getRouteNamespaces(
      Object.fromEntries(
        Object.entries(context.routeModules).filter(([id]) =>
          matchedRoutIds.includes(id),
        ),
      ),
    ),
    backend: backendOpts as any,
  });

  if (errors.length) {
    throw new Error(
      `Failed to initiate translations:\n  ${errors
        .map(({ message }) => message)
        .join('\n  ')}`,
    );
  }

  const routeNamespaces = Object.fromEntries(
    Object.entries(context.routeModules)
      .filter((entry): entry is [string, RouteWithValidI18nHandle] =>
        hasValidI18nHandle(entry[1]),
      )
      .map(([id, { handle }]) => [id, handle.i18n]),
  );

  return function i18nProvider({ children }) {
    return (
      <I18nContext.Provider value={{ backend, routeNamespaces }}>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </I18nContext.Provider>
    );
  };
}
