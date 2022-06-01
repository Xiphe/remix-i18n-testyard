import type {
  EntryRouteModule,
  RouteModules,
} from '@remix-run/server-runtime/routeModules';
import type { RouteModules as ReactRouteModules } from '@remix-run/react/routeModules';
import type { BackendModule, InitOptions, ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';
import { getI18nManifest } from './i18n.server';

export const config: Omit<InitOptions, 'supportedLngs'> & {
  supportedLngs: string[];
} = {
  supportedLngs: ['en', 'de'],
  fallbackLng: false,
  defaultNS: 'main',
  react: { useSuspense: false },
};

type RegisterI18nResource = {
  (
    elm: HTMLScriptElement,
    language: string,
    namespace: string,
    resourceKey: ResourceKey,
  ): void;
  a?: [HTMLScriptElement, string, string, ResourceKey][];
};
declare global {
  var __registerI18nResource: RegisterI18nResource;
}

const isBrowser = typeof document !== 'undefined';

const MANIFESTS_GLOBAL_KEY = '__i18nManifests';

export function I18nLoader() {
  const { i18n } = useTranslation();

  if (isBrowser) {
    return null;
  }

  const manifest = getI18nManifest(i18n.language);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: [
            '(function(){',
            `window.${MANIFESTS_GLOBAL_KEY}={${i18n.language}:${JSON.stringify(
              manifest,
            )}};`,
            'var a=window.__registerI18nResource=function(){a.a.push(arguments)};a.a=[];',
            'document.currentScript.remove()',
            '})()',
          ].join(''),
        }}
      />
      {!isBrowser
        ? i18n.reportNamespaces
            .getUsedNamespaces()
            .map((ns) => (
              <script
                src={`/locales/${i18n.language}/${manifest[ns]}`}
                key={`${i18n.language}-${ns}`}
                type="text/javascript"
              />
            ))
        : null}
    </>
  );
}

const prev = global.__registerI18nResource?.a;
const waiting: Record<
  string,
  ResourceKey | ((err?: any, res?: ResourceKey) => void)
> = {};
global.__registerI18nResource = (script, lng, ns, resources) => {
  const id = `${lng}-${ns}`;
  const w = waiting[id];
  if (typeof w === 'function') {
    w(null, resources);
    delete waiting[id];
  } else if (!w) {
    waiting[id] = resources;
  }
  script.remove();
};
if (Array.isArray(prev)) {
  prev.forEach((args) => {
    global.__registerI18nResource(...args);
  });
}
const manifests: Record<
  string,
  Record<string, string> | Promise<Record<string, string>>
> = (global as any)[MANIFESTS_GLOBAL_KEY];
delete (global as any)[MANIFESTS_GLOBAL_KEY];
async function getManifest(lang: string) {
  if (!manifests[lang]) {
    manifests[lang] = new Promise(async (resolve, reject) => {
      const res = await fetch(`/locales/manifest-${lang}.json`);
      if (res.status !== 200) {
        reject(new Error(`Could not lod manifest for ${lang}`));
      } else {
        res.json().then(resolve, reject);
      }
    });
  }

  return manifests[lang];
}
export const clientBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(lng, ns, cb) {
    const id = `${lng}-${ns}`;
    const w = waiting[id];
    if (w && typeof w !== 'function') {
      cb(null, w);
      delete waiting[id];
    } else if (!w) {
      waiting[`${lng}-${ns}`] = cb;
      getManifest(lng)
        .then((manifest) => {
          const $elm = document.createElement('script');
          $elm.type = 'text/javascript';
          $elm.src = `/locales/${lng}/${manifest[ns]}`;
          document.body.append($elm);
        })
        .catch(console.error);
    }
  },
};

type RouteWithValidI18nHandle = Omit<EntryRouteModule, 'handle'> & {
  handle: {
    i18n: string | string[];
  };
};

export function getRouteNameSpaces(
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
