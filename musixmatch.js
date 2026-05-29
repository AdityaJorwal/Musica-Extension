/**
 * Musica Extension – ChartLyrics Lyrics Engine
 * Protocol v2: Synchronous URL builder + response processor for lyrics.
 * Uses ChartLyrics public API (no key required) to fetch actual lyric text.
 */
globalThis.musixmatch = {

  /**
   * Returns the ChartLyrics search URL.
   * ChartLyrics SearchLyric is a free public REST API.
   */
  getSearchUrl: function(title, artist, durationMs) {
    // SearchLyricDirect returns the LyricText directly
    return 'http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=' +
      encodeURIComponent((artist || '').trim()) +
      '&song=' + encodeURIComponent((title || '').trim());
  },

  /**
   * Processes the ChartLyrics XML response and extracts the lyric text.
   * The response is XML: <GetLyricResult><LyricChecksum>...<LyricSong>...<LyricArtist>...<LyricText>LYRICS</LyricText>...
   */
  processLyricsResponse: function(body) {
    try {
      if (!body || body.trim().length === 0) return '';

      // Extract LyricText from XML using regex (no DOM available in QuickJS)
      var match = body.match(/<LyricText>([\s\S]*?)<\/LyricText>/);
      if (match && match[1]) {
        var lyrics = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#xD;/g, '')
          .trim();
        if (lyrics.length > 10) return lyrics;
      }
      return '';
    } catch (e) {
      return '';
    }
  }
};
