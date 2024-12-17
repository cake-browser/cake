export enum PageId {
  Entry = 'entry',
}

export type PageProps = {
  id: PageId;
  navToPage: (pageId: PageId) => void;
};
