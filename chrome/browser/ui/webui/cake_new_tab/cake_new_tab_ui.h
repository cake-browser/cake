#ifndef CHROME_BROWSER_UI_WEBUI_CAKE_NEW_TAB_CAKE_NEW_TAB_UI_H_
#define CHROME_BROWSER_UI_WEBUI_CAKE_NEW_TAB_CAKE_NEW_TAB_UI_H_

#include "build/build_config.h"
#include "chrome/browser/ui/webui/cake_new_tab/cake_new_tab.mojom-forward.h"
#include "chrome/common/webui_url_constants.h"
#include "content/public/browser/webui_config.h"
#include "content/public/common/url_constants.h"
#include "mojo/public/cpp/bindings/pending_receiver.h"
#include "ui/webui/mojo_web_ui_controller.h"

class CakeNewTabPageHandler;

class CakeNewTabUI;

class CakeNewTabUIConfig : public content::DefaultWebUIConfig<CakeNewTabUI> {
 public:
  CakeNewTabUIConfig()
      : DefaultWebUIConfig(content::kChromeUIScheme,
                           chrome::kChromeUINewTabPageHost) {}
};

// The WebUI for chrome://new-tab-page
class CakeNewTabUI : public ui::MojoWebUIController {
 public:
  explicit CakeNewTabUI(content::WebUI* contents);

  CakeNewTabUI(const CakeNewTabUI&) = delete;
  CakeNewTabUI& operator=(const CakeNewTabUI&) = delete;

  ~CakeNewTabUI() override;

  // Instantiates the implementor of the mojom::CakeNewTabPageHandler mojo
  // interface passing the pending receiver that will be internally bound.
  void BindInterface(mojo::PendingReceiver<cake_new_tab::mojom::CakeNewTabPageHandler> receiver);

 private:
  std::unique_ptr<CakeNewTabPageHandler> cake_new_tab_handler_;

  WEB_UI_CONTROLLER_TYPE_DECL();
};

#endif // CHROME_BROWSER_UI_WEBUI_CAKE_NEW_TAB_CAKE_NEW_TAB_UI_H_
