/**
 * Musica Extension – Paxsenix KuGou Engine
 * Protocol v2: Two-step resolution for KuGou lyrics via official unencrypted API.
 */
globalThis.paxsenix_kugou = {
  _durationMs: 0,

  getSearchUrls: function(title, artist, durationMs) {
    this._durationMs = parseInt(durationMs || 0, 10);
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    var urls = [];
    // official Kugou API requires strict separator formats
    urls.push('http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=' + encodeURIComponent(cleanTitle + ' - ' + cleanArtist) + '&duration=' + this._durationMs);
    urls.push('http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=' + encodeURIComponent(cleanArtist + ' - ' + cleanTitle) + '&duration=' + this._durationMs);
    urls.push('http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=' + encodeURIComponent(cleanTitle) + '&duration=' + this._durationMs);
    return urls;
  },

  processLyricsResponse: function(body) {
    // Helper to decode Base64 in pure JS
    function decodeBase64(str) {
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      var lookup = new Uint8Array(256);
      for (var i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
      }
      var bufferLength = str.length * 0.75;
      if (str[str.length - 1] === '=') {
        bufferLength--;
        if (str[str.length - 2] === '=') {
          bufferLength--;
        }
      }
      var bytes = new Uint8Array(bufferLength);
      var p = 0;
      for (var i = 0; i < str.length; i += 4) {
        var encoded1 = lookup[str.charCodeAt(i)];
        var encoded2 = lookup[str.charCodeAt(i + 1)];
        var encoded3 = lookup[str.charCodeAt(i + 2)];
        var encoded4 = lookup[str.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        if (p < bufferLength) {
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        }
        if (p < bufferLength) {
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
      }
      var utf8 = '';
      for (var i = 0; i < bytes.length; i++) {
        utf8 += String.fromCharCode(bytes[i]);
      }
      try {
        return decodeURIComponent(escape(utf8));
      } catch (e) {
        return utf8;
      }
    }

    try {
      if (!body) return '';
      var trimmed = body.trim();
      
      var data = JSON.parse(body);
      
      // Step 1a: Official search response
      if (data && Array.isArray(data.candidates)) {
        if (data.candidates.length === 0) return '';
        var best = null;
        var minDiff = Infinity;
        var targetDuration = this._durationMs;
        
        for (var i = 0; i < data.candidates.length; i++) {
          var item = data.candidates[i];
          var itemDur = item.duration || 0; // In milliseconds
          var diff = Math.abs(itemDur - targetDuration);
          if (diff < minDiff) {
            minDiff = diff;
            best = item;
          }
        }
        
        if (best && (targetDuration <= 0 || minDiff < 25000)) { // 25 seconds tolerance
          return 'https://lyrics.kugou.com/download?ver=1&client=pc&id=' + best.id + '&accesskey=' + best.accesskey + '&fmt=lrc&charset=utf8';
        }
        return '';
      }
      
      // Step 1b: Legacy array response
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
        
        if (id && (targetDuration <= 0 || minDiffSec < 25)) {
          return 'https://lyrics.paxsenix.org/kugou/lyrics?id=' + encodeURIComponent(id);
        }
        return '';
      }
      
      // Step 2: KuGou lyrics response (download endpoint)
      if (data) {
        if (data.content && data.fmt === 'lrc') {
          var decoded = decodeBase64(data.content);
          if (decoded.charCodeAt(0) === 0xFEFF) {
            decoded = decoded.substring(1); // Strip BOM
          }
          return decoded.trim();
        }
        if (data.lyric) return data.lyric.trim();
        if (data.lyrics) return data.lyrics.trim();
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }
};
