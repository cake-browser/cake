#include "chrome/browser/ui/webui/hello_world/hello_world_ui.h"

#include "chrome/browser/ui/webui/webui_util.h"
#include "chrome/common/webui_url_constants.h"
#include "content/public/browser/browser_context.h"
#include "content/public/browser/web_contents.h"
#include "chrome/grit/hello_world_resources.h"
#include "chrome/grit/hello_world_resources_map.h"
#include "content/public/browser/web_ui.h"
#include "content/public/browser/web_ui_data_source.h"

HelloWorldUI::HelloWorldUI(content::WebUI* web_ui)
    : content::WebUIController(web_ui) {
        
  // Set up the chrome://hello-world source.
  content::WebUIDataSource* source = content::WebUIDataSource::CreateAndAdd(
      web_ui->GetWebContents()->GetBrowserContext(),
      chrome::kChromeUIHelloWorldHost);

  // Add required resources.
  webui::SetupWebUIDataSource(
      source,
      base::span(kHelloWorldResources),
      IDR_HELLO_WORLD_HELLO_WORLD_HTML);
}

HelloWorldUI::~HelloWorldUI() = default;