/**
 * Musica Extension – Genius Data
 * Protocol v2: Synchronous URL builder + response processor for lyrics.
 */
globalThis.genius = {

  /**
   * Returns the Genius multi-search endpoint URL.
   */
  getSearchUrl: function(title, artist, durationMs) {
    var query = (title || '') + ' ' + (artist || '');
    return 'https://genius.com/api/search/multi?q=' + encodeURIComponent(query.trim());
  },

  /**
   * Parses the search results and extracts the Genius page path.
   */
  processLyricsResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.response && data.response.sections) {
        var sections = data.response.sections;
        for (var s = 0; s < sections.length; s++) {
          var sec = sections[s];
          if (sec.type === 'song' || sec.type === 'top_hit') {
            var hits = sec.hits;
            if (hits && hits.length > 0) {
              var result = hits[0].result;
              if (result && result.path) {
                // Return page path so app can scrape/render if needed
                return JSON.stringify({
                  hasLyrics: true,
                  path: result.path,
                  title: result.title,
                  artist: result.artist_names
                });
              }
            }
          }
        }
      }
      return '';
    } catch (e) { 
      return ''; 
    }
  }
};
