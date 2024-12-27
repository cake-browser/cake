export interface DictionaryEntry {
  key: string;
  value: string;
}

export interface ACMatchClassification {
  offset: number;
  style: number;
}

export interface Signals {
  typedCount: (number | null);
  visitCount: (number | null);
  elapsedTimeLastVisitSecs: (bigint | null);
  shortcutVisitCount: (number | null);
  shortestShortcutLen: (number | null);
  elapsedTimeLastShortcutVisitSec: (bigint | null);
  isHostOnly: (boolean | null);
  numBookmarksOfUrl: (number | null);
  firstBookmarkTitleMatchPosition: (number | null);
  totalBookmarkTitleMatchLength: (number | null);
  numInputTermsMatchedByBookmarkTitle: (number | null);
  firstUrlMatchPosition: (number | null);
  totalUrlMatchLength: (number | null);
  hostMatchAtWordBoundary: (boolean | null);
  totalHostMatchLength: (number | null);
  totalPathMatchLength: (number | null);
  totalQueryOrRefMatchLength: (number | null);
  totalTitleMatchLength: (number | null);
  hasNonSchemeWwwMatch: (boolean | null);
  numInputTermsMatchedByTitle: (number | null);
  numInputTermsMatchedByUrl: (number | null);
  lengthOfUrl: (number | null);
  siteEngagement: (number | null);
  allowedToBeDefaultMatch: (boolean | null);
  searchSuggestRelevance: (number | null);
  isSearchSuggestEntity: (boolean | null);
  isVerbatim: (boolean | null);
  isNavsuggest: (boolean | null);
  isSearchSuggestTail: (boolean | null);
  isAnswerSuggest: (boolean | null);
  isCalculatorSuggest: (boolean | null);
}

export interface AutocompleteMatch {
  providerName: string;
  providerDone: boolean;
  deletable: boolean;
  swapContentsAndDescription: boolean;
  allowedToBeDefaultMatch: boolean;
  isSearchType: boolean;
  hasTabMatch: boolean;
  starred: boolean;
  fromPrevious: boolean;
  relevance: number;
  fillIntoEdit: string;
  inlineAutocompletion: string;
  destinationUrl: string;
  strippedDestinationUrl: string;
  image: string;
  contents: string;
  contentsClass: ACMatchClassification[];
  description: string;
  descriptionClass: ACMatchClassification[];
  answer: string;
  transition: string;
  type: string;
  aqsTypeSubtypes: string;
  associatedKeyword: string;
  keyword: string;
  duplicates: number;
  pedalId: number;
  scoringSignals: Signals;
  additionalInfo: DictionaryEntry[];
}

export interface OmniboxResponse {
  cursorPosition: number;
  timeSinceOmniboxStartedMs: number;
  done: boolean;
  isTypedHost: boolean;
  type: string;
  host: string;
  inputText: string;
  combinedResults: AutocompleteMatch[];
}
