/**
 * Musica Extension – Spotify Catalog (iTunes metadata index)
 * Protocol v2: synchronous URL builder + response processor
 */
globalThis.spotify = {

  getSearchUrl: function(query) {
    return 'https://itunes.apple.com/search?term=' +
      encodeURIComponent(query) +
      '&limit=30&media=music&entity=song&country=in';
  },

  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];

      if (data && data.results && data.results.length > 0) {
        for (var i = 0; i < data.results.length; i++) {
          var track = data.results[i];
          if (!track.trackName) continue;

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
            previewUrl: track.previewUrl || '',
            source_extension: 'spotify'
          });
        }
      }

      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  getFallbackResults: function(query) {
    return '[]';
  }
};
