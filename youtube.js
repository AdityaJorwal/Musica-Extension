/**
 * Musica Extension – YouTube Stream Resolver
 * Returns a stream URL for a given track title/artist.
 * Protocol: synchronous function, returns URL string directly.
 *
 * NOTE: In production you would scrape/API YouTube here.
 * For testing, we return deterministic SoundHelix demo streams.
 */
globalThis.youtube = {
  resolveStream: function(title, artist, duration) {
    var streams = [
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
    ];

    // Deterministic selection based on title + artist so same song always maps to same stream
    var key = ((title || '') + (artist || ''));
    var hash = 0;
    for (var i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
    }
    var chosen = streams[hash % streams.length];

    // Return the URL string directly (NOT JSON-wrapped)
    return chosen;
  }
};
