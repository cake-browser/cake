#ifndef CHROME_BROWSER_UI_WEBUI_CAKE_NEW_TAB_CAKE_NEW_TAB_H_
#define CHROME_BROWSER_UI_WEBUI_CAKE_NEW_TAB_CAKE_NEW_TAB_H_

#include "chrome/common/webui_url_constants.h"
#include "content/public/browser/webui_config.h"
#include "content/public/browser/web_ui_controller.h"
#include "content/public/common/url_constants.h"

class CakeNewTabUI;

class CakeNewTabUIConfig : public content::DefaultWebUIConfig<CakeNewTabUI> {
 public:
  CakeNewTabUIConfig()
      : DefaultWebUIConfig(content::kChromeUIScheme,
                           chrome::kChromeUINewTabPageHost) {}
};

// The WebUI for chrome://new-tab-page
class CakeNewTabUI : public content::WebUIController {
 public:
  explicit CakeNewTabUI(content::WebUI* web_ui);
  ~CakeNewTabUI() override;
};

#endif // CHROME_BROWSER_UI_WEBUI_CAKE_NEW_TAB_CAKE_NEW_TAB_H_