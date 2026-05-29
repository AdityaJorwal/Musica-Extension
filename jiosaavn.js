/**
 * Musica Extension – JioSaavn (saavn.dev API)
 * Protocol v2: Synchronous URL builder + response processor
 * HTTP is handled by Dart; JS builds URLs and parses responses.
 *
 * Uses the open saavn.dev API which returns:
 *  - Song metadata (title, artist, album art, duration)
 *  - Direct stream URLs (up to 320kbps AAC) — no decryption needed!
 */
globalThis.jiosaavn = {

  /**
   * Returns the search URL for the given query.
   * saavn.dev is an open wrapper around JioSaavn's API.
   */
  getSearchUrl: function(query) {
    return 'https://saavn.dev/api/search/songs?query=' +
      encodeURIComponent(query) + '&limit=30&page=1';
  },

  /**
   * Processes the saavn.dev search response.
   * Extracts song metadata AND the highest-quality stream URL.
   * The streamUrl is embedded directly in each track so AudioManager
   * doesn't need a separate stream resolution step.
   */
  processSearchResponse: function(body) {
    try {
      var data = JSON.parse(body);

      if (!data.success || !data.data || !data.data.results) {
        return '[]';
      }

      var tracks = [];
      var results = data.data.results;

      for (var i = 0; i < results.length; i++) {
        var song = results[i];
        if (!song.name) continue;

        // Get highest quality download URL (last in the array = best quality)
        var streamUrl = '';
        if (song.downloadUrl && song.downloadUrl.length > 0) {
          var urls = song.downloadUrl;
          // Prefer 160kbps or 320kbps
          for (var q = urls.length - 1; q >= 0; q--) {
            if (urls[q] && urls[q].url) {
              streamUrl = urls[q].url;
              break;
            }
          }
        }

        // Get best album art URL (last = highest resolution)
        var albumArt = '';
        if (song.image && song.image.length > 0) {
          albumArt = song.image[song.image.length - 1].url || '';
        }

        // Build artist name string
        var artistName = 'Unknown Artist';
        if (song.artists && song.artists.primary && song.artists.primary.length > 0) {
          artistName = song.artists.primary.map(function(a) { return a.name; }).join(', ');
        }

        tracks.push({
          id: 'saavn_' + (song.id || i),
          title: song.name,
          artist: artistName,
          album: (song.album && song.album.name) ? song.album.name : '',
          albumArt: albumArt,
          durationMs: ((song.duration || 180)) * 1000,
          streamUrl: streamUrl,       // Direct 320kbps stream — use immediately!
          source_extension: 'jiosaavn'
        });
      }

      return JSON.stringify(tracks);
    } catch (e) {
      return '[]';
    }
  },

  /**
   * Offline fallback when API is unreachable.
   */
  getFallbackResults: function(query) {
    return JSON.stringify([
      {
        id: 'offline_saavn_' + encodeURIComponent(query),
        title: query,
        artist: 'Offline – Check Connection',
        albumArt: '',
        durationMs: 210000,
        streamUrl: ''
      }
    ]);
  }
};
