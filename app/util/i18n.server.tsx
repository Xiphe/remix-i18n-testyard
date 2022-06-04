import type { EntryContext } from '@remix-run/server-runtime';
import type { LinkDescriptor } from '@remix-run/node';
import type { Options as BackendOptions } from '~/../packages/i18next-hashed/server';
import type { I18nHandle } from '~/util/i18n';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { config as i18nConfig, getRouteNamespaces } from '~/util/i18n';
import { I18NextHashedServerBackend } from '~/../packages/i18next-hashed/server';
import i18nManifest from '../manifest-i18n.json';
import { resolve } from 'node:path';

const backend = new I18NextHashedServerBackend();
const backendOpts: BackendOptions = {
  localesDir: resolve(process.cwd(), 'public/locales'),
  manifest: i18nManifest,
};
backend.init({} as any, backendOpts, undefined);

export function I18nHandoff() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__i18next_hashed_manifest=${JSON.stringify(
          i18nManifest,
        )};document.currentScript.remove()`,
      }}
    />
  );
}

export function I18nInitialPreload() {
  return (
    <>
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

export function getI18nLinks(): LinkDescriptor[] {
  return [];
}

export async function getLinkHeader(request: Request, handle: I18nHandle) {
  const lng = getLngFromPathname(new URL(request.url).pathname);
  const ns = Array.isArray(handle.i18n) ? handle.i18n : [handle.i18n];
  await Promise.all(
    ns.map(
      (n) =>
        new Promise<void>((res, rej) =>
          backend.read(lng, n, (err, c) => (err ? rej(err) : res())),
        ),
    ),
  );

  return {
    Link: [...backend.prefetch]
      .map((p) => `</locales/${p}>; rel="prefetch"; as="fetch"`)
      .join(', '),
  };
}

export async function setup(request: Request, context: EntryContext) {
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

  return i18n;
}

function getLngFromPathname(pathname: string) {
  const maybeLang = pathname.split('/')[1];
  return i18nConfig.supportedLngs.includes(maybeLang)
    ? maybeLang
    : i18nConfig.supportedLngs[0];
}
