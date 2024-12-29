// @ts-ignore
import { AutocompleteMatch } from '../../cake_new_tab.mojom-webui.js';

// Extend where needed.
export type OmniSearchResultMatch = AutocompleteMatch;

export const OmniResultType = {
  SearchSuggest: 'search-suggest',
  SearchSuggestEntity: 'search-suggest-entity',
  SearchWhatYouTyped: 'search-what-you-typed',
  SearchOtherEngine: 'search-other-engine',
  UrlWhatYouTyped: 'url-what-you-typed',
  NavSuggest: 'navsuggest',
};
