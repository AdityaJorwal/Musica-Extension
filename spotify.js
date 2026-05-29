globalThis.spotify = {
  search: async function(query) {
    try {
      // Fetches live unauthenticated iTunes Music search catalog to populate Spotify metadata
      let url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&limit=15&media=music';
      let response = await fetch(url);
      let data = await response.json();
      
      let tracks = [];
      if (data && data.results) {
        for (let i = 0; i < data.results.length; i++) {
          let track = data.results[i];
          tracks.push({
            id: 'spotify_track_' + track.trackId,
            title: track.trackName || 'Unknown Title',
            artist: track.artistName || 'Unknown Artist',
            albumArt: track.artworkUrl100 || '',
            durationMs: track.trackTimeMillis || 180000
          });
        }
      }
      return JSON.stringify(tracks);
    } catch (e) {
      // Offline fallback mock data
      let fallback = [
        {
          id: 'spotify_track_mock1',
          title: query + ' (Acoustic Mock)',
          artist: 'Dynamic Scraper Artists',
          albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
          durationMs: 210000
        },
        {
          id: 'spotify_track_mock2',
          title: query + ' (Electronic Cover)',
          artist: 'Synthesizer Plugins',
          albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
          durationMs: 195000
        }
      ];
      return JSON.stringify(fallback);
    }
  }
};
