import { OmniSearchResultMatch, OmniResultType } from './types.js';

export const applyCustomSortAndFilterRules = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  return applyCustomSortRules(applyCustomFilterRules(results, inputText), inputText);
}

/**
 * Custom sort rules
 */

type CustomSortRule = (results: OmniSearchResultMatch[], inputText: string) => OmniSearchResultMatch[];

const maybeBringNavSuggestToTop = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  if (results.length < 2) return results;
  const firstResult = results[0];
  const secondResult = results[1];

  if (
    firstResult.type === OmniResultType.SearchWhatYouTyped &&
    secondResult.type === OmniResultType.NavSuggest &&
    secondResult.contents.endsWith(firstResult.contents) &&
    secondResult.relevance > firstResult.relevance
  ) {
    return [secondResult, firstResult, ...results.slice(2)];
  }

  return results;
}

const bringUrlWhatYouTypedToTop = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  return sortByType(results, OmniResultType.UrlWhatYouTyped);
}

const createFakeExactMatch = (inputText: string): any => {
  return {
    isSearchType: true,
    type: OmniResultType.SearchWhatYouTyped,
    contents: inputText,
    description: '',
    swapContentsAndDescription: false,
    inlineAutocompletion: '',
    destinationUrl: '',
    strippedDestinationUrl: '',
    image: '',
    relevance: 1000000,
  }
}

const handleNoExactMatch = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  if (results.length && !results[0].isSearchType) {
    return results;
  }

  return [
    createFakeExactMatch(inputText) as OmniSearchResultMatch,
    ...results,
  ]
}

const handleNoSearchWhatYouTyped = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  const others: OmniSearchResultMatch[] = [];
  let exactMatch: OmniSearchResultMatch | null = null;

  for (const result of results) {
    const title = result.swapContentsAndDescription ? result.description : result.contents;
    if (result.isSearchType && title === inputText) {
      exactMatch = result;
    } else {
      others.push(result);
    }
  }

  if (exactMatch) {
    if (
      others.length && 
      !others[0].isSearchType && 
      others[0].inlineAutocompletion && 
      others[0].relevance > exactMatch.relevance
    ) {
      return results;
    }
    return [exactMatch, ...others];
  }

  return handleNoExactMatch(results, inputText);
}

const sortByRelevance = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  const searchWhatYouTypedIndex = results.findIndex(result => result.type === OmniResultType.SearchWhatYouTyped);
  if (searchWhatYouTypedIndex === -1) {
    return handleNoSearchWhatYouTyped(results, inputText);
  }

  const top: OmniSearchResultMatch[] = [];
  const rest: OmniSearchResultMatch[] = [];

  for (let i = 0; i < results.length; i++) {
    if (i <= searchWhatYouTypedIndex) {
      top.push(results[i]);
    } else {
      rest.push(results[i]);
    }
  }

  const sortedRest = [...rest].sort((a, b) => b.relevance - a.relevance);
  return [...top, ...sortedRest];
}

const sortByType = (results: OmniSearchResultMatch[], matchType: string): OmniSearchResultMatch[] => {
  return [...results].sort((a, b) => {
    if (a.type === matchType) return -1;
    if (b.type === matchType) return 1;
    return 0;
  });
}

/**
 * Bring the "search-what-you-typed" result to the top UNLESS 
 * a website result with inline autocompletion exists above it.
 */
const maybeEnsureSearchWhatYouTypedIsFirstResult = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  let hasSeenSearchWhatYouTyped = false;
  for (const result of results) {
    if (!result.isSearchType && result.inlineAutocompletion && !hasSeenSearchWhatYouTyped) {
      return results
    }
    if (result.type === OmniResultType.SearchWhatYouTyped) {
      hasSeenSearchWhatYouTyped = true;
    }
  }
  return sortByType(results, OmniResultType.SearchWhatYouTyped);
}

const customSortRules: CustomSortRule[] = [
  maybeEnsureSearchWhatYouTypedIsFirstResult,
  sortByRelevance,
  bringUrlWhatYouTypedToTop,
  maybeBringNavSuggestToTop,
]

const applyCustomSortRules = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  for (const sortRule of customSortRules) {
    results = sortRule(results, inputText);
  }
  return results;
}

/**
 * Custom filter rules
 */

type CustomFilterRule = (results: OmniSearchResultMatch[], inputText: string) => OmniSearchResultMatch[];

type IndexedResult = {
  index: number;
  result: OmniSearchResultMatch;
}

const preventSearchOtherEngines = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  return results.filter(result => result.type !== OmniResultType.SearchOtherEngine);
}

const dedupSearchEntities = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  const resultsByIndex = new Map<number, OmniSearchResultMatch>();
  const resultsByEntityId = new Map<string, IndexedResult>();

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    if (!result.isSearchType) {
      resultsByIndex.set(i, result);
      continue
    }

    const id = result.strippedDestinationUrl;
    
    if (resultsByEntityId.has(id) && result.type === OmniResultType.SearchSuggestEntity) {
      const existingResultIndex = resultsByEntityId.get(id)!.index;
      resultsByIndex.set(existingResultIndex, result);
      resultsByEntityId.delete(id);
      continue
    }

    if (result.type === OmniResultType.SearchSuggest) {
      resultsByEntityId.set(id, { index: i, result });
    }

    resultsByIndex.set(i, result);
  }

  const sortedIndexes = [...resultsByIndex.keys()].sort((a, b) => a - b);
  const sortedResults = sortedIndexes.map(index => resultsByIndex.get(index)!);

  return sortedResults;
}

const customFilterRules: CustomFilterRule[] = [
  preventSearchOtherEngines,
  dedupSearchEntities,
]

const applyCustomFilterRules = (results: OmniSearchResultMatch[], inputText: string): OmniSearchResultMatch[] => {
  for (const filterRule of customFilterRules) {
    results = filterRule(results, inputText);
  }
  return results;
};