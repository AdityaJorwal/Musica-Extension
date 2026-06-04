/**
 * Musica Extension – Paxsenix NetEase Engine
 * Protocol v2: Two-step resolution for NetEase lyrics.
 */
globalThis.paxsenix_netease = {
  _durationMs: 0,

  getSearchUrls: function(title, artist, durationMs) {
    this._durationMs = parseInt(durationMs || 0, 10);
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    return ['https://lyrics.paxsenix.org/netease/search?q=' + encodeURIComponent(cleanTitle + ' ' + cleanArtist)];
  },

  processLyricsResponse: function(body) {
    try {
      if (!body) return '';
      
      var data = JSON.parse(body);
      
      // Step 1: Search results
      if (data && data.result && Array.isArray(data.result.songs)) {
        var songs = data.result.songs;
        if (songs.length === 0) return '';
        var best = null;
        var minDiff = Infinity;
        var targetDuration = this._durationMs;
        
        for (var i = 0; i < songs.length; i++) {
          var item = songs[i];
          var itemDur = item.duration || 0;
          var tDur = targetDuration;
          if (itemDur > 10000) itemDur = Math.round(itemDur / 1000);
          if (tDur > 10000) tDur = Math.round(tDur / 1000);
          var diff = Math.abs(itemDur - tDur);
          if (diff < minDiff) {
            minDiff = diff;
            best = item;
          }
        }
        
        var bestDur = best ? (best.duration || 0) : 0;
        var finalTDur = targetDuration;
        if (bestDur > 10000) bestDur = Math.round(bestDur / 1000);
        if (finalTDur > 10000) finalTDur = Math.round(finalTDur / 1000);
        var minDiffSec = Math.abs(bestDur - finalTDur);
        
        if (best && (targetDuration <= 0 || minDiffSec < 15)) {
          return 'https://lyrics.paxsenix.org/netease/lyrics?id=' + encodeURIComponent(best.id);
        }
        return '';
      }
      
      // Step 2: NetEase lyrics response
      if (data) {
        if (data.klyric && data.klyric.lyric) {
          return data.klyric.lyric.trim();
        }
        if (data.lrc && data.lrc.lyric) {
          return data.lrc.lyric.trim();
        }
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }
};
