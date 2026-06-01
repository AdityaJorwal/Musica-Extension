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

  processSearchResponse: function(body, query) {
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

      tracks = this._filterByQuery(tracks, query || this._searchQuery);
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
    var cleanQuery = (query || '').toLowerCase().trim();
    if (!cleanQuery) return tracks;

    // Split query into individual phonetic search blocks
    var queryTokens = cleanQuery.split(/\s+/).filter(function(t) { return t.length > 0; });
    if (queryTokens.length === 0) return tracks;

    // Helper function to calculate typographical edit distances (Levenshtein proxy)
    function getEditDistance(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      var matrix = [];
      for (var i = 0; i <= b.length; i++) matrix[i] = [i];
      for (var j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (var i = 1; i <= b.length; i++) {
        for (var j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            );
          }
        }
      }
      return matrix[b.length][a.length];
    }

    var scoredTracks = [];

    for (var index = 0; index < tracks.length; index++) {
      var track = tracks[index];
      var title = (track.title || '').toLowerCase();
      var artist = (track.artist || '').toLowerCase();
      var searchHaystack = title + ' ' + artist;

      var matchScore = 0;
      var completelyMatchedTokens = 0;

      for (var t = 0; t < queryTokens.length; t++) {
        var token = queryTokens[t];

        // Case 1: Exact word chunk match (Highest priority weight)
        if (searchHaystack.indexOf(token) !== -1) {
          matchScore += 50;
          completelyMatchedTokens++;
          continue;
        }

        // Case 2: Fuzzy phonetic match (Catches "akiyaan" vs "akhiyaan" / "gulab" vs "gulaab")
        var haystackWords = searchHaystack.split(/\s+/);
        var bestWordScore = 0;

        for (var w = 0; w < haystackWords.length; w++) {
          var word = haystackWords[w];
          if (word.length < 3) continue;

          var distance = getEditDistance(token, word);
          // If the word change variance is low, calculate it as a valid match threshold
          if (distance <= 2) {
            var proxyWeight = 30 - (distance * 10);
            if (proxyWeight > bestWordScore) bestWordScore = proxyWeight;
          }
        }

        if (bestWordScore > 0) {
          matchScore += bestWordScore;
          completelyMatchedTokens++;
        }
      }

      // 🎯 CRITICAL SELECTION GUARD OVERRIDE:
      // If we matched at least one prominent multi-word query token, let it pass the visibility gate!
      if (completelyMatchedTokens > 0 || cleanQuery.length <= 3) {
        // Reward absolute prefix matches (e.g., query "akhiyaan" matches exactly at the beginning of the title)
        if (title.startsWith(cleanQuery)) matchScore += 40;
        
        track.search_ranking_score = matchScore;
        scoredTracks.push(track);
      }
    }

    // Sort descending by calculated relevance weights
    return scoredTracks.sort(function(a, b) {
      return (b.search_ranking_score || 0) - (a.search_ranking_score || 0);
    });
  },

  getFallbackResults: function(query) {
    return '[]';
  }
};
