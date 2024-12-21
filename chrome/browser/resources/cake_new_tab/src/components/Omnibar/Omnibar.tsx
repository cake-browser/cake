import { React, useEffect, useState, Icon, useRef, useCallback } from 'resources/cake_ui/ui.rollup.js';
import { cn, getPCN } from '../../utils/cn.js';
import { getProxy, ProxyEvent } from '../../proxy.js';
import { AutocompleteControllerType, AutocompleteMatch, OmniboxResponse } from '../../../cake_new_tab.mojom-webui.js';

const baseClass = 'omnibar';
const pcn = getPCN(baseClass);

export const Omnibar = () => {
  const [animatedIn, setAnimatedIn] = useState<boolean>(false);
  const [value, setValue] = useState('');
  const [results, setResults] = useState<AutocompleteMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRequestQuery = useRef<string>('');
  const hasChanged = useRef<boolean>(false);

  const performSearch = useCallback((value: string) => {
    lastRequestQuery.current = value;
    getProxy().startOmnibarQuery(value, Number(inputRef.current?.selectionEnd));
  }, [])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    hasChanged.current = true;
    setValue(e.target.value);
  }, [])
  
  const onAutocompleteResponse = useCallback((
    controllerType: AutocompleteControllerType,
    response: OmniboxResponse,
  ) => {
    console.log('NEW RESPONSE', controllerType, response);

    const isForLastRequest = response.inputText === lastRequestQuery.current.trimStart();
    if (!isForLastRequest) return;

    setResults(response.combinedResults || []);
  }, [value])

  const onAutocompleteQuery = useCallback((
    controllerType: AutocompleteControllerType, 
    inputText: string,
  ) => {
    console.log('NEW QUERY', controllerType, inputText);
  }, [])
  
  const onAnswerImageData = useCallback((
    controllerType: AutocompleteControllerType,
    url: string,
    data: string,
  ) => {
    console.log('ANSWER IMAGE DATA', controllerType, url, data);
  }, [])

  useEffect(() => {
    if (animatedIn) {
      setTimeout(() => inputRef.current?.focus(), 1);
    } else {
      setTimeout(() => setAnimatedIn(true), 10);
    }
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

  useEffect(() => {
    hasChanged.current && performSearch(value);
  }, [value, performSearch]);

  const classes = cn(
    baseClass, 
    animatedIn ? pcn('--show') : '',
  );

  console.log('RESULTS', results);

  return (
    <div className={classes}>
      <div className={pcn('__input-bar')}>
        <Icon icon='search' size='xs' attention='highest' />
        <div className='ck-text-input --md'>
          <input
            type="text" 
            placeholder="Explore something new..."
            autoComplete="off"
            value={value}
            onChange={onChange}
            ref={inputRef} 
          />
        </div>
      </div>
    </div>
  );
};