import {
  useEffect,
  useState,
  useRef, 
  useCallback,
  Icon,
  ChatInput,
} from 'resources/cake_ui/ui.rollup.js';
import { cn, getPCN } from '../../utils/cn.js';
import { getProxy, ProxyEvent } from '../../proxy.js';
import { AutocompleteMatch, OmniboxResponse } from '../../../cake_new_tab.mojom-webui.js';

const baseClass = 'omnibar';
const pcn = getPCN(baseClass);

export const Omnibar = () => {
  const [animatedIn, setAnimatedIn] = useState<boolean>(false);
  const [results, setResults] = useState<AutocompleteMatch[]>([]);
  const lastRequestQuery = useRef<string>('');

  const performSearch = useCallback((value: string) => {
    lastRequestQuery.current = value;
    getProxy().startOmniboxQuery(value, value.length);
  }, [])

  const onAutocompleteResponse = useCallback((_, response: OmniboxResponse) => {
    const isForLastRequest = response.inputText === lastRequestQuery.current;
    if (!isForLastRequest) return;
    setResults(response.combinedResults || []);
  }, [])

  const onAutocompleteQuery = useCallback((_, inputText: string) => {
    console.log('NEW QUERY', inputText);
  }, [])

  const onChange = useCallback((_, value: string) => {
    value = value.trim();
    value && performSearch(value);
  }, [performSearch])

  const onSubmit = useCallback((value: string) => {
    console.log('SUBMIT', value);
  }, [])
  
  useEffect(() => {
    animatedIn || setTimeout(() => setAnimatedIn(true), 10);
  }, [animatedIn]);

  useEffect(() => {
    const proxy = getProxy();
    const eventIds: number[] = [
      proxy.addListener(ProxyEvent.AutocompleteResponse, onAutocompleteResponse),
      proxy.addListener(ProxyEvent.AutocompleteQuery, onAutocompleteQuery),
    ];
    return () => eventIds.forEach(id => getProxy().removeListener(id));
  }, []);

  console.log('RESULTS', results);

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
          size="md"
          placeholder="Explore something new..."
          onChange={onChange}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};