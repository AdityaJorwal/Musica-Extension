/**
 * Musica Extension – SoundCloud Free Resolver
 * Protocol v2: URL builder + response parser.
 * Resolves any search query into a direct redirection SoundCloud stream URL.
 */
globalThis.soundcloud = {

  /**
   * 1. THE SEARCH LAYER: Allows searching SoundCloud directly.
   */
  getSearchUrl: function(query) {
    return 'https://api-v2.soundcloud.com/search/tracks?q=' +
      encodeURIComponent(query) + '&client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6&limit=10';
  },

  /**
   * 2. THE PARSER LAYER: Transforms SoundCloud search results into track objects.
   */
  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];
      var collection = data.collection || [];

      for (var i = 0; i < collection.length; i++) {
        var track = collection[i];
        if (!track.title) continue;

        tracks.push({
          id: 'soundcloud_' + (track.id || i),
          title: track.title,
          artist: (track.user && track.user.username) ? track.user.username : 'Unknown Artist',
          album: 'SoundCloud Track',
          albumArt: track.artwork_url || (track.user ? track.user.avatar_url : ''),
          durationMs: track.duration || 180000,
          streamUrl: 'https://api.soundcloud.com/tracks/' + track.id + '/stream?client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6',
          source_extension: 'soundcloud'
        });
      }
      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  /**
   * 3. THE RESOLVER LAYER (URL Protocol): Used when another metadata-only extension 
   * (like Spotify) needs to fetch audio for a song.
   */
  getResolveUrl: function(title, artist, duration) {
    this._resolveTitle = title || '';
    this._resolveArtist = artist || '';
    this._resolveDurationMs = parseInt(duration || 0, 10) * 1000;
    var query = (title || '') + ' ' + (artist || '');
    return 'https://api-v2.soundcloud.com/search/tracks?q=' +
      encodeURIComponent(query.trim()) + '&client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6&limit=3';
  },

  processResolveResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.collection && data.collection.length > 0) {
        var track = null;
        var bestScore = -1;
        for (var i = 0; i < data.collection.length; i++) {
          var candidate = data.collection[i];
          var score = this._scoreCandidate(candidate);
          if (score > bestScore) {
            bestScore = score;
            track = candidate;
          }
        }
        if (track && track.id) {
          return 'https://api.soundcloud.com/tracks/' + track.id +
            '/stream?client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6';
        }
      }
    } catch (e) {}
    return '';
  },

  _scoreCandidate: function(track) {
    var targetTitle = this._normalise(this._resolveTitle);
    var targetArtist = this._normalise(this._resolveArtist);
    var title = this._normalise(track.title || '');
    var artist = this._normalise(track.user ? track.user.username : '');
    var score = 0;

    if (title === targetTitle) score += 80;
    if (title.indexOf(targetTitle) !== -1 || targetTitle.indexOf(title) !== -1) {
      score += 25;
    }
    var titleTokens = targetTitle.split(' ');
    for (var i = 0; i < titleTokens.length; i++) {
      if (titleTokens[i] && title.indexOf(titleTokens[i]) !== -1) score += 8;
    }
    var artistTokens = targetArtist.split(' ');
    for (var j = 0; j < artistTokens.length; j++) {
      if (artistTokens[j] && artist.indexOf(artistTokens[j]) !== -1) score += 6;
    }
    if (this._resolveDurationMs && track.duration) {
      var delta = Math.abs(parseInt(track.duration, 10) - this._resolveDurationMs);
      if (delta <= 3000) score += 18;
      else if (delta <= 10000) score += 8;
      else if (delta > 45000) score -= 12;
    }
    return score;
  },

  _normalise: function(value) {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
};
