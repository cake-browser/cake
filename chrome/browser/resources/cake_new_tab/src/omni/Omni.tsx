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
import { results } from '../dev/data/search.js';

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

/**
 * Omni input component.
 */
export const Omni = () => {
  const [animatedIn, setAnimatedIn] = useState<boolean>(false);
  const [searchResultsState, setSearchResultsState] = useState<SearchResultsState>({
    results: [],
    focusedIndex: 0,
  });
  const inlineAutocompleteRef = useRef<InlineAutocompleteHandle>(null);
  const lastRequestQuery = useRef<string>('');
  const currentValue = useRef<string>('');
  const nextInlineAutocompleteProps = useRef<InlineAutocompleteProps | null>(null);
  const searchResultsLinerRef = useRef<HTMLDivElement>(null);
  
  /**
   * = Actions ---------------------
   */

  const performSearch = useCallback((value: string) => {
    lastRequestQuery.current = value;
    getProxy().startOmniboxQuery(value);

    let inputText = '';
    let completionText = '';
    const showInlineAutocomplete = (
      results.length && 
      !results[0].isSearchType && 
      !!results[0].inlineAutocompletion
    );
    if (showInlineAutocomplete) {
      inputText = currentValue.current;
      completionText = results[0].inlineAutocompletion;
    }
    nextInlineAutocompleteProps.current = { inputText, completionText };

    setSearchResultsState({ results, focusedIndex: 0 });
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

  /**
   * = Proxy Handlers --------------
   */

  const onAutocompleteResponse = useCallback((_, response: OmniboxResponse) => {
    const isForLastRequest = response.inputText === lastRequestQuery.current;
    if (!isForLastRequest) return;

    const results = applyCustomSortAndFilterRules(
      response.combinedResults || [], 
      response.inputText
    );

    // Update inline autocomplete on next render.
    let inputText = '';
    let completionText = '';
    const showInlineAutocomplete = (
      results.length && 
      !results[0].isSearchType && 
      !!results[0].inlineAutocompletion
    );
    if (showInlineAutocomplete) {
      inputText = currentValue.current;
      completionText = results[0].inlineAutocompletion;
    }

    // For next render.
    nextInlineAutocompleteProps.current = { inputText, completionText };

    setSearchResultsState({ results, focusedIndex: 0 });
  }, [])

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

      return { results, focusedIndex: newIndex };
    });
  }, [])

  const onArrowDown = useCallback(() => {
    setSearchResultsState(prevState => {
      const { results, focusedIndex: currentIndex } = prevState;
      if (results.length <= 1) return prevState;

      let newIndex = currentIndex + 1;
      if (newIndex >= results.length) {
        newIndex = 0;
      }

      return { results, focusedIndex: newIndex };
    });
  }, [])

  const onEscape = useCallback(() => {
    console.log('ESCAPE');
  }, [])

  const onTab = useCallback(() => {
    maybeAcceptInlineAutocomplete();
  }, [maybeAcceptInlineAutocomplete])

  const onKeyDown = useCallback((event: React.KeyboardEvent, value: string, cursorAtEndPosition: boolean) => {
    switch (event.key) {
      case key.ARROW_UP:
        event.preventDefault();
        onArrowUp();
        break;
      case key.ARROW_DOWN:
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
  }, [onArrowUp, onArrowDown, maybeAcceptInlineAutocomplete, onEscape])

  const onChange = useCallback((_, value: string) => {
    currentValue.current = value;
    value = value.trim();

    if (value) {
      performSearch(value);
    } else {
      lastRequestQuery.current = '';
      nextInlineAutocompleteProps.current = { inputText: '', completionText: '' };
      setSearchResultsState({ results: [], focusedIndex: 0 });
    }
  }, [performSearch])

  const onSubmit = useCallback((value: string) => {
    console.log('SUBMIT', value);
  }, [])
  
  /**
   * = Effects -----------------------
   */

  useEffect(() => {
    animatedIn || setTimeout(() => setAnimatedIn(true), 10);
  }, [animatedIn]);

  useEffect(() => {
    const proxy = getProxy();
    const eventIds: number[] = [
      proxy.addListener(ProxyEvent.AutocompleteResponse, onAutocompleteResponse),
    ];
    return () => eventIds.forEach(id => getProxy().removeListener(id));
  }, []);

  useEffect(() => {
    if (nextInlineAutocompleteProps.current) {
      inlineAutocompleteRef.current?.update(nextInlineAutocompleteProps.current);
      nextInlineAutocompleteProps.current = null;
    } else if (currentValue.current === '') {
      inlineAutocompleteRef.current?.update({ inputText: '', completionText: '' });
    }
  })

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

      console.log('newScrollTop', newScrollTop, newScrollTop / SEARCH_RESULT_HEIGHT);

      containerElement.scrollTo({ top: newScrollTop });
    }
  }, [searchResultsState.focusedIndex])

  /**
   * = Rendering ---------------------
   */

  return (
    <div className={cn(baseClass, animatedIn ? pcn('--show') : '')}>
      <div className={pcn('__input-bar')}>
        <Icon 
          icon='search'
          size='xs'
          attention='highest'
        />
        <ChatInput
          id={baseClass}
          autoFocus={true}
          size='md'
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          onTab={onTab}
          onChange={onChange}
          onSubmit={onSubmit}
        />
        <InlineAutocomplete ref={inlineAutocompleteRef} />
      </div>
      <div className={pcn('__search-results')}>
        <div className={pcn('__search-results-liner')} ref={searchResultsLinerRef}>
          { searchResultsState.results.map((r, i) => (
            <SearchResult
              key={formatSearchResultKey(r, i)}
              result={r}
              focused={searchResultsState.focusedIndex === i}
            />
          ))}
        </div>
      </div>
    </div>
  );
};