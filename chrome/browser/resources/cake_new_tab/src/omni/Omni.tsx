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
import { results } from '../dev/data/search.js';

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
  const lastRequestQuery = useRef<string>('');

  /**
   * = Actions ---------------------
   */

  const performSearch = useCallback((value: string) => {
    lastRequestQuery.current = value;
    // getProxy().startOmniboxQuery(value);
    setSearchResults(results);
  }, [])

  /**
   * = Proxy Handlers --------------
   */

  const onAutocompleteResponse = useCallback((_, response: OmniboxResponse) => {
    const isForLastRequest = response.inputText === lastRequestQuery.current;
    if (!isForLastRequest) return;
    setSearchResults(response.combinedResults || []);
  }, [])

  const onAutocompleteQuery = useCallback((_, inputText: string) => {
  }, [])

  const onAnswerImageData = useCallback((_, url: string, data: string) => {
    setSearchResults(results => results.map(r => r.image === url ? { ...r, imageData: data } : r));
  }, [])

  /**
   * = Event Handlers ----------------
   */

  const onChange = useCallback((_, value: string) => {
    value = value.trim();

    if (value) {
      performSearch(value);
    } else {
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
      proxy.addListener(ProxyEvent.AutocompleteQuery, onAutocompleteQuery),
      proxy.addListener(ProxyEvent.AnswerImageData, onAnswerImageData),
    ];
    return () => eventIds.forEach(id => getProxy().removeListener(id));
  }, []);

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
          onChange={onChange}
          onSubmit={onSubmit}
        />
      </div>
      <div className={pcn('__search-results')}>
        <div className={pcn('__search-results-liner')}>
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