/**
 * Musica Extension – YouTube Stream Resolver (JioSaavn integration)
 * Protocol v2: URL builder + response parser.
 * Resolves any song searched via iTunes/Spotify into a high-quality (320kbps) JioSaavn stream.
 * Fallback: returns deterministic SoundHelix mock streams.
 */
globalThis.youtube = {

  /**
   * Returns the JioSaavn search URL to resolve this song.
   */
  getResolveUrl: function(title, artist, duration) {
    var query = (title || '') + ' ' + (artist || '');
    return 'https://saavn.dev/api/search/songs?query=' +
      encodeURIComponent(query.trim()) + '&limit=3&page=1';
  },

  /**
   * Parses the JioSaavn search response and returns the direct stream URL.
   */
  processResolveResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.success && data.data && data.data.results && data.data.results.length > 0) {
        var song = data.data.results[0];
        if (song.downloadUrl && song.downloadUrl.length > 0) {
          var urls = song.downloadUrl;
          // Prefer highest quality (320kbps/160kbps) which are last in the list
          for (var q = urls.length - 1; q >= 0; q--) {
            if (urls[q] && urls[q].url) {
              return urls[q].url;
            }
          }
        }
      }
    } catch (e) {}
    return '';
  },

  /**
   * Synchronous fallback (old protocol compatibility)
   */
  resolveStream: function(title, artist, duration) {
    var streams = [
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
    ];
    var key = ((title || '') + (artist || ''));
    var hash = 0;
    for (var i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
    }
    return streams[hash % streams.length];
  }
};
