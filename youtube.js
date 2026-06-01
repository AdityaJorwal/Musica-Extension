/**
 * Musica Extension - YouTube Music
 */
globalThis.youtube = {
  getSearchUrls: function(query) {
    var q = encodeURIComponent(query || '');
    return [
      'https://api.piped.private.coffee/search?q=' + q + '&filter=music_songs',
      'https://inv.thepixora.com/api/v1/search?q=' + q + '&type=video',
      'https://pipedapi.kavin.rocks/search?q=' + q + '&filter=music_songs',
      'https://pipedapi.moomoo.me/search?q=' + q + '&filter=music_songs',
      'https://piped-api.lunar.icu/search?q=' + q + '&filter=music_songs',
      'https://pipedapi.syncit.xyz/search?q=' + q + '&filter=music_songs',
      'https://api.piped.yt/search?q=' + q + '&filter=music_songs'
    ];
  },

  getTrackResolveUrls: function(videoId) {
    return [];
  },

  processSearchResponse: function(body) {
    try {
      var items = JSON.parse(body);
      if (!Array.isArray(items)) {
        if (items.items && Array.isArray(items.items)) {
          items = items.items;
        } else {
          return '[]';
        }
      }
      
      var tracks = [];
      for (var i = 0; i < Math.min(items.length, 20); i++) {
        var item = items[i];
        if (!item) continue;
        
        // Normalize Invidious format to Piped format
        if (item.videoId && !item.url) {
          item.url = '/watch?v=' + item.videoId;
        }
        if (item.author && !item.uploaderName) {
          item.uploaderName = item.author;
        }
        if (item.lengthSeconds && !item.duration) {
          item.duration = item.lengthSeconds;
        }
        if (item.videoThumbnails && item.videoThumbnails.length > 0 && !item.thumbnail) {
          item.thumbnail = item.videoThumbnails[0].url;
        }
        
        if (!item.url) continue;
        
        var videoId = '';
        if (item.url.indexOf('v=') !== -1) {
          videoId = item.url.split('v=')[1];
        } else if (item.url.indexOf('/streams/') !== -1) {
          videoId = item.url.split('/streams/')[1];
        } else {
          videoId = item.url.replace(/^\//, '');
        }
        if (!videoId) continue;
        
        var title = item.title || 'Unknown Song';
        var artist = item.uploaderName || item.uploader || 'Unknown Artist';
        var durationMs = (item.duration || 180) * 1000;
        
        var albumArt = item.thumbnail || 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';
        if (albumArt.indexOf('=w') !== -1) {
          albumArt = albumArt.split('=w')[0] + '=w544-h544-l90-rj';
        } else if (albumArt.indexOf('lh3.googleusercontent.com') !== -1) {
          albumArt = albumArt + '=w544-h544-l90-rj';
        }
        
        var cleanTitle = title.replace(/(\s*-\s*Topic|\s*\[.*?\]|\s*\(.*?\))/gi, '').trim();
        var cleanArtist = artist.replace(/\s*-\s*Topic/gi, '').trim();
        
        tracks.push({
          id: 'youtube_' + videoId,
          resourceId: videoId,
          title: cleanTitle,
          artist: cleanArtist,
          album: item.album || 'YouTube Single',
          albumArt: albumArt,
          durationMs: durationMs,
          streamUrl: '',
          type: 'song',
          source_extension: 'youtube',
          isOfficial: item.uploaderVerified || false,
          apiIndex: i,
          api_index: i
        });
      }
      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  _parseDuration: function(durStr) {
    if (!durStr) return 180;
    var parts = durStr.split(':');
    var seconds = 0;
    if (parts.length === 2) {
      seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else if (parts.length === 3) {
      seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    }
    return seconds || 180;
  },

  getRecommendationsUrl: function(videoId) {
    return 'youtubei/v1/next?videoId=' + encodeURIComponent(videoId);
  },

  processRecommendationsResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var recommendedTracks = [];

      if (data.contents && data.contents.singleColumnWatchNextResults) {
        var items = [];
        
        function findTiles(node) {
          if (!node) return;
          if (typeof node === 'object') {
            if (node.tileRenderer) {
              items.push(node.tileRenderer);
            }
            for (var key in node) {
              if (node.hasOwnProperty(key)) {
                findTiles(node[key]);
              }
            }
          } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              findTiles(node[i]);
            }
          }
        }
        
        findTiles(data.contents.singleColumnWatchNextResults);
        
        for (var i = 0; i < Math.min(items.length, 12); i++) {
          var tile = items[i];
          if (!tile || !tile.onSelectCommand || !tile.onSelectCommand.watchEndpoint) continue;
          var videoId = tile.onSelectCommand.watchEndpoint.videoId;
          if (!videoId) continue;
          
          var title = '';
          var artist = 'YouTube Music';
          
          if (tile.metadata && tile.metadata.tileMetadataRenderer) {
            var meta = tile.metadata.tileMetadataRenderer;
            if (meta.title && meta.title.simpleText) {
              title = meta.title.simpleText;
            }
            try {
              if (meta.lines && meta.lines.length > 0 && meta.lines[0].lineRenderer && meta.lines[0].lineRenderer.items && meta.lines[0].lineRenderer.items.length > 0) {
                var lineItem = meta.lines[0].lineRenderer.items[0].lineItemRenderer;
                if (lineItem.text) {
                  artist = lineItem.text.simpleText || (lineItem.text.runs && lineItem.text.runs[0] ? lineItem.text.runs[0].text : 'YouTube Music');
                }
              }
            } catch(e) {}
          }
          
          if (!title || title === 'Up next' || title === 'Play all') continue;
          
          var cleanTitle = title.replace(/(\s*-\s*Topic|\s*\[.*?\]|\s*\(.*?\))/gi, '').trim();
          var cleanArtist = artist.replace(/\s*-\s*Topic/gi, '').trim();
          
          recommendedTracks.push({
            id: 'youtube_' + videoId,
            resourceId: videoId,
            title: cleanTitle,
            artist: cleanArtist,
            album: 'Recommended Radio',
            albumArt: 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg',
            durationMs: 200000,
            streamUrl: '',
            type: 'song',
            source_extension: 'youtube',
            isOfficial: true,
            apiIndex: i,
            api_index: i
          });
        }
      } else {
        var suggestions = data.relatedStreams || [];
        for (var i = 0; i < Math.min(suggestions.length, 5); i++) {
          var video = suggestions[i];
          if (!video.url || video.type !== 'video') continue;
          
          var extractedId = video.url.split('v=')[1] || '';
          if (!extractedId) continue;

          var squareArt = video.thumbnail || 'https://img.youtube.com/vi/' + extractedId + '/maxresdefault.jpg';
          if (squareArt.indexOf('=w') !== -1) {
            squareArt = squareArt.split('=w')[0] + '=w544-h544-l90-rj';
          } else if (squareArt.indexOf('lh3.googleusercontent.com') !== -1) {
            squareArt = squareArt + '=w544-h544-l90-rj';
          }

          recommendedTracks.push({
            id: 'youtube_' + extractedId,
            resourceId: extractedId,
            title: video.title.replace(/(\s*-\s*Topic|\s*\[.*?\]|\s*\(.*?\))/gi, '').trim(),
            artist: (video.uploaderName || 'YouTube Audio').replace(' - Topic', '').trim(),
            album: 'Recommended Radio',
            albumArt: squareArt,
            durationMs: (video.duration || 180) * 1000,
            streamUrl: '',
            type: 'song',
            source_extension: 'youtube',
            isOfficial: video.uploaderVerified || false,
            apiIndex: i,
            api_index: i
          });
        }
      }
      return JSON.stringify(recommendedTracks);
    } catch (e) {
      return '[]';
    }
  },

  getResolveUrls: function(title, artist, durationSeconds) {
    var vid = this._pendingVideoId || '';
    if (!vid) return [];
    return [
      'https://api.piped.private.coffee/streams/' + vid,
      'https://pipedapi.kavin.rocks/streams/' + vid,
      'https://pipedapi.moomoo.me/streams/' + vid,
      'https://piped-api.lunar.icu/streams/' + vid,
      'https://pipedapi.syncit.xyz/streams/' + vid,
      'https://pipedapi.tokhmi.xyz/streams/' + vid,
      'https://pipedapi.adminforge.de/streams/' + vid,
      'https://api.piped.yt/streams/' + vid,
      'https://pipedapi.reallyaweso.me/streams/' + vid
    ];
  },

  setResolveContext: function(videoId) {
    this._pendingVideoId = videoId || '';
  },

  processResolveResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var audioStreams = data.audioStreams || [];
      if (audioStreams.length === 0) return '';
      for (var i = 0; i < audioStreams.length; i++) {
        if ((audioStreams[i].mimeType || '').indexOf('audio/mp4') !== -1) {
          return audioStreams[i].url || '';
        }
      }
      return audioStreams[0].url || '';
    } catch (e) {
      return '';
    }
  },

  getFallbackResults: function(query) {
    return '[]';
  }
};
