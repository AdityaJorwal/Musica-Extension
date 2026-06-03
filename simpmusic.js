/**
 * Musica Extension – SimpMusic Engine
 * Protocol v2: URL builder + response processor for SimpMusic lyrics.
 */
globalThis.simpmusic = {
  _durationSec: 0,

  getSearchUrls: function(title, artist, durationMs, trackId) {
    this._durationSec = Math.round(parseInt(durationMs || 0, 10) / 1000);
    
    var urls = [];
    
    // SimpMusic strictly requires a YouTube video ID
    if (trackId && trackId.length === 11 && !/[\\/\.\s]/.test(trackId)) {
      urls.push('https://api-lyrics.simpmusic.org/v1/' + encodeURIComponent(trackId));
    }
    
    return urls;
  },

  processLyricsResponse: function(body) {
    try {
      var res = JSON.parse(body);
      if (!res || !res.success || !Array.isArray(res.data) || res.data.length === 0) return '';
      
      var tracks = res.data;
      var targetDuration = this._durationSec;
      
      // Sort tracks by duration difference
      tracks.sort(function(a, b) {
        var diffA = Math.abs((a.duration || 0) - targetDuration);
        var diffB = Math.abs((b.duration || 0) - targetDuration);
        return diffA - diffB;
      });
      
      var best = tracks[0];
      if (best.syncedLyrics) return best.syncedLyrics.trim();
      if (best.plainLyrics) return best.plainLyrics.trim();
      return '';
    } catch (e) {
      return '';
    }
  }
};
