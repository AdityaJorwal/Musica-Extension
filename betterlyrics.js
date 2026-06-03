/**
 * Musica Extension – BetterLyrics Engine
 * Protocol v2: URL builder + response processor for TTML and Kugou lyrics.
 */
globalThis.betterlyrics = {

  getSearchUrls: function(title, artist, durationMs) {
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    var durationSec = Math.round(parseInt(durationMs || 0, 10) / 1000);
    
    var urls = [];
    var queryParams = 's=' + encodeURIComponent(cleanTitle) + '&a=' + encodeURIComponent(cleanArtist);
    if (durationSec > 0) {
      queryParams += '&d=' + durationSec;
    }

    // URL 1: Standard TTML endpoint
    urls.push('https://lyrics-api.boidu.dev/getLyrics?' + queryParams);
    
    // URL 2: KuGou TTML endpoint
    urls.push('https://lyrics-api.boidu.dev/kugou/getLyrics?' + queryParams);
    
    return urls;
  },

  processLyricsResponse: function(body) {
    try {
      if (!body) return '';
      var trimmed = body.trim();
      if (trimmed.indexOf('<') === 0) {
        return trimmed; // Direct XML/TTML
      }
      var data = JSON.parse(body);
      if (data && data.ttml) {
        return data.ttml.trim();
      }
      return '';
    } catch (e) {
      return '';
    }
  }
};
