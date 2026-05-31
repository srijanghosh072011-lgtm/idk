/* ============================================================================
 * clubs.js  —  Club identity data
 * ----------------------------------------------------------------------------
 * The 2025-26 Premier League (first playable league). Colors drive the UI
 * theming; reputation drives finances and (later) AI ambition. Player ratings
 * and values are approximations for gameplay, not official figures.
 *
 * Other leagues (La Liga, Serie A, Bundesliga, Ligue 1) and players-only
 * leagues (Portugal, Saudi, MLS) are added in later data files.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;
  G.DATA = G.DATA || {};

  G.DATA.leagues = {
    eng: { id: 'eng', name: 'Premier League', country: 'England', tier: 1, playable: true }
  };

  // colors: primary is the main brand color (used as the themed accent),
  // secondary is the complementary color.
  G.DATA.clubs = [
    { id: 'liverpool', name: 'Liverpool', short: 'LIV', league: 'eng', reputation: 91,
      colors: { primary: '#C8102E', secondary: '#F6EB61' }, stadium: 'Anfield', capacity: 61276 },
    { id: 'mancity', name: 'Manchester City', short: 'MCI', league: 'eng', reputation: 92,
      colors: { primary: '#6CABDD', secondary: '#1C2C5B' }, stadium: 'Etihad Stadium', capacity: 53400 },
    { id: 'arsenal', name: 'Arsenal', short: 'ARS', league: 'eng', reputation: 89,
      colors: { primary: '#EF0107', secondary: '#FFFFFF' }, stadium: 'Emirates Stadium', capacity: 60704 },
    { id: 'chelsea', name: 'Chelsea', short: 'CHE', league: 'eng', reputation: 86,
      colors: { primary: '#1f7ae0', secondary: '#FFFFFF' }, stadium: 'Stamford Bridge', capacity: 40341 },
    { id: 'manutd', name: 'Manchester United', short: 'MUN', league: 'eng', reputation: 85,
      colors: { primary: '#DA291C', secondary: '#FBE122' }, stadium: 'Old Trafford', capacity: 74310 },
    { id: 'tottenham', name: 'Tottenham Hotspur', short: 'TOT', league: 'eng', reputation: 83,
      colors: { primary: '#8aa1d6', secondary: '#132257' }, stadium: 'Tottenham Hotspur Stadium', capacity: 62850 },
    { id: 'newcastle', name: 'Newcastle United', short: 'NEW', league: 'eng', reputation: 82,
      colors: { primary: '#d4d4d4', secondary: '#241F20' }, stadium: 'St James’ Park', capacity: 52305 },
    { id: 'astonvilla', name: 'Aston Villa', short: 'AVL', league: 'eng', reputation: 80,
      colors: { primary: '#95BFE5', secondary: '#670E36' }, stadium: 'Villa Park', capacity: 42657 },
    { id: 'brighton', name: 'Brighton & Hove Albion', short: 'BHA', league: 'eng', reputation: 76,
      colors: { primary: '#0057B8', secondary: '#FFCD00' }, stadium: 'Amex Stadium', capacity: 31800 },
    { id: 'forest', name: 'Nottingham Forest', short: 'NFO', league: 'eng', reputation: 74,
      colors: { primary: '#DD0000', secondary: '#FFFFFF' }, stadium: 'The City Ground', capacity: 30404 },
    { id: 'westham', name: 'West Ham United', short: 'WHU', league: 'eng', reputation: 74,
      colors: { primary: '#7A263A', secondary: '#2DAFE5' }, stadium: 'London Stadium', capacity: 62500 },
    { id: 'everton', name: 'Everton', short: 'EVE', league: 'eng', reputation: 73,
      colors: { primary: '#003399', secondary: '#FFFFFF' }, stadium: 'Hill Dickinson Stadium', capacity: 52888 },
    { id: 'palace', name: 'Crystal Palace', short: 'CRY', league: 'eng', reputation: 73,
      colors: { primary: '#1B458F', secondary: '#C4122E' }, stadium: 'Selhurst Park', capacity: 25486 },
    { id: 'bournemouth', name: 'AFC Bournemouth', short: 'BOU', league: 'eng', reputation: 72,
      colors: { primary: '#DA291C', secondary: '#000000' }, stadium: 'Vitality Stadium', capacity: 11307 },
    { id: 'brentford', name: 'Brentford', short: 'BRE', league: 'eng', reputation: 72,
      colors: { primary: '#E30613', secondary: '#FBB800' }, stadium: 'Gtech Community Stadium', capacity: 17250 },
    { id: 'fulham', name: 'Fulham', short: 'FUL', league: 'eng', reputation: 72,
      colors: { primary: '#cfcfcf', secondary: '#000000' }, stadium: 'Craven Cottage', capacity: 29589 },
    { id: 'wolves', name: 'Wolverhampton Wanderers', short: 'WOL', league: 'eng', reputation: 71,
      colors: { primary: '#FDB913', secondary: '#231F20' }, stadium: 'Molineux', capacity: 31750 },
    { id: 'leeds', name: 'Leeds United', short: 'LEE', league: 'eng', reputation: 68,
      colors: { primary: '#4f8ff7', secondary: '#FFCD00' }, stadium: 'Elland Road', capacity: 37792 },
    { id: 'burnley', name: 'Burnley', short: 'BUR', league: 'eng', reputation: 66,
      colors: { primary: '#6C1D45', secondary: '#99D6EA' }, stadium: 'Turf Moor', capacity: 21944 },
    { id: 'sunderland', name: 'Sunderland', short: 'SUN', league: 'eng', reputation: 66,
      colors: { primary: '#EB172B', secondary: '#211E1F' }, stadium: 'Stadium of Light', capacity: 49000 }
  ];

  G.DATA.clubsById = {};
  G.DATA.clubs.forEach(function (c) { G.DATA.clubsById[c.id] = c; });
})(typeof window !== 'undefined' ? window : globalThis);
