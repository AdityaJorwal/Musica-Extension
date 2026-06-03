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
          var duration = item.durationMs || item.duration || 0;
          var diff = Math.abs(duration - targetDuration);
          if (diff < minDiff) {
            minDiff = diff;
            best = item;
          }
        }
        
        var id = best ? best.id : null;
        if (id && (targetDuration <= 0 || minDiff < 15000)) {
          return 'https://lyrics.paxsenix.org/kugou/lyrics?id=' + encodeURIComponent(id) + '&word=true';
        }
        return '';
      }
      
      // Step 2: KuGou lyrics response
      if (data && data.lyrics) {
        return data.lyrics.trim();
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }
};
