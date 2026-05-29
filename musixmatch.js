/**
 * Musica Extension – Musixmatch Fallback
 * Protocol v2: Synchronous URL builder + response processor for lyrics.
 */
globalThis.musixmatch = {

  /**
   * Returns the track search URL to find the Musixmatch track ID.
   */
  getSearchUrl: function(title, artist, durationMs) {
    var apiKey = "2d5672e8113264abda9197c88b7764f6";
    return 'https://api.musixmatch.com/ws/1.1/track.search?q_track=' + encodeURIComponent(title) +
      '&q_artist=' + encodeURIComponent(artist) + '&page_size=1&format=json&apikey=' + apiKey;
  },

  /**
   * Processes the search response and extracts track ID.
   */
  processLyricsResponse: function(body) {
    try {
      var data = JSON.parse(body);
      var trackList = data.message.body.track_list;
      if (trackList && trackList.length > 0) {
        // Return track ID as a JSON reference string
        return JSON.stringify({
          hasLyrics: true,
          id: trackList[0].track.track_id
        });
      }
      return '';
    } catch (e) { 
      return ''; 
    }
  }
};
