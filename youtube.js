/**
 * Musica Extension - YouTube Audio
 * Protocol v3: ordered search failover + track-specific audio resolution.
 *
 * The public hosts below are drawn from the official Invidious instance list.
 * Public instances can still fail temporarily, so Dart tries them in order.
 */
globalThis.youtube = {
  instances: [
    'https://inv.thepixora.com',
    'https://yt.chocolatemoo53.com',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de'
  ],

  getSearchUrls: function(query) {
    return this.instances.map(function(instance) {
      return instance + '/api/v1/search?q=' +
        encodeURIComponent(query) +
        '&type=video&sort_by=relevance&fields=videoId,title,author,lengthSeconds,videoThumbnails';
    });
  },

  getTrackResolveUrls: function(videoId) {
    return this.instances.map(function(instance) {
      return instance + '/api/v1/videos/' +
        encodeURIComponent(videoId) +
        '?fields=adaptiveFormats,formatStreams';
    });
  },

  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];

      for (var i = 0; i < Math.min(data.length, 20); i++) {
        var video = data[i];
        if (!video.title || !video.videoId) continue;
        if (video.lengthSeconds && video.lengthSeconds > 900) continue;

        var albumArt = '';
        var thumbs = video.videoThumbnails || [];
        for (var t = 0; t < thumbs.length; t++) {
          if (thumbs[t].quality === 'high' || thumbs[t].quality === 'medium') {
            albumArt = thumbs[t].url;
            break;
          }
        }
        if (!albumArt && thumbs.length > 0) albumArt = thumbs[0].url;

        tracks.push({
          id: 'youtube_' + video.videoId,
          resourceId: video.videoId,
          title: video.title,
          artist: video.author || 'YouTube',
          album: 'YouTube',
          albumArt: albumArt,
          durationMs: (video.lengthSeconds || 180) * 1000,
          streamUrl: '',
          source_extension: 'youtube'
        });
      }
      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  processResolveResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var formats = (data.adaptiveFormats || []).concat(data.formatStreams || []);
      var bestUrl = '';
      var bestBitrate = -1;

      for (var i = 0; i < formats.length; i++) {
        var format = formats[i] || {};
        var mime = format.type || format.mimeType || '';
        var url = format.url || '';
        var bitrate = parseInt(format.bitrate || 0, 10);

        if (!url || mime.indexOf('audio/') !== 0) continue;
        if (bitrate > bestBitrate) {
          bestBitrate = bitrate;
          bestUrl = url;
        }
      }
      return bestUrl;
    } catch (e) {
      return '';
    }
  },

  getFallbackResults: function(query) {
    return '[]';
  }
};
