import type { BackendModule } from 'i18next';
import { resolve } from 'node:path';

const localesDir = resolve(__dirname, '../public/locales');

export function getI18nManifest(lang: string): Record<string, string> {
  const path = resolve(localesDir, `manifest-${lang}.json`);
  if (process.env.NODE_ENV === 'development') {
    delete require.cache[path];
  }
  return require(path);
}

export const serverBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(language, namespace, callback) {
    const manifest = getI18nManifest(language);
    if (!manifest[namespace]) {
      callback(
        new Error(`Namespace ${namespace} does not exist in ${language}`),
        null,
      );
      return;
    }
    const path = resolve(localesDir, language, manifest[namespace]);
    const i18n = require(path);
    callback(null, i18n);
  },
};
