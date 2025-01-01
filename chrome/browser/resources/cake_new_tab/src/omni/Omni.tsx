// @ts-ignore
import { OmniboxResponse } from '../../cake_new_tab.mojom-webui.js';
import { OmniSearchResultMatch } from './types.js';
import {
  useEffect,
  useState,
  useRef, 
  useCallback,
  Icon,
  ChatInput,
} from 'resources/cake_ui/ui.rollup.js';
import { cn, getPCN } from '../utils/cn.js';
import { getProxy, ProxyEvent } from '../proxy.js';
import { SearchResult } from './SearchResult.js';
import { InlineAutocomplete, InlineAutocompleteHandle, InlineAutocompleteProps } from './InlineAutocomplete.js';
import { applyCustomSortAndFilterRules } from './utils.js';
import { key } from '../utils/keyboard.js';
import { OmniResultType } from './types.js';
// import { results as fakeResults } from '../dev/data/search.js';

const baseClass = 'omni';
const pcn = getPCN(baseClass);
const placeholder = 'Do something magical...';

type SearchResultsState = {
  results: OmniSearchResultMatch[];
  focusedIndex: number;
}

const formatSearchResultKey = (result: OmniSearchResultMatch, index: number): string => {
  const { type, contents, description } = result;
  return [index, type, contents, description].join('-');
}

const SEARCH_RESULT_HEIGHT = 44;
const SEARCH_RESULTS_PER_PAGE = 4;
const MAX_WORDS_FOR_SEARCH_SUGGESTIONS = 4;

/**
 * An everything input.
 */
export const Omni = () => {
  // State
  const [_, forceRender] = useState<boolean>(false);
  const [animatedIn, setAnimatedIn] = useState<boolean>(false);
  const [useMultilineStyle, setUseMultilineStyle] = useState<boolean>(false);
  const [searchResultsState, setSearchResultsState] = useState<SearchResultsState>({
    results: [],
    focusedIndex: 0,
  });

  // Refs
  const inlineAutocompleteRef = useRef<InlineAutocompleteHandle>(null);
  const lastRequestQuery = useRef<string>('');
  const currentValue = useRef<string>('');
  const nextInlineAutocompleteProps = useRef<InlineAutocompleteProps | null>(null);
  const searchResultsLinerRef = useRef<HTMLDivElement>(null);
  const lastSearchResultsCount = useRef<number>(0);
  const showSearchResults = useRef<boolean>(false);
  const forceHideSearchResults = useRef<boolean>(false);
  const multilineSubmitButtonRef = useRef<HTMLButtonElement>(null);
  const urlDetectionEnabled = useRef<boolean>(false);
  const detectedDestinationUrl = useRef<string | null>(null);
  
  /**
   * = Actions ---------------------
   */

  const performSearch = useCallback((value: string) => {
    lastRequestQuery.current = value;
    getProxy().startOmniboxQuery(value);

    // HACK for local dev.
    // setSearchResultsState({ results: fakeResults, focusedIndex: 0 });
  }, [])

  const maybeAcceptInlineAutocomplete = useCallback(() => {
    const data = inlineAutocompleteRef.current?.getData();
    if (!data) return;

    const { inputText, completionText } = data;
    if (!inputText || !completionText) return;

    const fullValue = inputText + completionText;
    if (!fullValue) return;

    // TODO: Come back to this when dealing with the programmatic modification of the ChatInput value.
    console.log('Accept Inline Autocompletion:', fullValue);
  }, []);

  const setNextInlineAutoComplete = useCallback((results: OmniSearchResultMatch[], index: number) => {
    let inputText = '';
    let completionText = '';
    const showInlineAutocomplete = (
      results.length && 
      !results[index].isSearchType && 
      !!results[index].inlineAutocompletion
    );
    if (showInlineAutocomplete) {
      inputText = currentValue.current;
      completionText = results[index].inlineAutocompletion;
    }
    nextInlineAutocompleteProps.current = { inputText, completionText };
  }, [])

  const hideSearchResults = useCallback(() => {
    nextInlineAutocompleteProps.current = { inputText: '', completionText: '' };
    if (!showSearchResults.current) return;
    showSearchResults.current = false;
    setSearchResultsState({ results: [], focusedIndex: 0 });
  }, []);

  const detectUrl = useCallback((value: string) => {
    urlDetectionEnabled.current = true;
    lastRequestQuery.current = value;
    getProxy().startOmniboxQuery(value);
  }, [])

  const navToExternalUrl = useCallback((url: string) => {
    window.location.href = url;
  }, []);

  const submitQuery = useCallback((value: string) => {
    console.log('Submit Query:', value);
  }, []);

  const selectSearchResult = useCallback((result?: OmniSearchResultMatch) => {
    const { results, focusedIndex } = searchResultsState;
    const selectedResult = result || results[focusedIndex];

    if (!selectedResult) {
      console.error(`No selected result found for focused index: ${focusedIndex}`);
      return;
    }
    
    // Selected search query.
    if (selectedResult.isSearchType) {
      const { swapContentsAndDescription, description, contents } = selectedResult;
      const query = swapContentsAndDescription ? description : contents;
      submitQuery(query);
    }
    // Selected URL/domain.
    else {
      navToExternalUrl(selectedResult.destinationUrl);
    }
  }, [searchResultsState.results, searchResultsState.focusedIndex, submitQuery, navToExternalUrl]);

  /**
   * = Proxy Handlers --------------
   */

  const onAutocompleteResponse = useCallback((_, response: OmniboxResponse) => {
    const isForLastRequest = response.inputText === lastRequestQuery.current;
    const valueHasSinceChanged = response.inputText !== currentValue.current.trim();
    if (!isForLastRequest || valueHasSinceChanged) return;

    let results = response.combinedResults || [];

    if (urlDetectionEnabled.current) {
      results = applyCustomSortAndFilterRules(results, response.inputText);
      const firstResult = results[0];
      if (
        firstResult && 
        firstResult.type === OmniResultType.UrlWhatYouTyped &&
        firstResult.destinationUrl &&
        (
          firstResult.destinationUrl.startsWith('chrome://') || 
          firstResult.destinationUrl.startsWith('http://') ||
          firstResult.destinationUrl.startsWith('https://')
        )
      ) {
        detectedDestinationUrl.current = results[0].destinationUrl;
      } else {
        detectedDestinationUrl.current = null;
      }
      return;
    }

    if (useMultilineStyle || forceHideSearchResults.current) return;

    const allProvidersDone = results.every(r => r.providerDone);
    const useResults = (
      allProvidersDone || 
      response.inputText.length === 1 ||
      inlineAutocompleteRef.current?.hasCompletionText()
    );
    if (!useResults) return;

    results = applyCustomSortAndFilterRules(results, response.inputText);

    setNextInlineAutoComplete(results, 0);
    setSearchResultsState({ results, focusedIndex: 0 });
  }, [setNextInlineAutoComplete, useMultilineStyle])

  /**
   * = Event Handlers ----------------
   */

  const onArrowUp = useCallback(() => {
    setSearchResultsState(prevState => {
      const { results, focusedIndex: currentIndex } = prevState;
      if (results.length <= 1) return prevState;

      let newIndex = currentIndex - 1;
      if (newIndex < 0) {
        newIndex = results.length - 1;
      }

      setNextInlineAutoComplete(results, newIndex);

      return { results, focusedIndex: newIndex };
    });
  }, [setNextInlineAutoComplete])

  const onArrowDown = useCallback(() => {
    setSearchResultsState(prevState => {
      const { results, focusedIndex: currentIndex } = prevState;
      if (results.length <= 1) return prevState;

      let newIndex = currentIndex + 1;
      if (newIndex >= results.length) {
        newIndex = 0;
      }

      setNextInlineAutoComplete(results, newIndex);

      return { results, focusedIndex: newIndex };
    });
  }, [setNextInlineAutoComplete])

  const onEscape = useCallback(() => {
    forceHideSearchResults.current = true;
    hideSearchResults();
  }, [hideSearchResults])

  const onTab = useCallback(() => {
    if (useMultilineStyle) {
      multilineSubmitButtonRef.current?.focus();
    } else {
      maybeAcceptInlineAutocomplete(); // TODO: Come back to this.
    }
  }, [maybeAcceptInlineAutocomplete, useMultilineStyle])

  const onKeyDown = useCallback((event: React.KeyboardEvent, value: string, cursorAtEndPosition: boolean) => {
    switch (event.key) {
      case key.ARROW_UP:
        if (useMultilineStyle) return;
        event.preventDefault();
        onArrowUp();
        break;
      case key.ARROW_DOWN:
        if (useMultilineStyle) return;
        event.preventDefault();
        onArrowDown();
        break;
      case key.ARROW_RIGHT:
        cursorAtEndPosition && maybeAcceptInlineAutocomplete();
        break;
      case key.ESCAPE:
        event.preventDefault();
        onEscape();
        break;
    }
  }, [onArrowUp, onArrowDown, maybeAcceptInlineAutocomplete, onEscape, useMultilineStyle])

  const onChange = useCallback((_, value: string, lineCount: number) => {
    currentValue.current = value;
    const trimmedValue = value.trim();
    const isSingleWord = trimmedValue.split(' ').length === 1;
    const isMultiline = lineCount > 1;

    const forceUrlDetection = (
      isSingleWord &&
      trimmedValue.includes('.') &&
      (isMultiline || useMultilineStyle)
    );

    if (urlDetectionEnabled.current && !forceUrlDetection) {
      urlDetectionEnabled.current = false;
      detectedDestinationUrl.current = null;
    }

    // Switch to multiline.
    if (isMultiline) {
      hideSearchResults();
      useMultilineStyle || setUseMultilineStyle(true);
      forceUrlDetection && detectUrl(trimmedValue);
      return;
    }

    // Hide search.
    const numWords = value.split(' ').filter(w => !!w).length;
    if (numWords > MAX_WORDS_FOR_SEARCH_SUGGESTIONS) {
      hideSearchResults();
      return;
    }
 
    // Perform search.
    if (trimmedValue) {
      if (!forceHideSearchResults.current && !useMultilineStyle) {
        performSearch(trimmedValue);
      } else if (forceUrlDetection) {
        detectUrl(trimmedValue);
      }
      return;
    }

    // Empty input.
    lastRequestQuery.current = '';
    hideSearchResults();
  }, [useMultilineStyle, performSearch, hideSearchResults, detectUrl])

  const onEmptyShiftEnter = useCallback(() => {
    forceHideSearchResults.current = true;
    hideSearchResults();
    useMultilineStyle || setUseMultilineStyle(true);
  }, [hideSearchResults, useMultilineStyle]);

  const onSubmit = useCallback(() => {
    // Select search result.
    if (showSearchResults.current && searchResultsState.results.length) {
      selectSearchResult();
      return;
    }

    // URL detected while in multiline mode.
    if (detectedDestinationUrl.current) {
      navToExternalUrl(detectedDestinationUrl.current);
      return;
    }

    // Query exact input value (trimmed).
    const trimmedValue = currentValue.current.trim();
    if (trimmedValue) {
      submitQuery(trimmedValue);
    }
  }, [
    selectSearchResult,
    searchResultsState.results, 
    navToExternalUrl,
    submitQuery,
  ]);
  
  /**
   * = Effects -----------------------
   */

  // Initial input bar animation.
  useEffect(() => {
    animatedIn || setTimeout(() => setAnimatedIn(true), 10);
  }, [animatedIn]);

  // Set up proxy event listeners.
  useEffect(() => {
    const proxy = getProxy();
    const eventIds: number[] = [
      proxy.addListener(ProxyEvent.AutocompleteResponse, onAutocompleteResponse),
    ];
    return () => eventIds.forEach(id => getProxy().removeListener(id));
  }, []);

  // Update inline autocomplete if needed.
  useEffect(() => {
    if (nextInlineAutocompleteProps.current) {
      inlineAutocompleteRef.current?.update(nextInlineAutocompleteProps.current);
      nextInlineAutocompleteProps.current = null;
    } else if (currentValue.current === '') {
      inlineAutocompleteRef.current?.update({ inputText: '', completionText: '' });
    }
  })

  // Scroll to focused search result if out of view.
  useEffect(() => {
    const containerElement = searchResultsLinerRef.current;
    const focusedElement = containerElement?.children[searchResultsState.focusedIndex] as HTMLElement;
    
    if (!containerElement || !focusedElement) return;

    const containerClientRect = containerElement.getBoundingClientRect();
    const containerRect = { 
      top: containerClientRect.top,
      height: containerClientRect.height,
      bottom: containerClientRect.bottom
    };
    containerRect.top += SEARCH_RESULT_HEIGHT / 2;
    containerRect.height = SEARCH_RESULT_HEIGHT * SEARCH_RESULTS_PER_PAGE;
    containerRect.bottom = containerRect.top + containerRect.height;
    const elementRect = focusedElement.getBoundingClientRect();

    // Calculate if element is outside visible area
    const isAbove = elementRect.top < containerRect.top;
    const isBelow = elementRect.bottom > containerRect.bottom;

    if (isAbove || isBelow) {
      // Calculate the new scroll position
      const elementRelativeTop = elementRect.top - containerRect.top;
      const currentScroll = containerElement.scrollTop;
      
      let newScrollTop;
      if (isAbove) {
        // Scroll up to bring element to top
        newScrollTop = currentScroll + elementRelativeTop;
      } else {
        // Scroll down to bring element to bottom
        newScrollTop = currentScroll + (elementRelativeTop - containerRect.height + elementRect.height);
      }

      containerElement.scrollTo({ top: newScrollTop });
    }
  }, [searchResultsState.focusedIndex])

  useEffect(() => {
    const hadNoPreviousResults = lastSearchResultsCount.current === 0;
    const hasCurrentResults = searchResultsState.results.length > 0;
    const doShowSearchResults = hadNoPreviousResults && hasCurrentResults;
    lastSearchResultsCount.current = searchResultsState.results.length;

    if (doShowSearchResults) {
      showSearchResults.current = true;
      setTimeout(() => forceRender(v => !v), 15);
    } else if (!hasCurrentResults) {
      showSearchResults.current = false;
    }
  }, [searchResultsState.results.length])

  /**
   * = Rendering ---------------------
   */

  const classes = cn(
    baseClass,
    animatedIn ? pcn('--show') : '',
    useMultilineStyle ? pcn('--multiline') : '',
  );

  return (
    <div className={classes}>
      <div className={pcn('__input-bar')}>
        <Icon 
          icon='search'
          size='xs'
          attention='highest'
        />
        <ChatInput
          id={baseClass}
          size='md'
          autoFocus={true}
          placeholder={placeholder}
          isMultiline={useMultilineStyle}
          hasDetectedDestinationUrl={() => !!detectedDestinationUrl.current}
          onKeyDown={onKeyDown}
          onTab={onTab}
          onChange={onChange}
          onSubmit={onSubmit}
          onEmptyShiftEnter={onEmptyShiftEnter}
        />
        <InlineAutocomplete ref={inlineAutocompleteRef} />
      </div>
      <div className={pcn('__search-results', showSearchResults.current ? '__search-results--show' : '')}>
        <div className={pcn('__search-results-liner')} ref={searchResultsLinerRef}>
          { searchResultsState.results.map((r, i) => (
            <SearchResult
              key={formatSearchResultKey(r, i)}
              result={r}
              focused={searchResultsState.focusedIndex === i}
              onClick={() => selectSearchResult(r)}
            />
          ))}
        </div>
      </div>
      <div className={pcn('__multiline-control-bar')}>
        <div className={pcn('__multiline-control-bar-liner')}>
          <Icon
            icon='arrow-right'
            size='xs'
            attention='moderate'
            tabIndex={1}
            onClick={() => onSubmit()}
            ref={multilineSubmitButtonRef}
          />
          <Icon
            icon='at'
            size='xs'
            attention='moderate'
            tabIndex={2}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};