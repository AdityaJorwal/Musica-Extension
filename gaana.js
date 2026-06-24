/**
 * Musica Extension – Gaana Engine
 * Protocol v2: Synchronous URL builder + response processor
 * Scrapes metadata from gaana.com preloaded state.
 */
globalThis.gaana = {

  /**
   * Returns the search URL for the given query.
   */
  getSearchUrl: function(query) {
    return 'https://gaana.com/search/' + encodeURIComponent(query);
  },

  /**
   * Processes the Gaana search response body (HTML).
   */
  processSearchResponse: function(body) {
    try {
      var marker = 'window.__PRELOADED_STATE__ = ';
      var markerIndex = body.indexOf(marker);
      if (markerIndex === -1) return '[]';

      var startIndex = markerIndex + marker.length;
      var braceCount = 0;
      var jsonStr = '';
      for (var i = startIndex; i < body.length; i++) {
        var char = body.charAt(i);
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonStr = body.substring(startIndex, i + 1);
            break;
          }
        }
      }

      if (!jsonStr) return '[]';
      var state = JSON.parse(jsonStr);
      var tracks = [];

      if (state && state.search && state.search.searchAll && state.search.searchAll.data && state.search.searchAll.data.gr) {
        var grList = state.search.searchAll.data.gr;
        for (var g = 0; g < grList.length; g++) {
          var gr = grList[g];
          if (!gr || !gr.gd) continue;
          var gdList = gr.gd;
          for (var j = 0; j < gdList.length; j++) {
            var item = gdList[j];
            if (item.ty !== 'Track') continue;

            tracks.push({
              id: 'gaana_' + item.id,
              title: item.ti,
              artist: item.sti || 'Unknown Artist',
              album: '',
              albumArt: item.aw || '',
              durationMs: 180000, // Default duration fallback
              type: 'song',
              source_extension: 'gaana'
            });
          }
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
