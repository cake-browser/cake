import { React, useEffect, useState, Icon, useRef, useCallback } from 'resources/cake_ui/ui.rollup.js';
import { cn, getPCN } from '../../utils/cn.js';
// import { getProxy, ProxyEvent } from '../../proxy.js';
// import { AutocompleteControllerType, AutocompleteMatch, OmniboxResponse } from '../../../cake_new_tab.mojom-webui.js';

const baseClass = 'omnibar';
const pcn = getPCN(baseClass);

export const Omnibar = () => {
  const [animatedIn, setAnimatedIn] = useState<boolean>(false);
  const [value, setValue] = useState('');
  // const [results, setResults] = useState<AutocompleteMatch[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);
  const lastRequestQuery = useRef<string>('');
  const hasChanged = useRef<boolean>(false);

  const performSearch = useCallback((value: string) => {
    lastRequestQuery.current = value;
    // getProxy().startOmniboxQuery(value, Number(inputRef.current?.selectionEnd));
  }, [])

  const onInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    hasChanged.current = true;
    setValue((e.target as HTMLDivElement).innerText);
  }, [])
  
  // const onAutocompleteResponse = useCallback((
  //   controllerType: AutocompleteControllerType,
  //   response: OmniboxResponse,
  // ) => {
  //   console.log('NEW RESPONSE', controllerType, response);

  //   const isForLastRequest = response.inputText === lastRequestQuery.current.trimStart();
  //   if (!isForLastRequest) return;

  //   setResults(response.combinedResults || []);
  // }, [value])

  // const onAutocompleteQuery = useCallback((
  //   controllerType: AutocompleteControllerType, 
  //   inputText: string,
  // ) => {
  //   console.log('NEW QUERY', controllerType, inputText);
  // }, [])
  
  // const onAnswerImageData = useCallback((
  //   controllerType: AutocompleteControllerType,
  //   url: string,
  //   data: string,
  // ) => {
  //   console.log('ANSWER IMAGE DATA', controllerType, url, data);
  // }, [])

  useEffect(() => {
    if (animatedIn) {
      setTimeout(() => inputRef.current?.focus(), 1);
    } else {
      setTimeout(() => setAnimatedIn(true), 10);
    }
  }, [animatedIn]);

  useEffect(() => {
    // const proxy = getProxy();
    // const eventIds: number[] = [
    //   proxy.addListener(ProxyEvent.AutocompleteResponse, onAutocompleteResponse),
    //   proxy.addListener(ProxyEvent.AutocompleteQuery, onAutocompleteQuery),
    //   proxy.addListener(ProxyEvent.AnswerImageData, onAnswerImageData),
    // ];
    // return () => eventIds.forEach(id => getProxy().removeListener(id));
  }, []);

  useEffect(() => {
    hasChanged.current && performSearch(value);
  }, [value, performSearch]);

  const classes = cn(
    baseClass, 
    animatedIn ? pcn('--show') : '',
  );

  const lines = value.split('\n');
  const showPlaceholder = lines.length === 1 && lines[0] === '';

  return (
    <div className={classes}>
      <div className={pcn('__input-bar')}>
        <Icon icon='search' size='xs' attention='highest' />
        <div
          className='ck-super-input --md'
          // onKeyDown={onKeyDown}
          onInput={onInput}
          ref={inputRef}>
          {lines.map((line, i) => (
            <p key={i}>
              {line}
            </p>
          ))}
          {showPlaceholder && (
            <span className='ck-super-input__placeholder'>
              Explore something new...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};