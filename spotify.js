/**
 * Musica Extension – Spotify Catalog (iTunes metadata index)
 */
globalThis.spotify = {

  getSearchUrl: function(query) {
    this._searchQuery = query || '';
    return 'https://itunes.apple.com/search?term=' +
      encodeURIComponent(query) +
      '&limit=40&media=music&country=in';
  },

  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];

      if (data && data.results && data.results.length > 0) {
        for (var i = 0; i < data.results.length; i++) {
          var item = data.results[i];
          
          // Determine type based on iTunes wrapperType
          var entityType = 'song';
          if (item.wrapperType === 'collection') entityType = 'album';
          if (item.wrapperType === 'artist') entityType = 'artist';

          var title = item.trackName || item.collectionName || item.artistName;
          if (!title) continue;

          var art = (item.artworkUrl100 || '')
            .replace('100x100bb', '600x600bb')
            .replace('100x100', '600x600');

          tracks.push({
            id: 'itunes_' + (item.trackId || item.collectionId || item.artistId || i),
            title: title,
            artist: item.artistName || 'Various Artists',
            album: item.collectionName || '',
            albumArt: art,
            durationMs: item.trackTimeMillis || 180000,
            previewUrl: item.previewUrl || '',
            type: entityType, // 🎯 CRITICAL: Tells Dart where to render this card
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
