/**
 * Musica Extension – Paxsenix KuGou Engine
 * Protocol v2: Two-step resolution for KuGou lyrics via Paxsenix.
 */
globalThis.paxsenix_kugou = {
  _durationMs: 0,

  getSearchUrls: function(title, artist, durationMs) {
    this._durationMs = parseInt(durationMs || 0, 10);
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    return ['https://lyrics.paxsenix.org/kugou/search?q=' + encodeURIComponent(cleanTitle + ' ' + cleanArtist)];
  },

  processLyricsResponse: function(body) {
    try {
      if (!body) return '';
      
      var data = JSON.parse(body);
      
      // Step 1: Search results
      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        var best = null;
        var minDiff = Infinity;
        var targetDuration = this._durationMs;
        
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          var itemDur = item.durationMs || item.duration || 0;
          var tDur = targetDuration;
          if (itemDur > 10000) itemDur = Math.round(itemDur / 1000);
          if (tDur > 10000) tDur = Math.round(tDur / 1000);
          var diff = Math.abs(itemDur - tDur);
          if (diff < minDiff) {
            minDiff = diff;
            best = item;
          }
        }
        
        var id = best ? (best.hash || best.id) : null;
        var bestDur = best ? (best.durationMs || best.duration || 0) : 0;
        var finalTDur = targetDuration;
        if (bestDur > 10000) bestDur = Math.round(bestDur / 1000);
        if (finalTDur > 10000) finalTDur = Math.round(finalTDur / 1000);
        var minDiffSec = Math.abs(bestDur - finalTDur);
        
        if (id && (targetDuration <= 0 || minDiffSec < 15)) {
          return 'https://lyrics.paxsenix.org/kugou/lyrics?id=' + encodeURIComponent(id);
        }
        return '';
      }
      
      // Step 2: KuGou lyrics response
      if (data) {
        if (data.lyric) return data.lyric.trim();
        if (data.lyrics) return data.lyrics.trim();
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }
};
