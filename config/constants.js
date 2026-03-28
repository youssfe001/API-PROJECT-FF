const USER_AGENT      = "UnityPlayer/2022.3.47f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)";
const X_UNITY_VERSION = "2022.3.47f1";
const X_GA            = "v1 1";
const RELEASE_VERSION = "OB52";

const SUPPORTED_REGIONS = [
  "ME","IND","BR","SG","RU","ID","TW","US","VN","TH","PK","CIS","BD"
];

const FF_SERVER_URLS = {
  ME:  "https://clientbp.ggblueshark.com",
  IND: "https://clientbp.ggblueshark.com",
  SG:  "https://clientbp.ggblueshark.com",
  BR:  "https://clientbp-sa.ggblueshark.com",
  US:  "https://clientbp-na.ggblueshark.com",
  ID:  "https://clientbp.ggblueshark.com",
  TH:  "https://clientbp.ggblueshark.com",
  TW:  "https://clientbp.ggblueshark.com",
  VN:  "https://clientbp.ggblueshark.com",
  PK:  "https://clientbp.ggblueshark.com",
  BD:  "https://clientbp.ggblueshark.com",
  CIS: "https://clientbp.ggblueshark.com",
  RU:  "https://clientbp.ggblueshark.com",
};

const FF_ENDPOINTS = {
  GET_PLAYER_PERSONAL_SHOW: "/GetPlayerPersonalShow",
  GET_PLAYER_STATS:         "/GetPlayerStats",
  GET_PLAYER_TC_STATS:      "/GetPlayerTCStats",
  FUZZY_SEARCH_ACCOUNT:     "/FuzzySearchAccountByName",
  GET_RANKING_LIST:         "/GetBRRankingInfo",
};

const MATCH_MODES = {
  BR: { CAREER: 0, NORMAL: 1, RANKED: 2 },
  CS: { CAREER: 0, NORMAL: 1, RANKED: 6 },
};

module.exports = {
  USER_AGENT, X_UNITY_VERSION, X_GA, RELEASE_VERSION,
  SUPPORTED_REGIONS, FF_SERVER_URLS, FF_ENDPOINTS, MATCH_MODES,
};
