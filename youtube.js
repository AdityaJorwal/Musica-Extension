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
                durationMs = this._parseDuration(textParts[1]);
              } else {
                album = textParts[1];
              }
            }
            if (textParts.length >= 3) {
              if (textParts[2].indexOf(':') !== -1) {
                durationMs = this._parseDuration(textParts[2]);
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
          source_extension: 'youtube',
          isOfficial: isOfficialTrack || true,
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

  processResolveResponse: function(body) {
    return '';
  },

  getFallbackResults: function(query) {
    return '[]';
  }
};
