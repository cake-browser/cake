#ifndef CHROME_BROWSER_UI_WEBUI_HELLO_WORLD_HELLO_WORLD_H_
#define CHROME_BROWSER_UI_WEBUI_HELLO_WORLD_HELLO_WORLD_H_

#include "chrome/common/webui_url_constants.h"
#include "content/public/browser/webui_config.h"
#include "content/public/browser/web_ui_controller.h"
#include "content/public/common/url_constants.h"

class HelloWorldUI;

class HelloWorldUIConfig : public content::DefaultWebUIConfig<HelloWorldUI> {
 public:
  HelloWorldUIConfig()
      : DefaultWebUIConfig(content::kChromeUIScheme,
                           chrome::kChromeUIHelloWorldHost) {}
};

// The WebUI for chrome://hello-world
class HelloWorldUI : public content::WebUIController {
 public:
  explicit HelloWorldUI(content::WebUI* web_ui);
  ~HelloWorldUI() override;
};

#endif // CHROME_BROWSER_UI_WEBUI_HELLO_WORLD_HELLO_WORLD_H_