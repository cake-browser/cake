import { useState } from 'resources/cake_ui/ui.rollup.js';
import { EntryPage } from './EntryPage.js';
import { PageProps, PageId } from './types.js'

const pages = {
  [PageId.Entry]: (props: PageProps) => <EntryPage {...props} />,
}

export const PageManager = () => {
  const [pageId, setPageId] = useState<PageId>(PageId.Entry);
  const renderPage = pages[pageId];
  const pageProps = { id: pageId, navToPage: setPageId };

  return (
    <div className='ntp-container'>
      {renderPage && renderPage(pageProps)}
    </div>
  );
};