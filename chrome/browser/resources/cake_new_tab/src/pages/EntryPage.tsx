import { PageProps } from './types.js';
import { Omnibar } from '../components/Omnibar/Omnibar.js';

export const EntryPage = ({ id, navToPage }: PageProps) => ( 
  <div id={id} className='ntp'>
    <Omnibar />
  </div>
);