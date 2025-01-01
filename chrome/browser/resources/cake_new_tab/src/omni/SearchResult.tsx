import { OmniSearchResultMatch } from './types.js';
import { cn, getPCN } from '../utils/cn.js';
import { useCallback, Icon } from 'resources/cake_ui/ui.rollup.js';
import { toFaviconUrl } from '../utils/url.js';
import { 
  hasOverrideIcon, 
  hasOverrideAnnotation,
  getOverrideIcon,
  getOverrideAnnotation,
} from './overrides.js';

const baseClass = 'omni-search-result';
const pcn = getPCN(baseClass);

export type OmniresultProps = {
  result: OmniSearchResultMatch;
  focused: boolean;
  onClick?: () => void;
}

export const SearchResult = ({ 
  result,
  focused, 
  onClick = () => {},
}: OmniresultProps) => {
  const {
    type,
    isSearchType,
    contents,
    description,
    swapContentsAndDescription,
    image, // url
    destinationUrl,
  } = result;
  
  const destinationHostname = destinationUrl ? new URL(destinationUrl).hostname : '';
  const shouldOverrideIcon = hasOverrideIcon(destinationHostname);
  const shouldOverrideDomainAnnotation = hasOverrideAnnotation(destinationHostname);

  const renderIcon = useCallback(() => {
    if (shouldOverrideIcon) {
      return (
        <Icon
          className={pcn('__icon', '__icon--override')}
          icon={getOverrideIcon(destinationHostname) as any}
          size='xs'
          attention='lowest'
        />
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
  }, [type, isSearchType, destinationUrl, destinationHostname, shouldOverrideIcon]);

  const renderTitle = useCallback(() => {
    const title = swapContentsAndDescription ? description : contents;
    return <div className={pcn('__title')}><span>{title}</span></div>;
  }, [swapContentsAndDescription, description, contents, destinationHostname]);

  const renderAnnotation = useCallback(() => {
    let annotation = '';

    // Search entity annotation
    if (isSearchType && image && !swapContentsAndDescription) {
      annotation = description;
    }
    // Domain annotation
    else if (!isSearchType && swapContentsAndDescription && destinationUrl) {
      const url = new URL(destinationUrl);
      annotation = url.hostname;

      if (url.port) {
        annotation += `:${url.port}`;
      }

      if (shouldOverrideDomainAnnotation) {
        annotation = getOverrideAnnotation(destinationUrl);
      }
    }

    if (!annotation) {
      return null;
    }

    return (
      <div className={pcn('__annotation')}>
        <span></span>
        <span>{annotation}</span>
      </div>
    );
  }, [
    isSearchType,
    image,
    swapContentsAndDescription,
    description,
    destinationUrl,
    destinationHostname,
    shouldOverrideDomainAnnotation,
  ]);

  const classes = cn(
    baseClass, 
    isSearchType ? pcn('--search-type') : '',
    focused ? pcn('--focused') : '',
  );

  return (
    <div className={classes} onClick={onClick}>
      <div className={pcn('__liner')}>
        {renderIcon()}
        {renderTitle()}
        {renderAnnotation()}
      </div>
    </div>
  );
};