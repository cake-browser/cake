import { useEffect, useState, Icon, TextInput, TextInputHandle, useRef } from 'resources/cake_ui/ui.rollup.js';
import { cn, getPCN } from '../../utils/cn.js';

const baseClass = 'omnibar';
const pcn = getPCN(baseClass);

export const Omnibar = () => {
  const [animatedIn, setAnimatedIn] = useState<boolean>(false);
  const inputRef = useRef<TextInputHandle>(null);

  useEffect(() => {
    if (animatedIn) {
      setTimeout(() => inputRef.current?.focus(), 1);
    } else {
      setTimeout(() => setAnimatedIn(true), 10);
    }
  }, [animatedIn]);

  const classes = cn(
    baseClass, 
    animatedIn ? pcn('--show') : '',
  );

  return (
    <div className={classes}>
      <div className={pcn('__input-bar')}>
        <Icon icon='search' size='xs' attention='highest' />
        <TextInput size="md" placeholder='Explore, learn, or do something magical...' ref={inputRef} />
      </div>
    </div>
  );
};