/**
 * Musica Extension - YouTube Music InnerTube
 * Search directly targets official YouTube Music API nodes for 1:1 artwork and metadata.
 */
globalThis.youtube = {
  getSearchUrls: function(query) {
    this._searchQuery = query || '';
    return [
      'https://music.youtube.com/youtubei/v1/search?q=' + encodeURIComponent(query || '')
    ];
  },

  getTrackResolveUrls: function(videoId) {
    return [];
  },

  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var tracks = [];
      var items = [];

      // Navigate down InnerTube tabbed search results hierarchy to find the music shelf contents
      try {
        var sections = data.contents.tabbedSearchResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;
        for (var s = 0; s < sections.length; s++) {
          var section = sections[s];
          if (section.musicShelfRenderer) {
            items = section.musicShelfRenderer.contents || [];
            break;
          }
        }
      } catch (e) {
        // Alternative response structure shape check
        try {
          items = data.contents.searchResultPageRenderer.content.sectionListRenderer.contents[0].musicShelfRenderer.contents || [];
        } catch (err) {}
      }

      for (var i = 0; i < Math.min(items.length, 20); i++) {
        var item = items[i];
        if (!item || !item.musicResponsiveListItemRenderer) continue;
        var renderer = item.musicResponsiveListItemRenderer;

        // 1. Extract video ID
        var videoId = '';
        if (renderer.playlistItemData && renderer.playlistItemData.videoId) {
          videoId = renderer.playlistItemData.videoId;
        }
        if (!videoId) {
          try {
            videoId = renderer.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchEndpoint.videoId;
          } catch(e) {}
        }
        if (!videoId) continue;

        // 2. Extract title
        var title = '';
        try {
          var runs = renderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs;
          if (runs && runs.length > 0) {
            title = runs[0].text || '';
          }
        } catch (e) {}
        if (!title) continue;

        // 3. Extract Artist, Album and Duration from Flex column 1
        var artist = 'Unknown Artist';
        var album = 'Official Single';
        var durationMs = 180000;
        try {
          var metaRuns = renderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
          if (metaRuns && metaRuns.length > 0) {
            var textParts = [];
            var currentPart = [];
            for (var r = 0; r < metaRuns.length; r++) {
              var text = metaRuns[r].text;
              if (text === ' • ' || text === ' •') {
                textParts.push(currentPart.join('').trim());
                currentPart = [];
              } else {
                currentPart.push(text);
              }
            }
            if (currentPart.length > 0) {
              textParts.push(currentPart.join('').trim());
            }

            if (textParts.length >= 1) {
              artist = textParts[0];
            }
            if (textParts.length >= 2) {
              if (textParts[1].indexOf(':') !== -1) {
                durationMs = this._parseDuration(textParts[1]) * 1000;
              } else {
                album = textParts[1];
              }
            }
            if (textParts.length >= 3) {
              if (textParts[2].indexOf(':') !== -1) {
                durationMs = this._parseDuration(textParts[2]) * 1000;
              }
            }
          }
        } catch (e) {}

        // 4. Extract pristine 1:1 studio artwork hosted on lh3.googleusercontent.com
        var albumArt = '';
        try {
          var thumbnails = renderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails;
          if (thumbnails && thumbnails.length > 0) {
            var rawArt = thumbnails[thumbnails.length - 1].url || '';
            if (rawArt.indexOf('=w') !== -1) {
              albumArt = rawArt.split('=w')[0] + '=w544-h544-l90-rj';
            } else if (rawArt.indexOf('lh3.googleusercontent.com') !== -1) {
              albumArt = rawArt + '=w544-h544-l90-rj';
            } else {
              albumArt = rawArt;
            }
          }
        } catch (e) {}

        if (!albumArt) {
          albumArt = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';
        }

        // Clean up brackets, parentheses, Topic suffixes
        var cleanTitle = title.replace(/(\s*-\s*Topic|\s*\[.*?\]|\s*\(.*?\))/gi, '').trim();
        var cleanArtist = artist.replace(/\s*-\s*Topic/gi, '').trim();
        
        var isOfficialTrack = (artist || '').indexOf(' - Topic') !== -1;

        tracks.push({
          id: 'youtube_' + videoId,
          resourceId: videoId,
          title: cleanTitle,
          artist: cleanArtist,
          album: album,
          albumArt: albumArt,
          durationMs: durationMs,
          streamUrl: '',
          type: 'song',
          source_extension: 'youtube',
          isOfficial: isOfficialTrack,
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

      // 1. YouTube official InnerTube next format
      if (data.contents && data.contents.singleColumnWatchNextResults) {
        var items = [];
        
        // Helper to recursively find tileRenderer nodes
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
            durationMs: 200000, // typical track length placeholder
            streamUrl: '',
            type: 'song',
            source_extension: 'youtube',
            isOfficial: true,
            apiIndex: i,
            api_index: i
          });
        }
      } 
      // 2. Fallback to Piped suggestions format
      else {
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

  // getResolveUrls exposes Piped API endpoints for the video whose ID was set via setResolveContext.
  // js_sandbox._resolveViaUrls tries each URL in order and calls processResolveResponse on the first 200.
  getResolveUrls: function(title, artist, durationSeconds) {
    var vid = this._pendingVideoId || '';
    if (!vid) return [];
    return [
      'https://pipedapi.kavin.rocks/streams/' + vid,
      'https://pipedapi.moomoo.me/streams/' + vid,
      'https://piped-api.lunar.icu/streams/' + vid,
      'https://pipedapi.syncit.xyz/streams/' + vid,
      'https://pipedapi.tokhmi.xyz/streams/' + vid,
      'https://pipedapi.adminforge.de/streams/' + vid,
      'https://api.piped.yt/streams/' + vid,
      'https://pipedapi.reallyaweso.me/streams/' + vid,
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
