/**
 * Musica Extension – LrcLib Engine
 * Protocol v2: Synchronous URL builder + response processor for lyrics.
 */
globalThis.lrclib = {

  /**
   * Returns the lyrics lookup URL for a song.
   */
  getSearchUrl: function(title, artist, durationMs) {
    var durationSec = Math.round((durationMs || 180000) / 1000);
    return 'https://lrclib.net/api/get?track_name=' + encodeURIComponent(title) +
      '&artist_name=' + encodeURIComponent(artist) + '&duration=' + durationSec;
  },

  /**
   * Processes the LrcLib response body.
   * Returns synced lyrics string if available, otherwise plain text lyrics.
   */
  processLyricsResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data) {
        if (data.syncedLyrics) {
          return data.syncedLyrics;
        } else if (data.plainLyrics) {
          return data.plainLyrics;
        }
      }
      return '';
    } catch (e) { 
      return ''; 
    }
  }
};
