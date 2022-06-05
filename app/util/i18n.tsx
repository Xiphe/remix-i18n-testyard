import type {
  EntryRouteModule,
  RouteModules,
} from '@remix-run/server-runtime/routeModules';
import type { RouteModules as ReactRouteModules } from '@remix-run/react/routeModules';
import type { BackendModule, InitOptions, ResourceKey } from 'i18next';
import type { ClientRoute } from '@remix-run/react/routes';
import type { ComponentType } from 'react';
import { createContext, useContext } from 'react';
import i18next from 'i18next';
import {
  I18nextProvider,
  initReactI18next,
  useTranslation,
} from 'react-i18next';
import { useMatches } from '@remix-run/react';
import { useEffect } from 'react';
import { I18nMeta as I18nMetaServer } from './i18n.server';
import { useRemixEntryContext } from './useRemixEntryContext';

declare global {
  var __i18next_data: {
    manifest: Record<string, string>;
    routeNamespaces: Record<string, string | string[]>;
  };
}
interface Context {
  loadI18n: (lng: string, ns: string | string[]) => Promise<void>;
}
const LoadI18nContext = createContext<Context | undefined>(undefined);

export interface I18nHandle {
  i18n: string | string[];
  [k: string]: unknown;
}

function useLoadI18nContext() {
  const ctx = useContext(LoadI18nContext);
  if (!ctx) {
    throw new Error('Can not useLoadI18nContext without setup');
  }
  return ctx;
}

const initialPreload: string[] = [];
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-i18n-preload]').forEach(($el) => {
    initialPreload.push($el.getAttribute('href')!);
  });
}

const PATCHED = Symbol('🙈');
function I18nMetaClient() {
  const { clientRoutes } = useRemixEntryContext();
  const { loadI18n } = useLoadI18nContext();
  useEffect(() => {
    const patch = (route: ClientRoute) => {
      const originalLoader = route.loader;
      if (originalLoader && !(originalLoader as any)[PATCHED]) {
        route.loader = async (args) => {
          const ns = __i18next_data.routeNamespaces[route.id];
          return (
            await Promise.all([
              originalLoader(args),
              ns && loadI18n(getLngFromPathname(args.url.pathname), ns),
            ])
          )[0];
        };
        (route.loader as any)[PATCHED] = 1;
      }
      route.children?.forEach(patch);
    };
    clientRoutes.forEach(patch);
  }, [clientRoutes, loadI18n]);
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

  return (
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
}
export const I18nMeta =
  typeof document === 'undefined' ? I18nMetaServer : I18nMetaClient;

export const config: Omit<InitOptions, 'supportedLngs'> & {
  supportedLngs: string[];
} = {
  supportedLngs: ['en', 'es'],
  fallbackLng: false,
  defaultNS: 'common',
  react: { useSuspense: false },
};

export type RouteWithValidI18nHandle = Omit<EntryRouteModule, 'handle'> & {
  handle: I18nHandle;
};

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

export function hasValidI18nHandle(
  route: EntryRouteModule,
): route is RouteWithValidI18nHandle {
  const i18n = route.handle?.i18n;

  return (
    typeof i18n === 'string' ||
    (Array.isArray(i18n) && i18n.every((ns) => typeof ns === 'string'))
  );
}

const indexCache = new Map<string, Promise<Record<string, string>>>();
async function getIndex(lng: string): Promise<Record<string, string>> {
  if (!indexCache.has(lng)) {
    indexCache.set(
      lng,
      new Promise<Record<string, string>>(async (resolve, rej) => {
        try {
          const res = await fetch(
            `/locales/${lng}/${__i18next_data.manifest[lng]}`,
          );
          if (String(res.status)[0] !== '2') {
            throw new Error('Failed to load');
          }
          const index = await res.json();
          if (!isRecordOfStrings(index)) {
            throw new Error('Invalid format');
          }
          resolve(index);
        } catch (err) {
          indexCache.delete(lng);
          rej(
            new Error(
              `Could not read index for ${lng}. Reason: ${
                err instanceof Error ? err.message : String(err)
              }`,
            ),
          );
        }
      }),
    );
  }

  return indexCache.get(lng)!;
}
const nsCache = new Map<string, ResourceKey>();
async function readNamespace(
  lng: string,
  ns: string,
  file: string,
): Promise<ResourceKey> {
  const id = [lng, ns].join('|');
  if (!nsCache.has(id)) {
    nsCache.set(
      id,
      new Promise<ResourceKey>(async (resolve, rej) => {
        try {
          const res = await fetch(`/locales/${lng}/${file}`);
          if (String(res.status)[0] !== '2') {
            throw new Error('Failed to load');
          }
          const resource = await res.json();
          if (!isRecord(resource) && typeof resource !== 'string') {
            throw new Error('Invalid format');
          }
          resolve(resource);
        } catch (err) {
          nsCache.delete(id);
          rej(
            new Error(
              `Could not read resource with namespace ${ns} for ${lng}. Reason: ${
                err instanceof Error ? err.message : String(err)
              }`,
            ),
          );
        }
      }),
    );
  }
  return nsCache.get(id)!;
}

export async function setup(): Promise<ComponentType> {
  const be: BackendModule = {
    type: 'backend',
    init() {},
    async read(lng, ns, callback) {
      try {
        if (!__i18next_data.manifest[lng]) {
          throw new Error(`Can not read unknown language ${lng}`);
        }
        const index = await getIndex(lng);
        if (!index[ns]) {
          throw new Error(
            `Can not read unknown namespace ${ns} for language ${lng}`,
          );
        }
        callback(null, await readNamespace(lng, ns, index[ns]));
      } catch (err) {
        callback(err instanceof Error ? err : new Error(String(err)), null);
      }
    },
  };

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
  });

  if (errors.length) {
    throw new Error(
      `Failed to initiate translations:\n  ${errors
        .map(({ message }) => message)
        .join('\n  ')}`,
    );
  }

  const ctx = {
    loadI18n: async (lng: string, ns: string | string[]) => {
      await Promise.all(
        (Array.isArray(ns) ? ns : [ns]).map(
          (n) =>
            new Promise<void>((res, rej) => {
              be.read(lng, n, (err) => {
                if (err) {
                  rej(err);
                } else {
                  res();
                }
              });
            }),
        ),
      );
    },
  };

  return function I18nProvider({ children }) {
    return (
      <I18nextProvider i18n={i18n}>
        <LoadI18nContext.Provider value={ctx}>
          {children}
        </LoadI18nContext.Provider>
      </I18nextProvider>
    );
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}
function isRecordOfStrings(input: unknown): input is Record<string, string> {
  return (
    isRecord(input) && Object.values(input).every((v) => typeof v === 'string')
  );
}

export function getLngFromPathname(pathname: string) {
  const maybeLang = pathname.split('/')[1];
  return config.supportedLngs.includes(maybeLang)
    ? maybeLang
    : config.supportedLngs[0];
}
