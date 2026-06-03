/**
 * Musica Extension – Paxsenix Musixmatch Engine
 * Protocol v2: Direct resolution for Musixmatch lyrics.
 */
globalThis.paxsenix_musixmatch = {

  getSearchUrls: function(title, artist, durationMs) {
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    var durationSec = Math.round(parseInt(durationMs || 0, 10) / 1000);
    
    var url = 'https://lyrics.paxsenix.org/musixmatch/lyrics?' +
              'q=' + encodeURIComponent(cleanTitle + ' ' + cleanArtist) +
              '&t=' + encodeURIComponent(cleanTitle) +
              '&a=' + encodeURIComponent(cleanArtist);
              
    if (durationSec > 0) {
      url += '&duration=' + durationSec;
    }
    
    return [url];
  },

  processLyricsResponse: function(body) {
    try {
      if (!body) return '';
      var trimmed = body.trim();
      
      if (trimmed.indexOf('{') === 0) {
        var data = JSON.parse(body);
        if (data.error || data.message || data.status === 'error') {
          return '';
        }
        if (data.lyrics) {
          return data.lyrics.trim();
        }
        return '';
      }
      
      return trimmed;
    } catch (e) {
      return '';
    }
  }
};
