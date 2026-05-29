/**
 * Musica Extension – Gaana Engine
 * Protocol v2: Synchronous URL builder + response processor
 * Uses corrected unauthenticated search parameters.
 */
globalThis.gaana = {

  /**
   * Returns the search URL for the given query.
   */
  getSearchUrl: function(query) {
    return 'https://api.gaana.com/index.php?type=search&subtype=search_song&key=' +
      encodeURIComponent(query);
  },

  /**
   * Processes the Gaana search response body.
   */
  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];
      if (data && data.tracks && data.tracks.length > 0) {
        for (var i = 0; i < data.tracks.length; i++) {
          var item = data.tracks[i];
          if (!item.track_title) continue;

          tracks.push({
            id: 'gaana_' + item.track_id,
            title: item.track_title,
            artist: item.artist_name || 'Unknown Artist',
            album: item.album_title || '',
            albumArt: item.track_image || '',
            durationMs: parseInt(item.duration || 180) * 1000,
            source_extension: 'gaana'
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
