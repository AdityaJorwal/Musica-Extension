/**
 * Musica Extension – Paxsenix Spotify Engine
 * Protocol v2: Two-step resolution for Spotify lyrics.
 */
globalThis.paxsenix_spotify = {
  _durationMs: 0,

  getSearchUrls: function(title, artist, durationMs, trackId) {
    this._durationMs = parseInt(durationMs || 0, 10);
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    var urls = [];
    var sId = trackId || '';
    if (sId.indexOf('spotify_') === 0) {
      sId = sId.substring(8);
    }
    if (sId && sId.length === 22 && /^[a-zA-Z0-9]+$/.test(sId)) {
      urls.push('https://lyrics.paxsenix.org/spotify/lyrics?id=' + encodeURIComponent(sId));
    }
    urls.push('https://lyrics.paxsenix.org/spotify/search?q=' + encodeURIComponent(cleanTitle + ' ' + cleanArtist));
    return urls;
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
      
      // Helper to parse duration string (e.g. "03:53") or millisecond number to seconds
      function parseToSeconds(val) {
        if (typeof val === 'string' && val.indexOf(':') !== -1) {
          var parts = val.split(':');
          return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        var num = parseInt(val || 0, 10);
        if (num > 10000) return Math.round(num / 1000);
        return num;
      }
      
      // Step 1: Search results
      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        var best = null;
        var minDiff = Infinity;
        var targetDurationSec = parseToSeconds(this._durationMs);
        
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          var itemDurSec = parseToSeconds(item.durationMs || item.duration || 0);
          var diff = Math.abs(itemDurSec - targetDurationSec);
          if (diff < minDiff) {
            minDiff = diff;
            best = item;
          }
        }
        
        var id = best ? (best.realId || best.id || best.trackId) : null;
        var bestDurSec = best ? parseToSeconds(best.durationMs || best.duration || 0) : 0;
        var minDiffSec = Math.abs(bestDurSec - targetDurationSec);
        
        if (id && (this._durationMs <= 0 || minDiffSec < 25)) {
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
