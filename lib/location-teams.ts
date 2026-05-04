import type { CityMapping, TeamEntry } from './types';

// ESPN team IDs verified from the API (league-specific, not globally unique)
const nfl = (espnId: string, name: string, abbreviation: string): TeamEntry => ({
  espnId, league: 'nfl', sport: 'football', name, abbreviation,
});
const nba = (espnId: string, name: string, abbreviation: string): TeamEntry => ({
  espnId, league: 'nba', sport: 'basketball', name, abbreviation,
});
const mlb = (espnId: string, name: string, abbreviation: string): TeamEntry => ({
  espnId, league: 'mlb', sport: 'baseball', name, abbreviation,
});
const nhl = (espnId: string, name: string, abbreviation: string): TeamEntry => ({
  espnId, league: 'nhl', sport: 'hockey', name, abbreviation,
});

export const CITY_MAPPINGS: CityMapping[] = [
  {
    canonicalName: 'Boston',
    aliases: ['bos', 'boston ma', 'boston massachusetts', 'new england', 'cambridge', 'somerville', 'brookline', 'quincy'],
    teams: [
      nfl('17', 'New England Patriots', 'NE'),
      nba('2', 'Boston Celtics', 'BOS'),
      mlb('2', 'Boston Red Sox', 'BOS'),
      nhl('1', 'Boston Bruins', 'BOS'),
    ],
  },
  {
    canonicalName: 'New York',
    aliases: ['nyc', 'ny', 'new york city', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'new york ny', 'the city', 'big apple'],
    teams: [
      nfl('19', 'New York Giants', 'NYG'),
      nfl('20', 'New York Jets', 'NYJ'),
      nba('18', 'New York Knicks', 'NY'),
      nba('17', 'Brooklyn Nets', 'BKN'),
      mlb('10', 'New York Yankees', 'NYY'),
      mlb('21', 'New York Mets', 'NYM'),
      nhl('13', 'New York Rangers', 'NYR'),
      nhl('12', 'New York Islanders', 'NYI'),
    ],
  },
  {
    canonicalName: 'New Jersey',
    aliases: ['nj', 'newark', 'jersey city', 'east rutherford', 'trenton'],
    teams: [
      nfl('19', 'New York Giants', 'NYG'),
      nfl('20', 'New York Jets', 'NYJ'),
      nba('17', 'Brooklyn Nets', 'BKN'),
      nhl('11', 'New Jersey Devils', 'NJ'),
    ],
  },
  {
    canonicalName: 'Los Angeles',
    aliases: ['la', 'l.a.', 'los angeles ca', 'los angeles california', 'socal', 'southern california', 'hollywood', 'inglewood', 'long beach', 'pasadena', 'glendale', 'burbank'],
    teams: [
      nfl('14', 'Los Angeles Rams', 'LAR'),
      nfl('24', 'Los Angeles Chargers', 'LAC'),
      nba('13', 'Los Angeles Lakers', 'LAL'),
      nba('12', 'LA Clippers', 'LAC'),
      mlb('19', 'Los Angeles Dodgers', 'LAD'),
      mlb('3', 'Los Angeles Angels', 'LAA'),
      nhl('8', 'Los Angeles Kings', 'LA'),
      nhl('25', 'Anaheim Ducks', 'ANA'),
    ],
  },
  {
    canonicalName: 'San Francisco',
    aliases: ['sf', 'san francisco ca', 'bay area', 'the bay', 'oakland', 'san jose', 'silicon valley', 'east bay', 'south bay', 'san mateo', 'palo alto', 'santa clara', 'fremont'],
    teams: [
      nfl('25', 'San Francisco 49ers', 'SF'),
      nba('9', 'Golden State Warriors', 'GS'),
      mlb('26', 'San Francisco Giants', 'SF'),
      mlb('11', 'Athletics', 'ATH'),
      nhl('18', 'San Jose Sharks', 'SJ'),
    ],
  },
  {
    canonicalName: 'Chicago',
    aliases: ['chi', 'chicago il', 'chicago illinois', 'windy city', 'chicagoland', 'naperville', 'evanston', 'aurora il'],
    teams: [
      nfl('3', 'Chicago Bears', 'CHI'),
      nba('4', 'Chicago Bulls', 'CHI'),
      mlb('16', 'Chicago Cubs', 'CHC'),
      mlb('4', 'Chicago White Sox', 'CWS'),
      nhl('4', 'Chicago Blackhawks', 'CHI'),
    ],
  },
  {
    canonicalName: 'Dallas',
    aliases: ['dfw', 'dallas tx', 'dallas texas', 'fort worth', 'arlington tx', 'plano', 'irving tx', 'frisco tx', 'north texas'],
    teams: [
      nfl('6', 'Dallas Cowboys', 'DAL'),
      nba('6', 'Dallas Mavericks', 'DAL'),
      mlb('13', 'Texas Rangers', 'TEX'),
      nhl('9', 'Dallas Stars', 'DAL'),
    ],
  },
  {
    canonicalName: 'Miami',
    aliases: ['miami fl', 'miami florida', 'south florida', 'miami beach', 'fort lauderdale', 'boca raton', 'miami-dade', 'broward', 'palm beach', 'sunrise fl'],
    teams: [
      nfl('15', 'Miami Dolphins', 'MIA'),
      nba('14', 'Miami Heat', 'MIA'),
      mlb('28', 'Miami Marlins', 'MIA'),
      nhl('26', 'Florida Panthers', 'FLA'),
    ],
  },
  {
    canonicalName: 'Washington DC',
    aliases: ['dc', 'washington', 'washington d.c.', 'dmv', 'arlington va', 'northern virginia', 'nova', 'bethesda', 'silver spring', 'rockville', 'alexandria', 'reston'],
    teams: [
      nfl('28', 'Washington Commanders', 'WSH'),
      nba('27', 'Washington Wizards', 'WSH'),
      mlb('20', 'Washington Nationals', 'WSH'),
      nhl('23', 'Washington Capitals', 'WSH'),
    ],
  },
  {
    canonicalName: 'Philadelphia',
    aliases: ['philly', 'phila', 'philadelphia pa', 'philadelphia pennsylvania', 'south jersey', 'delaware valley'],
    teams: [
      nfl('21', 'Philadelphia Eagles', 'PHI'),
      nba('20', 'Philadelphia 76ers', 'PHI'),
      mlb('22', 'Philadelphia Phillies', 'PHI'),
      nhl('15', 'Philadelphia Flyers', 'PHI'),
    ],
  },
  {
    canonicalName: 'Atlanta',
    aliases: ['atl', 'atlanta ga', 'atlanta georgia', 'buckhead', 'midtown atlanta', 'decatur ga', 'marietta', 'alpharetta'],
    teams: [
      nfl('1', 'Atlanta Falcons', 'ATL'),
      nba('1', 'Atlanta Hawks', 'ATL'),
      mlb('15', 'Atlanta Braves', 'ATL'),
    ],
  },
  {
    canonicalName: 'Phoenix',
    aliases: ['phx', 'phoenix az', 'phoenix arizona', 'scottsdale', 'tempe', 'mesa az', 'chandler az', 'gilbert az', 'glendale az', 'valley of the sun'],
    teams: [
      nfl('22', 'Arizona Cardinals', 'ARI'),
      nba('21', 'Phoenix Suns', 'PHX'),
      mlb('29', 'Arizona Diamondbacks', 'ARI'),
      // Coyotes relocated to Utah in 2024
    ],
  },
  {
    canonicalName: 'Seattle',
    aliases: ['sea', 'seattle wa', 'seattle washington', 'bellevue', 'tacoma', 'redmond', 'kirkland', 'puget sound', 'emerald city'],
    teams: [
      nfl('26', 'Seattle Seahawks', 'SEA'),
      mlb('12', 'Seattle Mariners', 'SEA'),
      nhl('124292', 'Seattle Kraken', 'SEA'),
    ],
  },
  {
    canonicalName: 'Denver',
    aliases: ['den', 'denver co', 'denver colorado', 'aurora co', 'boulder', 'lakewood co', 'westminster co', 'mile high city'],
    teams: [
      nfl('7', 'Denver Broncos', 'DEN'),
      nba('7', 'Denver Nuggets', 'DEN'),
      mlb('27', 'Colorado Rockies', 'COL'),
      nhl('17', 'Colorado Avalanche', 'COL'),
    ],
  },
  {
    canonicalName: 'Minneapolis',
    aliases: ['msp', 'minneapolis mn', 'minneapolis minnesota', 'saint paul', 'st paul', 'twin cities', 'bloomington mn', 'eden prairie mn'],
    teams: [
      nfl('16', 'Minnesota Vikings', 'MIN'),
      nba('16', 'Minnesota Timberwolves', 'MIN'),
      mlb('9', 'Minnesota Twins', 'MIN'),
      nhl('30', 'Minnesota Wild', 'MIN'),
    ],
  },
  {
    canonicalName: 'Detroit',
    aliases: ['det', 'detroit mi', 'detroit michigan', 'motor city', 'troy mi', 'warren mi', 'dearborn', 'sterling heights'],
    teams: [
      nfl('8', 'Detroit Lions', 'DET'),
      nba('8', 'Detroit Pistons', 'DET'),
      mlb('6', 'Detroit Tigers', 'DET'),
      nhl('5', 'Detroit Red Wings', 'DET'),
    ],
  },
  {
    canonicalName: 'Cleveland',
    aliases: ['cle', 'cleveland oh', 'cleveland ohio', 'akron', 'parma oh', 'lakewood oh', 'euclid oh'],
    teams: [
      nfl('5', 'Cleveland Browns', 'CLE'),
      nba('5', 'Cleveland Cavaliers', 'CLE'),
      mlb('5', 'Cleveland Guardians', 'CLE'),
    ],
  },
  {
    canonicalName: 'Pittsburgh',
    aliases: ['pgh', 'pittsburgh pa', 'pittsburgh pennsylvania', 'steel city'],
    teams: [
      nfl('23', 'Pittsburgh Steelers', 'PIT'),
      mlb('23', 'Pittsburgh Pirates', 'PIT'),
      nhl('16', 'Pittsburgh Penguins', 'PIT'),
    ],
  },
  {
    canonicalName: 'Houston',
    aliases: ['hou', 'houston tx', 'houston texas', 'sugar land', 'the woodlands', 'katy tx', 'bayou city'],
    teams: [
      nfl('34', 'Houston Texans', 'HOU'),
      nba('10', 'Houston Rockets', 'HOU'),
      mlb('18', 'Houston Astros', 'HOU'),
    ],
  },
  {
    canonicalName: 'San Antonio',
    aliases: ['san antonio tx', 'san antonio texas', 'alamo city'],
    teams: [
      nba('24', 'San Antonio Spurs', 'SA'),
    ],
  },
  {
    canonicalName: 'Portland',
    aliases: ['pdx', 'portland or', 'portland oregon', 'rose city', 'beaverton', 'hillsboro or'],
    teams: [
      nba('22', 'Portland Trail Blazers', 'POR'),
    ],
  },
  {
    canonicalName: 'Salt Lake City',
    aliases: ['slc', 'salt lake', 'utah', 'provo', 'orem', 'ogden', 'west jordan', 'sandy ut'],
    teams: [
      nba('26', 'Utah Jazz', 'UTAH'),
      nhl('129764', 'Utah Mammoth', 'UTAH'),
    ],
  },
  {
    canonicalName: 'Oklahoma City',
    aliases: ['okc', 'oklahoma city ok', 'oklahoma city oklahoma', 'edmond ok', 'norman ok'],
    teams: [
      nba('25', 'Oklahoma City Thunder', 'OKC'),
    ],
  },
  {
    canonicalName: 'Memphis',
    aliases: ['mem', 'memphis tn', 'memphis tennessee'],
    teams: [
      nba('29', 'Memphis Grizzlies', 'MEM'),
    ],
  },
  {
    canonicalName: 'New Orleans',
    aliases: ['nola', 'new orleans la', 'new orleans louisiana', 'crescent city', 'metairie'],
    teams: [
      nfl('18', 'New Orleans Saints', 'NO'),
      nba('3', 'New Orleans Pelicans', 'NO'),
    ],
  },
  {
    canonicalName: 'Sacramento',
    aliases: ['sac', 'sacramento ca', 'sacramento california', 'elk grove', 'roseville ca', 'folsom ca'],
    teams: [
      nba('23', 'Sacramento Kings', 'SAC'),
    ],
  },
  {
    canonicalName: 'Charlotte',
    aliases: ['clt', 'charlotte nc', 'charlotte north carolina', 'concord nc', 'gastonia nc'],
    teams: [
      nfl('29', 'Carolina Panthers', 'CAR'),
      nba('30', 'Charlotte Hornets', 'CHA'),
    ],
  },
  {
    canonicalName: 'Indianapolis',
    aliases: ['indy', 'indianapolis in', 'indianapolis indiana', 'carmel in', 'fishers in'],
    teams: [
      nfl('11', 'Indianapolis Colts', 'IND'),
      nba('11', 'Indiana Pacers', 'IND'),
    ],
  },
  {
    canonicalName: 'Milwaukee',
    aliases: ['mil', 'milwaukee wi', 'milwaukee wisconsin', 'waukesha wi'],
    teams: [
      nba('15', 'Milwaukee Bucks', 'MIL'),
      mlb('8', 'Milwaukee Brewers', 'MIL'),
    ],
  },
  {
    canonicalName: 'Kansas City',
    aliases: ['kc', 'kansas city mo', 'kansas city kansas', 'overland park', 'olathe ks', 'lee summit'],
    teams: [
      nfl('12', 'Kansas City Chiefs', 'KC'),
      mlb('7', 'Kansas City Royals', 'KC'),
    ],
  },
  {
    canonicalName: 'Baltimore',
    aliases: ['bal', 'baltimore md', 'baltimore maryland', 'charm city', 'towson md'],
    teams: [
      nfl('33', 'Baltimore Ravens', 'BAL'),
      mlb('1', 'Baltimore Orioles', 'BAL'),
    ],
  },
  {
    canonicalName: 'Cincinnati',
    aliases: ['cin', 'cincinnati oh', 'cincinnati ohio', 'covington ky', 'northern kentucky'],
    teams: [
      nfl('4', 'Cincinnati Bengals', 'CIN'),
      mlb('17', 'Cincinnati Reds', 'CIN'),
    ],
  },
  {
    canonicalName: 'Tampa Bay',
    aliases: ['tpa', 'tampa', 'tampa fl', 'tampa florida', 'st pete', 'saint petersburg fl', 'clearwater fl', 'sarasota', 'brandon fl'],
    teams: [
      nfl('27', 'Tampa Bay Buccaneers', 'TB'),
      mlb('30', 'Tampa Bay Rays', 'TB'),
      nhl('20', 'Tampa Bay Lightning', 'TB'),
    ],
  },
  {
    canonicalName: 'Orlando',
    aliases: ['orl', 'orlando fl', 'orlando florida', 'kissimmee', 'sanford fl'],
    teams: [
      nba('19', 'Orlando Magic', 'ORL'),
    ],
  },
  {
    canonicalName: 'Nashville',
    aliases: ['bna', 'nashville tn', 'nashville tennessee', 'music city', 'franklin tn', 'murfreesboro tn'],
    teams: [
      nfl('10', 'Tennessee Titans', 'TEN'),
      nhl('27', 'Nashville Predators', 'NSH'),
    ],
  },
  {
    canonicalName: 'St. Louis',
    aliases: ['stl', 'st louis', 'saint louis', 'st louis mo', 'st. louis missouri', 'clayton mo'],
    teams: [
      mlb('24', 'St. Louis Cardinals', 'STL'),
      nhl('19', 'St. Louis Blues', 'STL'),
    ],
  },
  {
    canonicalName: 'Las Vegas',
    aliases: ['lvs', 'las vegas nv', 'las vegas nevada', 'henderson nv', 'summerlin', 'north las vegas', 'sin city'],
    teams: [
      nfl('13', 'Las Vegas Raiders', 'LV'),
      nhl('37', 'Vegas Golden Knights', 'VGK'),
    ],
  },
  {
    canonicalName: 'Buffalo',
    aliases: ['buf', 'buffalo ny', 'buffalo new york', 'niagara falls ny'],
    teams: [
      nfl('2', 'Buffalo Bills', 'BUF'),
      nhl('2', 'Buffalo Sabres', 'BUF'),
    ],
  },
  {
    canonicalName: 'Green Bay',
    aliases: ['gb', 'green bay wi', 'green bay wisconsin', 'titletown'],
    teams: [
      nfl('9', 'Green Bay Packers', 'GB'),
    ],
  },
  {
    canonicalName: 'Jacksonville',
    aliases: ['jax', 'jacksonville fl', 'jacksonville florida'],
    teams: [
      nfl('30', 'Jacksonville Jaguars', 'JAX'),
    ],
  },
  {
    canonicalName: 'Columbus',
    aliases: ['col', 'columbus oh', 'columbus ohio', 'westerville oh', 'dublin oh'],
    teams: [
      nhl('29', 'Columbus Blue Jackets', 'CBJ'),
    ],
  },
  {
    canonicalName: 'Raleigh',
    aliases: ['rdu', 'raleigh nc', 'raleigh north carolina', 'durham nc', 'chapel hill', 'research triangle', 'cary nc'],
    teams: [
      nhl('7', 'Carolina Hurricanes', 'CAR'),
    ],
  },
  {
    canonicalName: 'Ottawa',
    aliases: ['yow', 'ottawa on', 'ottawa canada', 'gatineau qc'],
    teams: [
      nhl('14', 'Ottawa Senators', 'OTT'),
    ],
  },
  {
    canonicalName: 'Montreal',
    aliases: ['ymq', 'montreal qc', 'montreal canada', 'laval qc', 'longueuil'],
    teams: [
      nhl('10', 'Montreal Canadiens', 'MTL'),
    ],
  },
  {
    canonicalName: 'Vancouver',
    aliases: ['yvr', 'vancouver bc', 'vancouver canada', 'surrey bc', 'burnaby bc'],
    teams: [
      nhl('22', 'Vancouver Canucks', 'VAN'),
    ],
  },
  {
    canonicalName: 'Calgary',
    aliases: ['yyc', 'calgary ab', 'calgary canada'],
    teams: [
      nhl('3', 'Calgary Flames', 'CGY'),
    ],
  },
  {
    canonicalName: 'Edmonton',
    aliases: ['yeg', 'edmonton ab', 'edmonton canada'],
    teams: [
      nhl('6', 'Edmonton Oilers', 'EDM'),
    ],
  },
  {
    canonicalName: 'Winnipeg',
    aliases: ['winnipeg mb', 'winnipeg canada'],
    teams: [
      nhl('28', 'Winnipeg Jets', 'WPG'),
    ],
  },
];

export function lookupCity(input: string): CityMapping | null {
  const normalized = input.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  for (const mapping of CITY_MAPPINGS) {
    const nameNorm = mapping.canonicalName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    if (nameNorm === normalized) return mapping;
    for (const alias of mapping.aliases) {
      const aliasNorm = alias.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
      if (aliasNorm === normalized) return mapping;
    }
  }
  return null;
}

export function getAllCityNames(): string[] {
  return CITY_MAPPINGS.map((c) => c.canonicalName);
}
