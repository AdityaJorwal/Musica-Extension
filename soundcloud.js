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
    var query = (title || '') + ' ' + (artist || '');
    return 'https://api-v2.soundcloud.com/search/tracks?q=' +
      encodeURIComponent(query.trim()) + '&client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6&limit=3';
  },

  processResolveResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.collection && data.collection.length > 0) {
        var track = data.collection[0];
        if (track.id) {
          return 'https://api.soundcloud.com/tracks/' + track.id +
            '/stream?client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6';
        }
      }
    } catch (e) {}
    return '';
  },

  /**
   * 4. THE FALLBACK LAYER: Synchronous static fallback.
   */
  resolveStream: function(title, artist, duration) {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }
};
