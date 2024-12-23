import { 
  CakeNewTabPageHandler,
  CakeNewTabPageHandlerRemote, 
  CakeNewTabPageCallbackRouter,
} from '../cake_new_tab.mojom-webui.js';

export enum ProxyEvent {
  AutocompleteResponse = 'handleNewAutocompleteResponse',
  AutocompleteQuery = 'handleNewAutocompleteQuery',
  AnswerImageData = 'handleAnswerImageData',
};

class Proxy {
  handler: CakeNewTabPageHandlerRemote;
  private callbackRouter: CakeNewTabPageCallbackRouter;

  constructor() {
    this.callbackRouter = new CakeNewTabPageCallbackRouter();
    this.handler = CakeNewTabPageHandler.getRemote();
    this.handler.setClientPage(this.callbackRouter.$.bindNewPipeAndPassRemote());
  }
  
  startOmniboxQuery(query: string, cursorPosition: number) {
    this.handler.startOmniboxQuery(
      query,
      false,
      cursorPosition,
      false,
      false,
      false,
      '',
      1,
    );
  }

  addListener(event: ProxyEvent, listener: any): number {
    return this.callbackRouter[event].addListener(listener);
  }

  removeListener(id: number) {
    this.callbackRouter.removeListener(id);
  }
};

let proxy: Proxy | null = null;

export const getProxy = (): Proxy => {
  proxy = proxy || new Proxy();
  return proxy;
};