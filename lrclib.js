/**
 * Musica Extension – LrcLib Engine
 * Protocol v2: URL builder + response processor for synced LRC lyrics.
 */
globalThis.lrclib = {

  getSearchUrl: function(title, artist, durationMs) {
    this._resolveTitle = title || '';
    this._resolveArtist = artist || '';
    this._resolveDurationMs = parseInt(durationMs || 0, 10);
    return 'https://lrclib.net/api/search?track_name=' +
      encodeURIComponent(title || '') +
      '&artist_name=' + encodeURIComponent(artist || '');
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
