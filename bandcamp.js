/**
 * Musica Extension – Bandcamp Engine
 * Protocol v2: Synchronous URL builder + response processor
 */
globalThis.bandcamp = {

  /**
   * Returns the search autocomplete URL.
   */
  getSearchUrl: function(query) {
    return 'https://bandcamp.com/api/fuzzysearch/1/app_autocomplete?q=' +
      encodeURIComponent(query);
  },

  /**
   * Processes the Bandcamp search autocomplete response body.
   */
  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];
      if (data && data.results && data.results.length > 0) {
        for (var i = 0; i < data.results.length; i++) {
          var item = data.results[i];
          if (item.type !== 't') continue; // Only process tracks

          var trackUrl = item.url || '';
          var lastHttps = trackUrl.lastIndexOf("https://");
          if (lastHttps !== -1 && lastHttps > 0) {
            trackUrl = trackUrl.substring(lastHttps);
          }

          tracks.push({
            id: 'bandcamp_' + item.id,
            resourceId: trackUrl,
            title: item.name,
            artist: item.band_name || 'Unknown Artist',
            album: item.album_name || '',
            albumArt: item.img || '',
            durationMs: 180000, // Default duration fallback
            type: 'song',
            source_extension: 'bandcamp'
          });
        }
      }
      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  /**
   * Returns the track page URL to resolve the stream.
   */
  getTrackResolveUrls: function(trackUrl) {
    return [trackUrl];
  },

  /**
   * Processes the track page HTML to extract the progressive stream URL.
   */
  processResolveResponse: function(body) {
    try {
      var match = body.match(/&quot;mp3-128&quot;\s*:\s*&quot;(https?:[\s\S]*?)&quot;/);
      if (match) {
        return match[1].replace(/&amp;/g, '&');
      }
    } catch (e) {}
    return '';
  },

  getFallbackResults: function(query) {
    return '[]';
  }
};
