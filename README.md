# Musica Extension Repository

Musica is offline-first. Installing this repository adds optional network-backed
search, streaming, and lyrics providers without bundling those providers into
the Flutter app.

## Install

Add either the repository root URL:

```text
https://raw.githubusercontent.com/AdityaJorwal/Musica-Extension/main
```

or a local checkout folder. Musica also accepts a direct URL or path to
`private-extensions.json`.

## Provider Protocol

Each JavaScript file exposes `globalThis.<id>`.

- Search providers expose `getSearchUrl(query)` or `getSearchUrls(query)`, plus
  `processSearchResponse(body)`.
- Stream resolvers expose `getResolveUrl(title, artist, duration)` or
  `getTrackResolveUrls(resourceId)`, plus `processResolveResponse(body)`.
- Lyrics providers expose `getSearchUrl(title, artist, durationMs)`, plus
  `processLyricsResponse(body)`.

The Dart app owns HTTP requests. JavaScript files only build URLs and parse
responses, keeping the sandbox synchronous and small.
