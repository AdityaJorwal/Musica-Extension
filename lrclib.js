/**
 * Musica Extension – LrcLib Engine
 * Protocol v2: Synchronous URL builder + response processor for lyrics.
 *
 * Strategy: Use /api/search (no duration) for best fuzzy title+artist match.
 * Much more reliable than /api/get which requires an exact duration match.
 */
globalThis.lrclib = {

  /**
   * Returns the LrcLib search URL (no duration — avoids 404/mismatch).
   * Results are sorted by best match; we take the first result.
   */
  getSearchUrl: function(title, artist, durationMs) {
    var q = (title || '') + ' ' + (artist || '');
    return 'https://lrclib.net/api/search?track_name=' + encodeURIComponent(title || '') +
      '&artist_name=' + encodeURIComponent(artist || '');
  },

  /**
   * Processes the LrcLib search response (array of results).
   * Picks the best match: prefers syncedLyrics, fallback to plainLyrics.
   */
  processLyricsResponse: function(body) {
    try {
      var data = JSON.parse(body);

      // Search endpoint returns an array
      if (Array.isArray(data) && data.length > 0) {
        // Prefer first result that has synced lyrics
        for (var i = 0; i < data.length; i++) {
          if (data[i].syncedLyrics) return data[i].syncedLyrics;
        }
        // Fallback: first result with plain lyrics
        for (var i = 0; i < data.length; i++) {
          if (data[i].plainLyrics) return data[i].plainLyrics;
        }
      }

      // Single-object response (direct get endpoint fallback)
      if (data && !Array.isArray(data)) {
        if (data.syncedLyrics) return data.syncedLyrics;
        if (data.plainLyrics) return data.plainLyrics;
      }

      return '';
    } catch (e) {
      return '';
    }
  }
};
