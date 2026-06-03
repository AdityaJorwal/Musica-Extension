/**
 * Musica Extension – Paxsenix Spotify Engine
 * Protocol v2: Two-step resolution for Spotify lyrics.
 */
globalThis.paxsenix_spotify = {
  _durationMs: 0,

  getSearchUrls: function(title, artist, durationMs) {
    this._durationMs = parseInt(durationMs || 0, 10);
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    return ['https://lyrics.paxsenix.org/spotify/search?q=' + encodeURIComponent(cleanTitle + ' ' + cleanArtist)];
  },

  processLyricsResponse: function(body) {
    try {
      if (!body) return '';
      var trimmed = body.trim();
      
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
        
        var id = best ? (best.realId || best.id) : null;
        if (id && (targetDuration <= 0 || minDiff < 15000)) {
          return 'https://lyrics.paxsenix.org/spotify/lyrics?id=' + encodeURIComponent(id);
        }
        return '';
      }
      
      // Step 2: Final Spotify Lyrics response
      // Structure: { lyrics: { lines: [ { startTimeMs: "1000", words: "..." } ] } }
      if (data && data.lyrics && Array.isArray(data.lyrics.lines)) {
        var lrcLines = [];
        var lines = data.lyrics.lines;
        
        for (var j = 0; j < lines.length; j++) {
          var line = lines[j];
          var startTimeMs = parseInt(line.startTimeMs || 0, 10);
          var words = line.words || '';
          
          var minutes = Math.floor(startTimeMs / 60000);
          var seconds = Math.floor((startTimeMs % 60000) / 1000);
          var hundredths = Math.floor((startTimeMs % 1000) / 10);
          
          var timeStr = '[' + 
            (minutes < 10 ? '0' : '') + minutes + ':' + 
            (seconds < 10 ? '0' : '') + seconds + '.' + 
            (hundredths < 10 ? '0' : '') + hundredths + ']';
            
          lrcLines.push(timeStr + words);
        }
        return lrcLines.join('\n');
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }
};
