/**
 * Musica Extension – Spotify/iTunes Catalog Search
 * Protocol v2: synchronous URL builder + response processor
 * HTTP is handled by Dart core; JS only builds URLs and parses responses.
 */
globalThis.spotify = {

  /**
   * Returns the iTunes search URL for the given query.
   * Dart will make this HTTP request and pass the body to processSearchResponse().
   */
  getSearchUrl: function(query) {
    return 'https://itunes.apple.com/search?term=' +
      encodeURIComponent(query) +
      '&limit=25&media=music&entity=song';
  },

  /**
   * Receives the raw HTTP response body from Dart and returns a JSON-encoded
   * array of track objects.
   */
  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];

      if (data && data.results && data.results.length > 0) {
        for (var i = 0; i < data.results.length; i++) {
          var track = data.results[i];
          if (!track.trackName) continue;

          // Upgrade artwork from 100x100 to 300x300
          var art = (track.artworkUrl100 || '').replace('100x100bb', '300x300bb');

          tracks.push({
            id: 'itunes_' + (track.trackId || i),
            title: track.trackName,
            artist: track.artistName || 'Unknown Artist',
            album: track.collectionName || '',
            albumArt: art,
            durationMs: track.trackTimeMillis || 180000
          });
        }
      }

      return JSON.stringify(tracks);
    } catch (e) {
      // Return empty array on parse error
      return '[]';
    }
  },

  /**
   * Offline fallback – called when the HTTP request fails.
   */
  getFallbackResults: function(query) {
    var fallback = [
      {
        id: 'offline_1_' + query,
        title: query,
        artist: 'Offline Mode',
        album: '',
        albumArt: '',
        durationMs: 210000
      },
      {
        id: 'offline_2_' + query,
        title: query + ' (Remix)',
        artist: 'Offline Mode',
        album: '',
        albumArt: '',
        durationMs: 195000
      }
    ];
    return JSON.stringify(fallback);
  }
};
