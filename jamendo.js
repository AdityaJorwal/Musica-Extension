/**
 * Musica Extension – Jamendo Sync
 * Protocol v2: Synchronous URL builder + response processor
 * Uses Jamendo v3.0 API (Creative Commons catalog).
 */
globalThis.jamendo = {

  /**
   * Returns the search URL for the given query.
   */
  getSearchUrl: function(query) {
    return 'https://api.jamendo.com/v3.0/tracks/?client_id=9edcd9bf&format=json&limit=20&search=' +
      encodeURIComponent(query);
  },

  /**
   * Processes the Jamendo search response body.
   */
  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];
      if (data && data.results && data.results.length > 0) {
        for (var i = 0; i < data.results.length; i++) {
          var item = data.results[i];
          if (!item.name) continue;

          tracks.push({
            id: 'jamendo_' + item.id,
            title: item.name,
            artist: item.artist_name || 'Unknown Artist',
            album: item.album_name || '',
            albumArt: item.album_image || item.image || '',
            durationMs: parseInt(item.duration || 180) * 1000,
            streamUrl: item.audio, // High-quality open CC MP3 path
            source_extension: 'jamendo'
          });
        }
      }
      return JSON.stringify(tracks);
    } catch(e) { 
      return '[]'; 
    }
  },

  getFallbackResults: function(query) { 
    return '[]'; 
  }
};
