/**
 * Musica Extension – Paxsenix Apple Music Engine
 * Protocol v2: Two-step resolution for Apple Music lyrics.
 */
globalThis.paxsenix_apple = {
  _durationMs: 0,

  getSearchUrls: function(title, artist, durationMs) {
    this._durationMs = parseInt(durationMs || 0, 10);
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    return ['https://lyrics.paxsenix.org/apple-music/search?q=' + encodeURIComponent(cleanTitle + ' ' + cleanArtist)];
  },

  processLyricsResponse: function(body) {
    try {
      if (!body) return '';
      var trimmed = body.trim();
      
      // Step 2: Final response parsing
      if (trimmed.indexOf('<tt') === 0 || trimmed.indexOf('<?xml') === 0) {
        return trimmed; // Direct TTML XML
      }
      
      var data = JSON.parse(body);
      
      // Step 1: If search response (is array)
      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        var best = null;
        var minDiff = Infinity;
        var targetDuration = this._durationMs;
        
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
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
          return 'https://lyrics.paxsenix.org/apple-music/lyrics?id=' + encodeURIComponent(best.id) + '&ttml=true';
        }
        return '';
      }
      
      // Step 2 fallback: JSON wrapped content
      if (data.content) {
        if (typeof data.content === 'string') {
          return data.content; // Wrapped XML/TTML
        }
        if (Array.isArray(data.content)) {
          // Wrapped LRC array (AppleMusicLyricsResponse) -> convert to LRC string
          var lrcLines = [];
          for (var j = 0; j < data.content.length; j++) {
            var line = data.content[j];
            var timestamp = parseInt(line.timestamp || 0, 10);
            var minutes = Math.floor(timestamp / 60000);
            var seconds = Math.floor((timestamp % 60000) / 1000);
            var hundredths = Math.floor((timestamp % 1000) / 10);
            
            var timeStr = '[' + 
              (minutes < 10 ? '0' : '') + minutes + ':' + 
              (seconds < 10 ? '0' : '') + seconds + '.' + 
              (hundredths < 10 ? '0' : '') + hundredths + ']';
              
            var textParts = [];
            if (Array.isArray(line.text)) {
              for (var k = 0; k < line.text.length; k++) {
                if (line.text[k] && line.text[k].text) {
                  textParts.push(line.text[k].text.trim());
                }
              }
            }
            lrcLines.push(timeStr + textParts.join(' '));
          }
          return lrcLines.join('\n');
        }
      }
      return '';
    } catch (e) {
      return '';
    }
  }
};
