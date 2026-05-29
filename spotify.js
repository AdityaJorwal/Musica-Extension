/**
 * Musica Extension – iTunes/Spotify Catalog Search
 * Protocol v2: synchronous URL builder + response processor
 * HTTP is handled by Dart core; JS only builds URLs and parses responses.
 */
globalThis.spotify = {

  /**
   * Returns the iTunes search URL for the given query.
   * Uses Indian catalog (country=in) for better Hindi/Punjabi/regional results.
   */
  getSearchUrl: function(query) {
    // Primary: Indian store with broad search
    return 'https://itunes.apple.com/search?term=' +
      encodeURIComponent(query) +
      '&limit=30&media=music&entity=song&country=in';
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

          // Upgrade artwork from 100x100bb to 600x600bb
          var art = (track.artworkUrl100 || '')
            .replace('100x100bb', '600x600bb')
            .replace('100x100', '600x600');

          tracks.push({
            id: 'itunes_' + (track.trackId || i),
            title: track.trackName,
            artist: track.artistName || 'Unknown Artist',
            album: track.collectionName || '',
            albumArt: art,
            durationMs: track.trackTimeMillis || 180000,
            previewUrl: track.previewUrl || ''
          });
        }
      }

      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  /**
   * Offline fallback – called when the HTTP request fails.
   */
  getFallbackResults: function(query) {
    return JSON.stringify([
      {
        id: 'offline_1_' + encodeURIComponent(query),
        title: query,
        artist: 'Offline Mode – Check Connection',
        album: '',
        albumArt: '',
        durationMs: 210000
      }
    ]);
  }
};
