export enum ProxyEvent {
  AutocompleteResponse = 'handleNewAutocompleteResponse',
  AutocompleteQuery = 'handleNewAutocompleteQuery',
  AnswerImageData = 'handleAnswerImageData',
};

/**
 * Proxy stub
 */
class DevProxy {

  constructor() {
    console.log('DevProxy constructor');
  }
  
  startOmniboxQuery(query: string) {
  }

  addListener(event: ProxyEvent, listener: any): number {
    return 0;
  }

  removeListener(id: number) {}
};

let devProxy: DevProxy | null = null;

export const getProxy = (): DevProxy => {
  devProxy = devProxy || new DevProxy();
  return devProxy;
}; 