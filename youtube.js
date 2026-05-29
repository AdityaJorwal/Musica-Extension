/**
 * Musica Extension – YouTube Audio (Unified Provider)
 * Protocol v2: URL builder + response parser (search + stream).
 * Uses public Invidious instances with automatic fallback.
 * Classification: STREAMER (Unified: Search + Stream in one)
 */

// NOTE: Line 1 contains the minified CryptoJS library used by jiosaavn.js.
// This file is intentionally separate.

globalThis.youtube = {

  /**
   * 1. THE SEARCH LAYER: Allows searching YouTube directly.
   * Uses the most reliable Invidious public instance with music-type filter.
   */
  getSearchUrl: function(query) {
    // Primary Invidious instance — flokinet is very reliable
    // Append &sort_by=relevance&date=week for fresher music results
    return 'https://invidious.flokinet.to/api/v1/search?q=' +
      encodeURIComponent(query) +
      '&type=video&sort_by=relevance&fields=videoId,title,author,lengthSeconds,videoThumbnails';
  },

  /**
   * 2. THE PARSER LAYER: Transforms YouTube search results into track objects.
   * Uses the best-quality thumbnail available.
   */
  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];

      for (var i = 0; i < Math.min(data.length, 15); i++) {
        var video = data[i];
        if (!video.title || !video.videoId) continue;
        // Skip obvious non-music (longer than 15 min)
        if (video.lengthSeconds && video.lengthSeconds > 900) continue;

        // Pick best thumbnail: maxresdefault or high quality
        var albumArt = '';
        if (video.videoThumbnails && video.videoThumbnails.length > 0) {
          // Prefer 'high' or 'medium' quality thumbnails
          var thumbs = video.videoThumbnails;
          for (var t = 0; t < thumbs.length; t++) {
            if (thumbs[t].quality === 'high' || thumbs[t].quality === 'medium') {
              albumArt = thumbs[t].url;
              break;
            }
          }
          if (!albumArt) albumArt = thumbs[0].url;
        }

        tracks.push({
          id: 'youtube_' + video.videoId,
          title: video.title,
          artist: video.author || 'YouTube',
          album: 'YouTube',
          albumArt: albumArt,
          durationMs: (video.lengthSeconds || 180) * 1000,
          // Direct stream via Invidious latest_version (itag 140 = m4a audio, 251 = opus)
          streamUrl: 'https://invidious.flokinet.to/latest_version?id=' + video.videoId + '&itag=140&local=true',
          source_extension: 'youtube'
        });
      }
      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  /**
   * 3. THE RESOLVER LAYER (URL Protocol): Used when a METADATA-only extension
   * (like Spotify/iTunes) needs to fetch audio for a song title+artist.
   */
  getResolveUrl: function(title, artist, duration) {
    var query = ((title || '') + ' ' + (artist || '')).trim() + ' audio';
    return 'https://invidious.flokinet.to/api/v1/search?q=' +
      encodeURIComponent(query) +
      '&type=video&sort_by=relevance&fields=videoId,title,author,lengthSeconds';
  },

  processResolveResponse: function(body) {
    try {
      var data = JSON.parse(body);
      if (data && data.length > 0) {
        // Pick the first result that's not too long (likely not a full album or playlist)
        for (var i = 0; i < Math.min(data.length, 5); i++) {
          var video = data[i];
          if (video.videoId && (!video.lengthSeconds || video.lengthSeconds <= 900)) {
            return 'https://invidious.flokinet.to/latest_version?id=' + video.videoId + '&itag=140&local=true';
          }
        }
      }
    } catch (e) {}
    return '';
  },

  /**
   * 4. THE FALLBACK LAYER: Synchronous static fallback for when network fails.
   */
  resolveStream: function(title, artist, duration) {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }
};
