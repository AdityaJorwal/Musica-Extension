/**
 * Musica Extension – Unison Engine
 * Protocol v2: URL builder + response processor for Unison lyrics.
 */
globalThis.unison = {

  getSearchUrls: function(title, artist, durationMs, trackId) {
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    var durationSec = Math.round(parseInt(durationMs || 0, 10) / 1000);
    
    var urls = [];
    
    // Check if trackId is a YouTube video ID (11 characters)
    if (trackId && trackId.length === 11 && !/[\\/\.\s]/.test(trackId)) {
      urls.push('https://unison.boidu.dev/lyrics?v=' + encodeURIComponent(trackId));
    }
    
    // Fallback: Metadata-based URL
    var metadataUrl = 'https://unison.boidu.dev/lyrics?song=' + encodeURIComponent(cleanTitle) +
                      '&artist=' + encodeURIComponent(cleanArtist);
    if (durationSec > 0) {
      metadataUrl += '&duration=' + durationSec;
    }
    urls.push(metadataUrl);
    
    return urls;
  },

  processLyricsResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.success && data.data && data.data.lyrics) {
        return data.data.lyrics.trim();
      }
      return '';
    } catch (e) {
      return '';
    }
  }
};
