/**
 * Musica Extension – Lyrics.ovh Engine
 * Protocol v2: Synchronous URL builder + response processor for lyrics.
 * Uses lyrics.ovh completely free public API (no key needed).
 */
globalThis.genius = {

  /**
   * Returns the lyrics.ovh search URL.
   * Format: https://api.lyrics.ovh/v1/{artist}/{title}
   */
  getSearchUrl: function(title, artist, durationMs) {
    var a = (artist || 'Unknown').trim();
    var t = (title || '').trim();
    // Remove common bracketed suffixes like (feat. xxx), [Official Video], etc.
    t = t.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim();
    return 'https://api.lyrics.ovh/v1/' + encodeURIComponent(a) + '/' + encodeURIComponent(t);
  },

  /**
   * Parses the lyrics.ovh response which returns { lyrics: "..." }.
   */
  processLyricsResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.lyrics && data.lyrics.trim().length > 10) {
        return data.lyrics.trim();
      }
      return '';
    } catch (e) {
      return '';
    }
  }
};
