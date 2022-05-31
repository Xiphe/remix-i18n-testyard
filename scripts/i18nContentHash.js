const { resolve, relative } = require('node:path');
const { readdir, readFile, writeFile } = require('node:fs/promises');
const { build, transformSync } = require('esbuild');

const root = resolve(__dirname, '..');
const localesRoot = resolve(root, 'app/locales');
const outdir = resolve(root, 'public/locales');

async function getAllLocales() {
  const localeDirs = await readdir(localesRoot);
  const namespaceFiles = await Promise.all(
    localeDirs.map((lang) => readdir(resolve(root, `app/locales/${lang}`))),
  );
  const allFiles = localeDirs.flatMap((locale, i) =>
    namespaceFiles[i].map((file) => resolve(localesRoot, locale, file)),
  );
  return allFiles;
}
const watch = process.argv.includes('-w') || process.argv.includes('--watch');

const template = `(function() {
  const i18n = :I18N;
  if (typeof module === 'object' && module.exports) {
    module.exports = i18n;
  } else {
    window.__registerI18nResource(
      document.currentScript,
      ':LANG',
      ':NS',
      i18n
    );
  }
})();`;

const i18nRgx = /\/([a-z]+)\/([a-z0-9-_]+)\.json$/;

async function run() {
  const entryPoints = await getAllLocales();
  const result = await build({
    entryPoints,
    outdir,
    outbase: localesRoot,
    entryNames: '[dir]/[name]-[hash]',
    metafile: true,
    minify: true,
    watch: watch && {
      onRebuild(error) {
        if (!error) {
          console.log('updated locales');
        }
      },
    },
    plugins: [
      {
        name: 'i18nContentHash',
        setup(build) {
          build.onEnd(async (result) => {
            if (!result.metafile) {
              return;
            }

            const outputs = result.metafile.outputs;
            const manifests = Object.entries(outputs)
              .map(([hashed, { entryPoint }]) => {
                const m = entryPoint.match(i18nRgx);

                return {
                  lang: m[1],
                  ns: m[2],
                  entry: relative(resolve(outdir, m[1]), hashed),
                };
              })
              .reduce((gpd, { lang, ns, entry }) => {
                if (!gpd[lang]) {
                  gpd[lang] = {};
                }
                gpd[lang][ns] = entry;
                return gpd;
              }, {});

            await Promise.all(
              Object.entries(manifests).map(([lang, content]) =>
                writeFile(
                  resolve(outdir, `manifest-${lang}.json`),
                  JSON.stringify(content),
                ),
              ),
            );
          });

          build.onLoad({ filter: /\.js/ }, async (args) => {
            let contents = await readFile(args.path, 'utf-8');

            if (!contents.toString().trim().length) {
              contents = '{}';
            }

            try {
              contents = JSON.parse(contents);
            } catch (err) {
              handleJsonError(err, contents, args.path);
            }

            const m = args.path.match(i18nRgx);
            if (!m) {
              throw new Error(
                `Unexpected lang file at ${relative(root, args.path)}`,
              );
            }

            return {
              contents: transformSync(
                template
                  .replace(':LANG', m[1])
                  .replace(':NS', m[2])
                  .replace(':I18N', JSON.stringify(contents)),
                { minify: true },
              ).code,
              loader: 'js',
            };
          });
        },
      },
    ],
  });

  if (watch) {
    const i = setInterval(async () => {
      const next = await getAllLocales();
      if (
        next.length !== entryPoints.length ||
        entryPoints.some((e) => !next.includes(e)) ||
        next.some((e) => !entryPoints.includes(e))
      ) {
        clearInterval(i);
        result.stop();
        run()
          .then(() => console.log('updated locales'))
          .catch(() => process.exit(1));
      }
    }, 2000);
  }
}

run()
  .then(() => watch && console.log('watching...'))
  .catch(() => process.exit(1));

function handleJsonError(err, contents, path) {
  if (!(err instanceof Error)) {
    return {
      errors: [{ text: String(err) }],
    };
  }
  let m = err.message.match(
    /Unexpected (token .|\n|\r)* in JSON at position ([0-9]+)/m,
  );
  if (!m) {
    m = err.message.match(/Unexpected ([a-z]+) in JSON at position ([0-9]+)/m);
  }
  if (!m) {
    return {
      errors: [{ text: err.message }],
    };
  }
  const lines = contents.split(/\n|\r|\n\r/g);
  let pos = parseInt(m[2], 10);
  let line = 1;
  while (pos > lines[0].length) {
    pos -= lines[0].length + 1;
    line++;
    lines.shift();
  }

  return {
    errors: [
      {
        text: `Unexpected ${m[1].replace(/\n/g, '\\n')}`,
        location: {
          file: path,
          namespace: 'file',
          line,
          column: pos + 1,
          length: 1,
          lineText: ' ' + lines[0],
        },
      },
    ],
  };
}
