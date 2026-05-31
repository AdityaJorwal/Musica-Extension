/**
 * Musica Extension – Spotify Catalog (iTunes metadata index)
 */
globalThis.spotify = {

  getSearchUrl: function(query) {
    this._searchQuery = query || '';
    return 'https://itunes.apple.com/search?term=' +
      encodeURIComponent(query) +
      '&limit=30&media=music&entity=song&country=in';
  },

  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];

      if (data && data.results && data.results.length > 0) {
        for (var i = 0; i < data.results.length; i++) {
          var track = data.results[i];
          if (!track.trackName) continue;

          var art = (track.artworkUrl100 || '')
            .replace('100x100bb', '1000x1000bb')
            .replace('100x100', '1000x1000');

          tracks.push({
            id: 'itunes_' + (track.trackId || i),
            title: track.trackName,
            artist: track.artistName || 'Unknown Artist',
            album: track.collectionName || '',
            albumArt: art,
            durationMs: track.trackTimeMillis || 180000,
            previewUrl: track.previewUrl || '',
            source_extension: 'spotify',
            apiIndex: i,
            api_index: i
          });
        }
      }

      tracks = this._filterByQuery(tracks, this._searchQuery);
      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  _normalise: function(value) {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  _filterByQuery: function(tracks, query) {
    var tokens = this._normalise(query).split(' ').filter(function(t) {
      return t.length > 1;
    });
    if (tokens.length === 0) return tracks;

    var aliases = {
      sona: ['sohna'],
      sohna: ['sona'],
      phul: ['phool', 'ful', 'phull'],
      phool: ['phul', 'ful']
    };

    function matchesToken(haystack, token) {
      if (haystack.indexOf(token) !== -1) return true;
      var list = aliases[token] || [];
      for (var i = 0; i < list.length; i++) {
        if (haystack.indexOf(list[i]) !== -1) return true;
      }
      return false;
    }

    return tracks.filter(function(track) {
      var haystack = spotify._normalise(
        (track.title || '') + ' ' + (track.artist || '')
      );
      var matched = 0;
      for (var i = 0; i < tokens.length; i++) {
        if (matchesToken(haystack, tokens[i])) matched++;
      }
      return matched >= tokens.length;
    });
  },

  getFallbackResults: function(query) {
    return '[]';
  }
};
