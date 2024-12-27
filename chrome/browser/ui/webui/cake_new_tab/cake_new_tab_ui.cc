
#ifdef UNSAFE_BUFFERS_BUILD
#pragma allow_unsafe_buffers
#endif

#include "chrome/browser/ui/webui/cake_new_tab/cake_new_tab_ui.h"

#include <utility>

#include "base/feature_list.h"
#include "base/functional/bind.h"
#include "build/build_config.h"
#include "chrome/browser/profiles/profile.h"
#include "chrome/browser/ui/webui/cake_new_tab/cake_new_tab_page_handler.h"
#include "chrome/browser/ui/webui/webui_util.h"
#include "chrome/common/url_constants.h"
#include "chrome/grit/cake_new_tab_resources.h"
#include "chrome/grit/cake_new_tab_resources_map.h"
#include "content/public/browser/web_ui.h"
#include "content/public/browser/web_ui_controller.h"
#include "content/public/browser/web_ui_data_source.h"
#include "services/network/public/mojom/content_security_policy.mojom.h"
#include "ui/base/webui/web_ui_util.h"

CakeNewTabUI::CakeNewTabUI(content::WebUI* web_ui)
    : ui::MojoWebUIController(web_ui, /*enable_chrome_send=*/true) {

  content::WebUIDataSource* source = content::WebUIDataSource::CreateAndAdd(
      Profile::FromWebUI(web_ui), chrome::kChromeUINewTabPageHost);

  source->OverrideContentSecurityPolicy(
      network::mojom::CSPDirectiveName::TrustedTypes,
      "trusted-types static-types parse-html-subset;");

  source->AddResourcePaths(
      base::make_span(kCakeNewTabResources, kCakeNewTabResourcesSize));

  source->SetDefaultResource(IDR_CAKE_NEW_TAB_INDEX_HTML);
}

WEB_UI_CONTROLLER_TYPE_IMPL(CakeNewTabUI)

CakeNewTabUI::~CakeNewTabUI() {}

void CakeNewTabUI::BindInterface(
mojo::PendingReceiver<cake_new_tab::mojom::CakeNewTabPageHandler> receiver) {
  cake_new_tab_handler_ = std::make_unique<CakeNewTabPageHandler>(
      Profile::FromWebUI(web_ui()), std::move(receiver));
}