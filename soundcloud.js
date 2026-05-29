/**
 * Musica Extension – SoundCloud Free Resolver
 * Protocol v2: URL builder + response parser.
 * Resolves any search query into a direct redirection SoundCloud stream URL.
 */
globalThis.soundcloud = {

  /**
   * Returns the search URL to find the track on SoundCloud.
   */
  getResolveUrl: function(title, artist, duration) {
    var query = (title || '') + ' ' + (artist || '');
    return 'https://api-v2.soundcloud.com/search/tracks?q=' +
      encodeURIComponent(query.trim()) + '&client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6&limit=3';
  },

  /**
   * Parses the search results and returns the direct progressive stream redirect URL.
   */
  processResolveResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.collection && data.collection.length > 0) {
        var track = data.collection[0];
        if (track.id) {
          // Direct progressive audio stream redirect URL
          return 'https://api.soundcloud.com/tracks/' + track.id +
            '/stream?client_id=IRnK0myxxLJdwXXjybXQo71mXyDGpaM6';
        }
      }
    } catch (e) {}
    return '';
  },

  /**
   * Synchronous fallback
   */
  resolveStream: function(title, artist, duration) {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }
};
