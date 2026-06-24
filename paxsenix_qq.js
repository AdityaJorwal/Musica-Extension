/**
 * Musica Extension – Paxsenix QQ Music Engine
 * Protocol v2: Two-step resolution for QQ Music lyrics via Paxsenix.
 */
globalThis.paxsenix_qq = {
  _durationMs: 0,

  getSearchUrls: function(title, artist, durationMs) {
    this._durationMs = parseInt(durationMs || 0, 10);
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    return ['https://lyrics.paxsenix.org/qq/search?q=' + encodeURIComponent(cleanTitle + ' ' + cleanArtist)];
  },

  processLyricsResponse: function(body) {
    try {
      if (!body) return '';
      var trimmed = body.trim();
      
      // If it is already a raw LRC string returned from the API (and not a JSON search array)
      if (trimmed.indexOf('[') === 0 && !/^\[\s*\{/.test(trimmed)) {
        return trimmed;
      }
      
      var data = JSON.parse(body);
      
      // If data parsed into a plain string starting with '['
      if (typeof data === 'string') {
        var cleanData = data.trim();
        if (cleanData.indexOf('[') === 0) {
          return cleanData;
        }
      }
      
      // Step 1: Search results
      if (data && data.data && data.data.song && Array.isArray(data.data.song.list)) {
        var songs = data.data.song.list;
        if (songs.length === 0) return '';
        var best = null;
        var minDiff = Infinity;
        var targetDuration = this._durationMs;
        
        for (var i = 0; i < songs.length; i++) {
          var item = songs[i];
          var itemDur = (item.interval || 0) * 1000;
          var diff = Math.abs(itemDur - targetDuration);
          if (diff < minDiff) {
            minDiff = diff;
            best = item;
          }
        }
        
        var id = best ? best.songmid : null;
        var bestDur = best ? (best.interval || 0) * 1000 : 0;
        var minDiffSec = Math.abs(bestDur - targetDuration) / 1000;
        
        if (id && (targetDuration <= 0 || minDiffSec < 15)) {
          return 'https://lyrics.paxsenix.org/qq/lyrics?id=' + encodeURIComponent(id);
        }
        return '';
      }
      
      // Step 2: Final QQ Music Lyrics response
      if (data && data.lyrics) {
        return data.lyrics.trim();
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }
};
