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
// import { results } from '../dev/data/search.js';

const baseClass = 'omni';
const pcn = getPCN(baseClass);
const placeholder = 'Do something magical...';

const formatSearchResultKey = (result: OmniSearchResultMatch, index: number): string => {
  const { type, contents, description } = result;
  return [index, type, contents, description].join('-');
}

/**
 * Omni input component.
 */
export const Omni = () => {
  const [animatedIn, setAnimatedIn] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<OmniSearchResultMatch[]>([]);
  const [focusedSearchResultIndex, setFocusedSearchResultIndex] = useState<number>(0);
  const inlineAutocompleteRef = useRef<InlineAutocompleteHandle>(null);
  const lastRequestQuery = useRef<string>('');
  const currentValue = useRef<string>('');
  const nextInlineAutocompleteProps = useRef<InlineAutocompleteProps | null>(null);
  const searchResultsLinerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToSearchResultsTop = useRef<boolean>(false);
  
  /**
   * = Actions ---------------------
   */

  const performSearch = useCallback((value: string) => {
    lastRequestQuery.current = value;
    getProxy().startOmniboxQuery(value);

    // setSearchResults(results);

    // // Update inline autocomplete.
    // let inputText = '';
    // let completionText = '';
    // const showInlineAutocomplete = (
    //   results.length && 
    //   !results[0].isSearchType && 
    //   !!results[0].inlineAutocompletion
    // );
    // if (showInlineAutocomplete) {
    //   inputText = currentValue.current;
    //   completionText = results[0].inlineAutocompletion;
    // }
    // inlineAutocompleteRef.current?.update({ inputText, completionText });
  }, [])

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
    shouldScrollToSearchResultsTop.current = true;

    setSearchResults(results);
  }, [])

  /**
   * = Event Handlers ----------------
   */

  const onChange = useCallback((_, value: string) => {
    currentValue.current = value;
    value = value.trim();

    if (value) {
      performSearch(value);
    } else {
      lastRequestQuery.current = '';
      nextInlineAutocompleteProps.current = { inputText: '', completionText: '' };
      setSearchResults([]);
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
    if (shouldScrollToSearchResultsTop.current) {
      searchResultsLinerRef.current?.scrollTo({ top: 0 });
      shouldScrollToSearchResultsTop.current = false;
    }
  })

  /**
   * = Rendering ---------------------
   */

  console.log(searchResults);

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
          onChange={onChange}
          onSubmit={onSubmit}
        />
        <InlineAutocomplete ref={inlineAutocompleteRef} />
      </div>
      <div className={pcn('__search-results')}>
        <div className={pcn('__search-results-liner')} ref={searchResultsLinerRef}>
          { searchResults.map((r, i) => (
            <SearchResult
              key={formatSearchResultKey(r, i)}
              result={r}
              focused={focusedSearchResultIndex === i}
            />
          ))}
        </div>
      </div>
    </div>
  );
};