/**
 * Musica Extension – LrcLib Engine
 * Protocol v2: URL builder + response processor for synced LRC lyrics.
 */
globalThis.lrclib = {

  getSearchUrls: function(title, artist, durationMs) {
    // Surgical Title Cleansing: Strip out common streaming distribution tags
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    // Isolate the primary artist to prevent collaborator keyword clogging
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    this._resolveTitle = cleanTitle;
    this._resolveArtist = cleanArtist;
    this._resolveDurationMs = parseInt(durationMs || 0, 10);
    
    var durationSec = Math.round(this._resolveDurationMs / 1000);
    var urls = [];
    
    // URL 1: Strict get query if duration is valid
    if (durationSec > 0) {
      urls.push('https://lrclib.net/api/get?artist_name=' +
        encodeURIComponent(cleanArtist) +
        '&track_name=' + encodeURIComponent(cleanTitle) +
        '&duration=' + durationSec);
    }
    
    // URL 2: Broad search query fallback
    urls.push('https://lrclib.net/api/search?q=' +
      encodeURIComponent(cleanTitle + ' ' + cleanArtist));
      
    return urls;
  },

  getSearchUrl: function(title, artist, durationMs) {
    // Surgical Title Cleansing: Strip out common streaming distribution tags
    var cleanTitle = (title || '').replace(/(\s*-\s*Topic|\s*-\s*Single|\s*-\s*EP|\s*\[.*?\]|\s*\(.*?\))|\s*-\s*From.*/gi, '').trim();
    // Isolate the primary artist to prevent collaborator keyword clogging
    var cleanArtist = (artist || '').split(/,|\s*&\s*|\s*feat\.?\s*/i)[0].trim();
    
    this._resolveTitle = cleanTitle;
    this._resolveArtist = cleanArtist;
    this._resolveDurationMs = parseInt(durationMs || 0, 10);
    
    return 'https://lrclib.net/api/search?track_name=' +
      encodeURIComponent(cleanTitle) +
      '&artist_name=' + encodeURIComponent(cleanArtist);
  },

  processLyricsResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var results = Array.isArray(data) ? data : (data ? [data] : []);
      if (results.length === 0) return '';

      var best = null;
      var bestScore = -1;

      for (var i = 0; i < results.length; i++) {
        var candidate = results[i];
        var score = this._scoreCandidate(candidate);
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }

      if (!best || bestScore < 15) return '';
      if (best.instrumental === true) {
        return '[00:00.00] (Instrumental)';
      }
      if (best.syncedLyrics) return best.syncedLyrics;
      if (best.plainLyrics) return best.plainLyrics;
      return '';
    } catch (e) {
      return '';
    }
  },

  _scoreCandidate: function(entry) {
    var targetTitle = this._normalise(this._resolveTitle);
    var targetArtist = this._normalise(this._resolveArtist);
    var title = this._normalise(entry.trackName || entry.name || '');
    var artist = this._normalise(entry.artistName || entry.artist || '');
    var score = 0;

    if (title === targetTitle) score += 70;
    if (artist === targetArtist) score += 40;
    if (title.indexOf(targetTitle) !== -1 || targetTitle.indexOf(title) !== -1) {
      score += 20;
    }
    if (artist.indexOf(targetArtist) !== -1 || targetArtist.indexOf(artist) !== -1) {
      score += 15;
    }

    if (this._resolveDurationMs && entry.duration) {
      var candidateMs = Math.round(parseFloat(entry.duration) * 1000);
      var delta = Math.abs(candidateMs - this._resolveDurationMs);
      if (delta <= 3000) score += 25;
      else if (delta <= 10000) score += 12;
      else if (delta > 45000) score -= 15;
    }

    if (entry.syncedLyrics) score += 30;

    var versionKeywords = ['female', 'male', 'remix', 'lofi', 'lullaby', 'cover', 'acoustic', 'instrumental', 'karaoke', 'slowed', 'reverb', 'sad version', 'reprise', 'unplugged', 'sped up'];
    for (var k = 0; k < versionKeywords.length; k++) {
      var kw = versionKeywords[k];
      if (title.indexOf(kw) !== -1 && targetTitle.indexOf(kw) === -1) {
        score -= 60;
      }
    }

    return score;
  },

  _normalise: function(value) {
    return (value || '')
      .toLowerCase()
      .replace(/&[^;]+;/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
};
