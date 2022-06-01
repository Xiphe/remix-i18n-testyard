# An attempt to increase performance on remix pages with i18n

tries to solve the following two issues I see with remix-i18n

1. [Initial translation files are loaded to late](https://github.com/sergiodxa/remix-i18next/discussions/72)
2. [Translation files are not cached aggressively](https://github.com/sergiodxa/remix-i18next/discussions/73)

...by introducing a compiler for i18n that applies content hashes to the i18n files and
makes them store the translations in a way a new custom i18next backend (in the client)
can pick them up.

(Far from optimal. I'm just trying out stuff...)

A third issue is not covered here: [flash of untranslated content on frontend navigation to routes with new i18n requirements](https://github.com/remix-run/remix/discussions/3355)

## Development

Start the Remix development asset server, the Express server and the i18n compiler by running:

```sh
npm run dev
```
