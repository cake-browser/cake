// @ts-ignore
import { OmniSearchResultMatch } from './types.js';
import { cn, getPCN } from '../utils/cn.js';
import { useCallback, Icon } from 'resources/cake_ui/ui.rollup.js';
import { toFaviconUrl } from '../utils/url.js';

const baseClass = 'omni-search-result';
const pcn = getPCN(baseClass);

export type OmniresultProps = {
  result: OmniSearchResultMatch;
  focused: boolean;
}

export const SearchResult = ({ result, focused }: OmniresultProps) => {
  const {
    type,
    isSearchType,
    contents,
    description,
    swapContentsAndDescription,
    image, // url
    imageData, // base64
    destinationUrl,
  } = result;

  const renderIcon = useCallback(() => {
    if (image) {
      return (
        <div className={pcn('__icon', '__icon--img')}>
          { imageData && <img src={imageData}/> }
        </div>
      );
    }
    if (isSearchType) {
      return (
        <Icon
          className={pcn('__icon')}
          icon='search'
          size='xs'
          attention='lowest'
        />
      );
    }
    return (
      <div className={pcn('__icon', '__icon--img')}>
        <img src={toFaviconUrl(destinationUrl)}/>
      </div>
    )
  }, [type, image, imageData, isSearchType, destinationUrl]);

  const renderTitle = useCallback(() => {
    const title = swapContentsAndDescription ? description : contents;
    return <div className={pcn('__title')}><span>{title}</span></div>;
  }, [swapContentsAndDescription, description, contents]);

  const classes = cn(
    baseClass, 
    focused ? pcn('--focused') : '',
  );

  return (
    <div className={classes}>
      <div className={pcn('__liner')}>
        {renderIcon()}
        {renderTitle()}
      </div>
    </div>
  )
};