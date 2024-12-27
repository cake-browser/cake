import { PageProps } from './types.js';
import { Omni } from '../omni/Omni.js';

export const EntryPage = ({ id, navToPage }: PageProps) => ( 
  <div id={id} className='ntp'>
    <Omni />
  </div>
);