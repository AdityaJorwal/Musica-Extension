/**
 * Musica Extension - YouTube Audio
 * Search via Invidious; playback resolves natively in Dart via youtube_explode.
 */
globalThis.youtube = {
  instances: [
    'https://inv.thepixora.com',
    'https://invidious.f5.si',
    'https://inv.nadeko.net',
    'https://yt.chocolatemoo53.com'
  ],

  getSearchUrls: function(query) {
    this._searchQuery = query || '';
    var musicQuery = query + ' song';
    return this.instances.map(function(instance) {
      return instance + '/api/v1/search?q=' +
        encodeURIComponent(musicQuery) +
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

        var score = this._scoreVideo(video, this._searchQuery);
        if (score < 20) continue;

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
          source_extension: 'youtube',
          _rankScore: score
        });
      }

      tracks.sort(function(a, b) {
        return (b._rankScore || 0) - (a._rankScore || 0);
      });

      for (var j = 0; j < tracks.length; j++) {
        delete tracks[j]._rankScore;
      }

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

  _scoreVideo: function(video, query) {
    var tokens = this._normalise(query).split(' ').filter(function(t) {
      return t.length > 1;
    });
    if (tokens.length === 0) return 0;

    var haystack = this._normalise(
      (video.title || '') + ' ' + (video.author || '')
    );
    var aliases = {
      sona: ['sohna'],
      sohna: ['sona'],
      phul: ['phool', 'ful', 'phull'],
      phool: ['phul', 'ful']
    };
    var score = 0;
    var matched = 0;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      var found = haystack.indexOf(token) !== -1;
      if (!found) {
        var list = aliases[token] || [];
        for (var j = 0; j < list.length; j++) {
          if (haystack.indexOf(list[j]) !== -1) {
            found = true;
            break;
          }
        }
      }
      if (found) {
        matched++;
        score += 18;
      }
    }

    if (matched === tokens.length) score += 30;
    if (matched <= 1 && tokens.length >= 2) score -= 25;

    var bad = ['cover', 'karaoke', 'remix', 'live', 'vlog', 'reaction'];
    for (var b = 0; b < bad.length; b++) {
      if (haystack.indexOf(bad[b]) !== -1) score -= 15;
    }

    return score;
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
        if (mime.indexOf('mp4') !== -1 && bitrate >= bestBitrate) {
          bestBitrate = bitrate;
          bestUrl = url;
        } else if (!bestUrl && bitrate > bestBitrate) {
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
