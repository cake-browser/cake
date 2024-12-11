#include "chrome/browser/ui/webui/cake_new_tab/cake_new_tab_ui.h"

#include "chrome/browser/ui/webui/webui_util.h"
#include "chrome/common/webui_url_constants.h"
#include "content/public/browser/browser_context.h"
#include "content/public/browser/web_contents.h"
#include "chrome/grit/cake_new_tab_resources.h"
#include "chrome/grit/cake_new_tab_resources_map.h"
#include "content/public/browser/web_ui.h"
#include "content/public/browser/web_ui_data_source.h"

CakeNewTabUI::CakeNewTabUI(content::WebUI* web_ui): content::WebUIController(web_ui) {
  // Set up the chrome://new-tab-page source.
  content::WebUIDataSource* source = content::WebUIDataSource::CreateAndAdd(
      web_ui->GetWebContents()->GetBrowserContext(),
      chrome::kChromeUINewTabPageHost);

  // Add required resources.
  webui::SetupWebUIDataSource(
      source,
      base::span(kCakeNewTabResources),
      IDR_CAKE_NEW_TAB_INDEX_HTML);
}

CakeNewTabUI::~CakeNewTabUI() = default;                                                                                                                                                                              