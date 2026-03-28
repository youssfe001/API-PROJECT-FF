/**
 * lib/protobuf/schemas.js
 * ===================================================================
 * Schemas مستخرجة 1:1 من ملفات .proto المُقدَّمة
 *
 * تنسيق كل حقل:
 *   { field: <رقم الحقل>, type: <النوع>, repeated?: true, messageType?: '<اسم الـ message>' }
 *
 * الأنواع المدعومة:
 *   uint32, uint64, int32, int64, sint32, sint64, bool, enum,
 *   string, bytes, float, double, message
 * ===================================================================
 */

// ─── PlayerPersonalShow.proto ─────────────────────────────────────────────────

const PlayerPersonalShow_request = {
  accountId:       { field: 1, type: "uint64" },
  callSignSrc:     { field: 2, type: "enum"   },   // CallSignSrcType
  needGalleryInfo: { field: 3, type: "bool"   },
};

const AccountPrefers = {
  hidemylobby:           { field: 1, type: "bool"   },
  pregameshowchoices:    { field: 2, type: "uint32", repeated: true },
  brpregameshowchoices:  { field: 3, type: "uint32", repeated: true },
  hidepersonalinfo:      { field: 4, type: "bool"   },
  disablefriendspectate: { field: 5, type: "bool"   },
  hideoccupation:        { field: 6, type: "bool"   },
};

const ExternalIconInfo = {
  externalicon: { field: 1, type: "string" },
  status:       { field: 2, type: "enum"   },
  showtype:     { field: 3, type: "enum"   },
};

const OccupationInfo = {
  occupationid:  { field: 1, type: "uint32" },
  scores:        { field: 2, type: "uint64" },
  proficients:   { field: 3, type: "uint64" },
  proficientlv:  { field: 4, type: "uint32" },
  isselect:      { field: 5, type: "bool"   },
};

const OccupationSeasonInfo = {
  seasonid:  { field: 1, type: "uint32" },
  gamemode:  { field: 2, type: "uint32" },
  info:      { field: 3, type: "message", messageType: "OccupationInfo" },
  matchmode: { field: 4, type: "uint32" },
  extendval: { field: 5, type: "uint32" },
};

const SocialHighLight = {
  highlight: { field: 1, type: "enum"   },
  expireat:  { field: 2, type: "int64"  },
  value:     { field: 3, type: "uint32" },
};

const SocialHighLightsWithSocialBasicInfo = {
  socialhighlights: { field: 1, type: "message", messageType: "SocialHighLight", repeated: true },
  socialbasicinfo:  { field: 2, type: "message", messageType: "SocialBasicInfo" },
};

const AbTestChoice = {
  type: { field: 1, type: "uint32" },
  val:  { field: 2, type: "uint32" },
};

const ItemTagInfo = {
  itemid:   { field: 1, type: "uint32" },
  seriesid: { field: 2, type: "uint32" },
  numid:    { field: 3, type: "uint32" },
};

const ModeStatsInfo = {
  gamemode: { field: 1, type: "uint32" },
  score:    { field: 2, type: "uint32" },
};

const BadgeInfo = {
  badgetype: { field: 1, type: "enum"   },
  subtype:   { field: 2, type: "uint32" },
};

const PrimePrivilegeDetail = {
  accountid:        { field: 1, type: "uint64" },
  primelevel:       { field: 2, type: "uint32" },
  privilegeidlist:  { field: 3, type: "enum",   repeated: true },
  monthlypoints:    { field: 4, type: "int32"  },
  annuallypoints:   { field: 5, type: "int32"  },
  sumpoints:        { field: 6, type: "int32"  },
  shareeremaintimes:{ field: 7, type: "uint32" },
};

const AccountInfoBasic = {
  accountid:              { field: 1,  type: "uint64"  },
  accounttype:            { field: 2,  type: "uint32"  },
  nickname:               { field: 3,  type: "string"  },
  externalid:             { field: 4,  type: "string"  },
  region:                 { field: 5,  type: "string"  },
  level:                  { field: 6,  type: "uint32"  },
  exp:                    { field: 7,  type: "uint32"  },
  externaltype:           { field: 8,  type: "uint32"  },
  externalname:           { field: 9,  type: "string"  },
  externalicon:           { field: 10, type: "string"  },
  bannerid:               { field: 11, type: "uint32"  },
  headpic:                { field: 12, type: "uint32"  },
  clanname:               { field: 13, type: "string"  },
  rank:                   { field: 14, type: "uint32"  },
  rankingpoints:          { field: 15, type: "uint32"  },
  role:                   { field: 16, type: "uint32"  },
  haselitepass:           { field: 17, type: "bool"    },
  badgecnt:               { field: 18, type: "uint32"  },
  badgeid:                { field: 19, type: "uint32"  },
  seasonid:               { field: 20, type: "uint32"  },
  liked:                  { field: 21, type: "uint32"  },
  isdeleted:              { field: 22, type: "bool"    },
  showrank:               { field: 23, type: "bool"    },
  lastloginat:            { field: 24, type: "int64"   },
  externaluid:            { field: 25, type: "uint64"  },
  returnat:               { field: 26, type: "int64"   },
  championshipteamname:   { field: 27, type: "string"  },
  championshipteammembernum: { field: 28, type: "uint32" },
  championshipteamid:     { field: 29, type: "uint64"  },
  csrank:                 { field: 30, type: "uint32"  },
  csrankingpoints:        { field: 31, type: "uint32"  },
  weaponskinshows:        { field: 32, type: "uint32",  repeated: true },
  pinid:                  { field: 33, type: "uint32"  },
  iscsrankingban:         { field: 34, type: "bool"    },
  maxrank:                { field: 35, type: "uint32"  },
  csmaxrank:              { field: 36, type: "uint32"  },
  maxrankingpoints:       { field: 37, type: "uint32"  },
  gamebagshow:            { field: 38, type: "uint32"  },
  peakrankpos:            { field: 39, type: "uint32"  },
  cspeakrankpos:          { field: 40, type: "uint32"  },
  accountprefers:         { field: 41, type: "message", messageType: "AccountPrefers" },
  periodicrankingpoints:  { field: 42, type: "uint32"  },
  periodicrank:           { field: 43, type: "uint32"  },
  createat:               { field: 44, type: "int64"   },
  veteranleavedaystag:    { field: 45, type: "enum"    },
  selecteditemslots:      { field: 46, type: "uint32",  repeated: true },
  preveterantype:         { field: 47, type: "enum"    },
  title:                  { field: 48, type: "uint32"  },
  externaliconinfo:       { field: 49, type: "message", messageType: "ExternalIconInfo" },
  releaseversion:         { field: 50, type: "string"  },
  veteranexpiretime:      { field: 51, type: "uint64"  },
  showbrrank:             { field: 52, type: "bool"    },
  showcsrank:             { field: 53, type: "bool"    },
  clanid:                 { field: 54, type: "uint64"  },
  clanbadgeid:            { field: 55, type: "uint32"  },
  customclanbadge:        { field: 56, type: "string"  },
  usecustomclanbadge:     { field: 57, type: "bool"    },
  clanframeid:            { field: 58, type: "uint32"  },
  membershipstate:        { field: 59, type: "bool"    },
  selectoccupations:      { field: 60, type: "message", messageType: "OccupationSeasonInfo", repeated: true },
  socialhighlightswithbasicinfo: { field: 61, type: "message", messageType: "SocialHighLightsWithSocialBasicInfo" },
  abtestchoices:          { field: 62, type: "message", messageType: "AbTestChoice", repeated: true },
  itemtaginfo:            { field: 63, type: "message", messageType: "ItemTagInfo",  repeated: true },
  ranksort:               { field: 64, type: "uint32"  },
  csranksort:             { field: 65, type: "uint32"  },
  hipporank:              { field: 66, type: "uint32"  },
  hipporankingpoints:     { field: 67, type: "uint32"  },
  hippomaxrank:           { field: 68, type: "uint32"  },
  showhipporank:          { field: 69, type: "bool"    },
  hippototalprofit:       { field: 70, type: "uint32"  },
  hippototalworth:        { field: 71, type: "uint32"  },
  modestatsinfos:         { field: 72, type: "message", messageType: "ModeStatsInfo", repeated: true },
  badgeinfo:              { field: 73, type: "message", messageType: "BadgeInfo"      },
  primeprivilegedetail:   { field: 74, type: "message", messageType: "PrimePrivilegeDetail" },
  cspeakpoints:           { field: 75, type: "uint32"  },
  displaycspeakpoint:     { field: 76, type: "bool"    },
  cspeaktournamentrankpos:{ field: 77, type: "uint32"  },
  avatarframe:            { field: 78, type: "uint32"  },
};

const AvatarProfile = {
  avatarid:            { field: 1,  type: "uint32"  },
  skincolor:           { field: 2,  type: "uint32"  },
  clothes:             { field: 3,  type: "uint32",  repeated: true },
  equipedskills:       { field: 4,  type: "uint32",  repeated: true },
  isselected:          { field: 5,  type: "bool"    },
  pveprimaryweapon:    { field: 6,  type: "uint32"  },
  isselectedawaken:    { field: 7,  type: "bool"    },
  endtime:             { field: 8,  type: "uint32"  },
  unlocktype:          { field: 9,  type: "enum"    },
  unlocktime:          { field: 10, type: "uint32"  },
  ismarkedstar:        { field: 11, type: "bool"    },
  clothestailoreffects:{ field: 12, type: "uint32",  repeated: true },
  itemtaginfo:         { field: 13, type: "message", messageType: "ItemTagInfo", repeated: true },
};

const AccountNewsContent = {
  itemids:       { field: 1, type: "uint32", repeated: true },
  rank:          { field: 2, type: "uint32" },
  matchmode:     { field: 3, type: "uint32" },
  mapid:         { field: 4, type: "uint32" },
  gamemode:      { field: 5, type: "uint32" },
  groupmode:     { field: 6, type: "uint32" },
  treasureboxid: { field: 7, type: "uint32" },
  commodityid:   { field: 8, type: "uint32" },
  storeid:       { field: 9, type: "uint32" },
};

const AccountNews = {
  type:       { field: 1, type: "enum"    },
  content:    { field: 2, type: "message", messageType: "AccountNewsContent" },
  updatetime: { field: 3, type: "int64"   },
};

const BasicEPInfo = {
  epeventid:  { field: 1, type: "uint32" },
  ownedpass:  { field: 2, type: "bool"   },
  epbadge:    { field: 3, type: "uint32" },
  badgecnt:   { field: 4, type: "uint32" },
  bpicon:     { field: 5, type: "string" },
  maxlevel:   { field: 6, type: "uint32" },
  eventname:  { field: 7, type: "string" },
};

const ClanInfoBasic = {
  clanid:      { field: 1, type: "uint64" },
  clanname:    { field: 2, type: "string" },
  captainid:   { field: 3, type: "uint64" },
  clanlevel:   { field: 4, type: "uint32" },
  capacity:    { field: 5, type: "uint32" },
  membernum:   { field: 6, type: "uint32" },
  honorpoint:  { field: 7, type: "uint32" },
};

const PetSkillInfo = {
  petid:      { field: 1, type: "uint32" },
  skillid:    { field: 2, type: "uint32" },
  skilllevel: { field: 3, type: "uint32" },
};

const PetInfo = {
  id:             { field: 1,  type: "uint32"  },
  name:           { field: 2,  type: "string"  },
  level:          { field: 3,  type: "uint32"  },
  exp:            { field: 4,  type: "uint32"  },
  isselected:     { field: 5,  type: "bool"    },
  skinid:         { field: 6,  type: "uint32"  },
  actions:        { field: 7,  type: "uint32",  repeated: true },
  skills:         { field: 8,  type: "message", messageType: "PetSkillInfo", repeated: true },
  selectedskillid:{ field: 9,  type: "uint32"  },
  ismarkedstar:   { field: 10, type: "bool"    },
  endtime:        { field: 11, type: "uint32"  },
};

const WeaponPowerTitleInfo = {
  region:       { field: 1,  type: "string" },
  titlecfgid:   { field: 2,  type: "uint32" },
  leaderboardid:{ field: 3,  type: "uint64" },
  weaponid:     { field: 4,  type: "uint32" },
  rank:         { field: 5,  type: "uint32" },
  expiretime:   { field: 6,  type: "int64"  },
  rewardtime:   { field: 7,  type: "int64"  },
  regionname:   { field: 8,  type: "string" },
  regiontype:   { field: 9,  type: "enum"   },
  isbr:         { field: 10, type: "bool"   },
  titletype:    { field: 11, type: "enum"   },
};

const GuildWarTitleInfo = {
  region:       { field: 1, type: "string" },
  clanid:       { field: 2, type: "uint64" },
  titlecfgid:   { field: 3, type: "uint32" },
  leaderboardid:{ field: 4, type: "uint64" },
  rank:         { field: 5, type: "uint32" },
  expiretime:   { field: 6, type: "int64"  },
  rewardtime:   { field: 7, type: "int64"  },
  isequipped:   { field: 8, type: "bool"   },
  clanname:     { field: 9, type: "string" },
};

const RankingTitleInfo = {
  region:       { field: 1, type: "string" },
  titlecfgid:   { field: 2, type: "uint32" },
  leaderboardid:{ field: 3, type: "uint64" },
  rank:         { field: 4, type: "uint32" },
  expiretime:   { field: 5, type: "int64"  },
  rewardtime:   { field: 6, type: "int64"  },
  regionname:   { field: 7, type: "string" },
  regiontype:   { field: 8, type: "enum"   },
  isbr:         { field: 9, type: "bool"   },
};

const CSPeakTitleInfo = {
  region:       { field: 1, type: "string" },
  titlecfgid:   { field: 2, type: "uint32" },
  leaderboardid:{ field: 3, type: "uint64" },
  rank:         { field: 4, type: "uint32" },
  expiretime:   { field: 5, type: "int64"  },
  rewardtime:   { field: 6, type: "int64"  },
  regionname:   { field: 7, type: "string" },
  isbr:         { field: 8, type: "bool"   },
  regiontype:   { field: 9, type: "enum"   },
};

const LeaderboardTitleInfo = {
  weaponpowertitleinfo: { field: 1, type: "message", messageType: "WeaponPowerTitleInfo", repeated: true },
  guildwartitleinfo:    { field: 2, type: "message", messageType: "GuildWarTitleInfo",    repeated: true },
  rankingtitleinfo:     { field: 3, type: "message", messageType: "RankingTitleInfo",     repeated: true },
  titlefirstreceive:    { field: 4, type: "bool"    },
  cspeaktitleinfo:      { field: 5, type: "message", messageType: "CSPeakTitleInfo",      repeated: true },
  peaktitlefirstreceive:{ field: 6, type: "bool"    },
};

const SocialBasicInfo = {
  accountid:              { field: 1,  type: "uint64"  },
  gender:                 { field: 2,  type: "enum"    },
  language:               { field: 3,  type: "enum"    },
  timeonline:             { field: 4,  type: "enum"    },
  timeactive:             { field: 5,  type: "enum"    },
  battletag:              { field: 6,  type: "enum",    repeated: true },
  socialtag:              { field: 7,  type: "enum",    repeated: true },
  modeprefer:             { field: 8,  type: "enum"    },
  signature:              { field: 9,  type: "string"  },
  rankshow:               { field: 10, type: "enum"    },
  battletagcount:         { field: 11, type: "uint32",  repeated: true },
  signaturebanexpiretime: { field: 12, type: "int64"   },
  leaderboardtitles:      { field: 13, type: "message", messageType: "LeaderboardTitleInfo" },
};

const DiamondCostRes = {
  diamondcost: { field: 1, type: "uint32" },
};

const CreditScoreInfoBasic = {
  creditscore:              { field: 1, type: "uint32" },
  isinit:                   { field: 2, type: "bool"   },
  rewardstate:              { field: 3, type: "enum"   },
  periodicsummarylikecnt:   { field: 4, type: "uint32" },
  periodicsummaryillegalcnt:{ field: 5, type: "uint32" },
  weeklymatchcnt:           { field: 6, type: "uint32" },
  periodicsummarystarttime: { field: 7, type: "int64"  },
  periodicsummaryendtime:   { field: 8, type: "int64"  },
  periodicsummarylevel:     { field: 9, type: "enum"   },
};

const AccountMMRInfo = {
  gamemode:    { field: 1, type: "uint32" },
  mmr:         { field: 2, type: "uint32" },
  botpoint:    { field: 3, type: "uint32" },
  streakwins:  { field: 4, type: "uint32" },
};

const ModeStatsSummaryInfo = {
  reachedheroiccnt: { field: 1, type: "uint32" },
  maxscore:         { field: 2, type: "uint32" },
};

const PlayerPersonalShow_response = {
  basicinfo:           { field: 1,  type: "message", messageType: "AccountInfoBasic" },
  profileinfo:         { field: 2,  type: "message", messageType: "AvatarProfile"    },
  rankingleaderboardpos:{ field: 3, type: "int32"   },
  news:                { field: 4,  type: "message", messageType: "AccountNews", repeated: true },
  historyepinfo:       { field: 5,  type: "message", messageType: "BasicEPInfo", repeated: true },
  clanbasicinfo:       { field: 6,  type: "message", messageType: "ClanInfoBasic"    },
  captainbasicinfo:    { field: 7,  type: "message", messageType: "AccountInfoBasic" },
  petinfo:             { field: 8,  type: "message", messageType: "PetInfo"          },
  socialinfo:          { field: 9,  type: "message", messageType: "SocialBasicInfo"  },
  diamondcostres:      { field: 10, type: "message", messageType: "DiamondCostRes"   },
  creditscoreinfo:     { field: 11, type: "message", messageType: "CreditScoreInfoBasic" },
  preveterantype:      { field: 12, type: "enum"    },
  mmrlist:             { field: 13, type: "message", messageType: "AccountMMRInfo",  repeated: true },
  modestatssummaryinfo:{ field: 14, type: "message", messageType: "ModeStatsSummaryInfo" },
};

// ─── PlayerStats.proto ────────────────────────────────────────────────────────

const PlayerStats_request = {
  accountid: { field: 1, type: "uint64" },
  matchmode: { field: 2, type: "uint32" },
};

const PlayerDetailedStats = {
  deaths:            { field: 1,  type: "uint32" },
  top10times:        { field: 2,  type: "uint32" },
  topntimes:         { field: 3,  type: "uint32" },
  distancetravelled: { field: 4,  type: "uint32" },
  survivaltime:      { field: 5,  type: "uint32" },
  revives:           { field: 6,  type: "uint32" },
  highestkills:      { field: 7,  type: "uint32" },
  damage:            { field: 8,  type: "uint32" },
  roadkills:         { field: 9,  type: "uint32" },
  headshots:         { field: 10, type: "uint32" },
  headshotkills:     { field: 11, type: "uint32" },
  knockdown:         { field: 12, type: "uint32" },
  pickups:           { field: 13, type: "uint32" },
};

const AccountInfoWithStatsToClient = {
  accountid:     { field: 1, type: "uint64"  },
  gamesplayed:   { field: 2, type: "uint32"  },
  wins:          { field: 3, type: "uint32"  },
  kills:         { field: 4, type: "uint32"  },
  detailedstats: { field: 5, type: "message", messageType: "PlayerDetailedStats" },
};

const PlayerStats_response = {
  solostats: { field: 1, type: "message", messageType: "AccountInfoWithStatsToClient" },
  duostats:  { field: 2, type: "message", messageType: "AccountInfoWithStatsToClient" },
  quadstats: { field: 3, type: "message", messageType: "AccountInfoWithStatsToClient" },
};

// ─── PlayerCSStats.proto ──────────────────────────────────────────────────────

const PlayerCSStats_request = {
  accountid: { field: 1, type: "uint64" },
  seasonid:  { field: 2, type: "uint32" },
  gamemode:  { field: 3, type: "uint32" },
  matchmode: { field: 4, type: "uint32" },
};

const DetailedTCStats = {
  mvpcount:           { field: 1,  type: "uint32" },
  doublekills:        { field: 2,  type: "uint32" },
  triplekills:        { field: 3,  type: "uint32" },
  fourkills:          { field: 4,  type: "uint32" },
  damage:             { field: 5,  type: "uint32" },
  headshotkills:      { field: 6,  type: "uint32" },
  knockdowns:         { field: 7,  type: "uint32" },
  revivals:           { field: 8,  type: "uint32" },
  assists:            { field: 9,  type: "uint32" },
  deaths:             { field: 10, type: "uint32" },
  streakwins:         { field: 11, type: "uint32" },
  throwingkills:      { field: 12, type: "uint32" },
  onegamemostdamage:  { field: 13, type: "uint32" },
  onegamemostkills:   { field: 14, type: "uint32" },
  ratingpoints:       { field: 15, type: "double" },
  ratingenabledgames: { field: 16, type: "uint32" },
  headshotcount:      { field: 17, type: "uint32" },
  hitcount:           { field: 18, type: "uint32" },
};

const AccountInfoWithTCStats = {
  accountid:     { field: 1, type: "uint64"  },
  gamesplayed:   { field: 2, type: "uint32"  },
  wins:          { field: 3, type: "uint32"  },
  kills:         { field: 4, type: "uint32"  },
  detailedstats: { field: 5, type: "message", messageType: "DetailedTCStats" },
};

const PlayerCSStats_response = {
  csstats: { field: 1, type: "message", messageType: "AccountInfoWithTCStats" },
};

// ─── SearchAccountByName.proto ────────────────────────────────────────────────

const SearchAccountByName_request = {
  keyword: { field: 1, type: "string" },
};

const SearchAccountByName_response = {
  infos: { field: 1, type: "message", messageType: "AccountInfoBasic", repeated: true },
};

// ─── MajorLogin.proto ─────────────────────────────────────────────────────────

const MajorLogin_request = {
  accountid:      { field: 1,  type: "uint64" },
  gameserverid:   { field: 2,  type: "string" },
  eventtime:      { field: 3,  type: "string" },
  gameid:         { field: 4,  type: "string" },
  platid:         { field: 5,  type: "uint32" },
  zoneareaid:     { field: 6,  type: "uint32" },
  clientversion:  { field: 7,  type: "string" },
  systemsoftware: { field: 8,  type: "string" },
  systemhardware: { field: 9,  type: "string" },
  telecomoper:    { field: 10, type: "string" },
  network:        { field: 11, type: "string" },
  screenwidth:    { field: 12, type: "uint32" },
  screenhight:    { field: 13, type: "uint32" },
  dpi:            { field: 14, type: "string" },
  cpuhardware:    { field: 15, type: "string" },
  memory:         { field: 16, type: "uint32" },
  glrender:       { field: 17, type: "string" },
  glversion:      { field: 18, type: "string" },
  deviceid:       { field: 19, type: "string" },
  clientip:       { field: 20, type: "string" },
  language:       { field: 21, type: "string" },
  openid:         { field: 22, type: "string" },
  openidtype:     { field: 23, type: "string" },
  devicetype:     { field: 24, type: "string" },
  devicemodel:    { field: 25, type: "string" },
  region:         { field: 26, type: "string" },
  ipregion:       { field: 27, type: "string" },
  others:         { field: 28, type: "string" },
  logintoken:     { field: 29, type: "string" },
  platformsdkid:  { field: 30, type: "uint32" },
  level:          { field: 31, type: "uint32" },
  clanid:         { field: 32, type: "uint64" },
  platformuid:    { field: 33, type: "uint64" },
  nickname:       { field: 34, type: "string" },
  isemulator:     { field: 38, type: "bool"   },
  ipaddress:      { field: 39, type: "string" },
  signaturemd5:   { field: 40, type: "string" },
  loginby:        { field: 50, type: "uint32" },
  buildNumber:    { field: 83, type: "uint64" },
  platform:       { field: 99, type: "string" },
};

const LoginQueueInfo = {
  allow:          { field: 1, type: "bool"   },
  queuePosition:  { field: 2, type: "uint32" },
  needWaitSecs:   { field: 3, type: "uint32" },
  queueIsFull:    { field: 4, type: "bool"   },
};

const BlacklistInfoRes = {
  banReason:      { field: 1, type: "enum"   },
  expireDuration: { field: 2, type: "uint32" },
  banTime:        { field: 3, type: "uint32" },
};

const MajorLogin_response = {
  accountId:          { field: 1,  type: "uint64"  },
  lockRegion:         { field: 2,  type: "string"  },
  notiRegion:         { field: 3,  type: "string"  },
  ipRegion:           { field: 4,  type: "string"  },
  agoraEnvironment:   { field: 5,  type: "string"  },
  newActiveRegion:    { field: 6,  type: "string"  },
  recommendRegions:   { field: 7,  type: "string",  repeated: true },
  token:              { field: 8,  type: "string"  },
  ttl:                { field: 9,  type: "uint32"  },
  serverUrl:          { field: 10, type: "string"  },
  emulatorScore:      { field: 11, type: "uint32"  },
  blacklist:          { field: 12, type: "message", messageType: "BlacklistInfoRes"  },
  queueInfo:          { field: 13, type: "message", messageType: "LoginQueueInfo"    },
  tpUrl:              { field: 14, type: "string"  },
  appServerId:        { field: 15, type: "uint32"  },
  ipCity:             { field: 16, type: "string"  },
  ipSubdivision:      { field: 17, type: "string"  },
  kts:                { field: 18, type: "uint32"  },
  ak:                 { field: 19, type: "bytes"   },
  aiv:                { field: 20, type: "bytes"   },
  ffantiUrl:          { field: 21, type: "string"  },
};

// ─── WishListItems.proto ──────────────────────────────────────────────────────

const WishListItem = {
  itemId: { field: 1, type: "uint32" },
  value:  { field: 2, type: "uint32" },
};

const WishList_request = {
  accountId: { field: 1, type: "uint64" },
};

const WishList_response = {
  items: { field: 1, type: "message", messageType: "WishListItem", repeated: true },
};

// ─── SetPlayerGalleryShowInfo.proto ───────────────────────────────────────────

const GalleryShowExtraInfo = {
  region:               { field: 1,  type: "string" },
  level:                { field: 2,  type: "uint32" },
  rank:                 { field: 3,  type: "uint32" },
  max_level:            { field: 4,  type: "uint32" },
  friend_id:            { field: 5,  type: "uint64" },
  item_id:              { field: 6,  type: "uint32" },
  item_extra_id:        { field: 7,  type: "uint32" },
  value:                { field: 8,  type: "uint32" },
  key:                  { field: 9,  type: "string" },
  expire_time:          { field: 10, type: "int64"  },
  leaderboard_id:       { field: 11, type: "uint64" },
  weapon_id:            { field: 12, type: "uint32" },
  title_cfg_id:         { field: 13, type: "uint32" },
  clan_id:              { field: 14, type: "uint64" },
  create_time:          { field: 15, type: "int64"  },
  series_id:            { field: 16, type: "uint32" },
  num_id:               { field: 17, type: "uint32" },
  clan_name:            { field: 18, type: "string" },
  clan_level:           { field: 19, type: "uint32" },
  clan_frame_id:        { field: 20, type: "uint32" },
  clan_badge_id:        { field: 21, type: "uint32" },
  clan_use_custom_badge:{ field: 22, type: "bool"   },
  clan_custom_badge:    { field: 23, type: "string" },
  clan_glory_num:       { field: 24, type: "uint32" },
};

const GalleryShowInfoItem = {
  type:       { field: 1, type: "uint32" },
  sub_type:   { field: 2, type: "uint32" },
  is_extra:   { field: 3, type: "bool"   },
  position_x: { field: 4, type: "uint32" },
  position_y: { field: 5, type: "uint32" },
  extra_info: { field: 6, type: "message", messageType: "GalleryShowExtraInfo" },
};

const GalleryShowInfo = {
  info_type:  { field: 1, type: "enum" },
  items:      { field: 2, type: "message", messageType: "GalleryShowInfoItem", repeated: true },
};

const SetPlayerGalleryShowInfo_request = {
  version:   { field: 1, type: "uint32"  },
  info_item: { field: 2, type: "message", messageType: "GalleryShowInfo", repeated: true },
};

// ─── Export (اسم المفتاح هو نفس اسم الـ message في الـ proto) ────────────────
module.exports = {
  // Requests
  "PlayerPersonalShow.request":    PlayerPersonalShow_request,
  "PlayerStats.request":           PlayerStats_request,
  "PlayerCSStats.request":         PlayerCSStats_request,
  "SearchAccountByName.request":   SearchAccountByName_request,
  "MajorLogin.request":            MajorLogin_request,
  "SetPlayerGalleryShowInfo.request": SetPlayerGalleryShowInfo_request,
  "WishList.request":                 WishList_request,
  // Responses
  "PlayerPersonalShow.response":   PlayerPersonalShow_response,
  "PlayerStats.response":          PlayerStats_response,
  "PlayerCSStats.response":        PlayerCSStats_response,
  "SearchAccountByName.response":  SearchAccountByName_response,
  "MajorLogin.response":           MajorLogin_response,
  "WishList.response":             WishList_response,
  // Nested (مشتركة بين أكثر من message)
  "AccountInfoBasic":              AccountInfoBasic,
  "AccountPrefers":                AccountPrefers,
  "ExternalIconInfo":              ExternalIconInfo,
  "OccupationInfo":                OccupationInfo,
  "OccupationSeasonInfo":          OccupationSeasonInfo,
  "SocialHighLight":               SocialHighLight,
  "SocialHighLightsWithSocialBasicInfo": SocialHighLightsWithSocialBasicInfo,
  "AbTestChoice":                  AbTestChoice,
  "ItemTagInfo":                   ItemTagInfo,
  "ModeStatsInfo":                 ModeStatsInfo,
  "BadgeInfo":                     BadgeInfo,
  "PrimePrivilegeDetail":          PrimePrivilegeDetail,
  "AvatarProfile":                 AvatarProfile,
  "AccountNewsContent":            AccountNewsContent,
  "AccountNews":                   AccountNews,
  "BasicEPInfo":                   BasicEPInfo,
  "ClanInfoBasic":                 ClanInfoBasic,
  "PetSkillInfo":                  PetSkillInfo,
  "PetInfo":                       PetInfo,
  "WeaponPowerTitleInfo":          WeaponPowerTitleInfo,
  "GuildWarTitleInfo":             GuildWarTitleInfo,
  "RankingTitleInfo":              RankingTitleInfo,
  "CSPeakTitleInfo":               CSPeakTitleInfo,
  "LeaderboardTitleInfo":          LeaderboardTitleInfo,
  "SocialBasicInfo":               SocialBasicInfo,
  "DiamondCostRes":                DiamondCostRes,
  "CreditScoreInfoBasic":          CreditScoreInfoBasic,
  "AccountMMRInfo":                AccountMMRInfo,
  "ModeStatsSummaryInfo":          ModeStatsSummaryInfo,
  "AccountInfoWithStatsToClient":  AccountInfoWithStatsToClient,
  "PlayerDetailedStats":           PlayerDetailedStats,
  "AccountInfoWithTCStats":        AccountInfoWithTCStats,
  "DetailedTCStats":               DetailedTCStats,
  "LoginQueueInfo":                LoginQueueInfo,
  "BlacklistInfoRes":              BlacklistInfoRes,
  "GalleryShowExtraInfo":          GalleryShowExtraInfo,
  "GalleryShowInfoItem":           GalleryShowInfoItem,
  "GalleryShowInfo":               GalleryShowInfo,
  "WishListItem":                  WishListItem,
};
