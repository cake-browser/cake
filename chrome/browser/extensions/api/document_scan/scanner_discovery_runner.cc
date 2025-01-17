// Copyright 2023 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//
#include "chrome/browser/extensions/api/document_scan/scanner_discovery_runner.h"

#include "base/containers/contains.h"
#include "base/strings/utf_string_conversions.h"
#include "chrome/browser/profiles/profile.h"
#include "chrome/browser/ui/extensions/extensions_dialogs.h"
#include "chrome/common/pref_names.h"
#include "chromeos/crosapi/mojom/document_scan.mojom.h"
#include "components/prefs/pref_service.h"
#include "extensions/browser/image_loader.h"
#include "extensions/common/extension.h"
#include "ui/gfx/image/image.h"
#include "ui/gfx/image/image_skia.h"
#include "ui/views/native_window_tracker.h"

namespace extensions {

namespace {

// Icon size for confirmation dialogs.
constexpr int kIconSize = 64;

// There is no easy way to interact with UI dialogs that are generated by Chrome
// itself, so we need to have a way to bypass this for testing.
std::optional<bool> g_discovery_confirmation_result = std::nullopt;

bool CanSkipConfirmation(content::BrowserContext* browser_context,
                         const ExtensionId& extension_id) {
  const base::Value::List& list =
      Profile::FromBrowserContext(browser_context)
          ->GetPrefs()
          ->GetList(prefs::kDocumentScanAPITrustedExtensions);
  return base::Contains(list, base::Value(extension_id));
}

}  // namespace

ScannerDiscoveryRunner::ScannerDiscoveryRunner(
    gfx::NativeWindow native_window,
    content::BrowserContext* browser_context,
    scoped_refptr<const Extension> extension,
    crosapi::mojom::DocumentScan* document_scan)
    : native_window_(native_window),
      browser_context_(browser_context),
      extension_(std::move(extension)),
      document_scan_(document_scan) {
  CHECK(extension_);
  if (native_window_) {
    native_window_tracker_ = views::NativeWindowTracker::Create(native_window_);
  }
}

ScannerDiscoveryRunner::~ScannerDiscoveryRunner() = default;

// static
void ScannerDiscoveryRunner::SetDiscoveryConfirmationResultForTesting(
    bool result) {
  g_discovery_confirmation_result = result;
}

void ScannerDiscoveryRunner::Start(bool approved,
                                   crosapi::mojom::ScannerEnumFilterPtr filter,
                                   GetScannerListCallback callback) {
  CHECK(!callback_) << "discovery call already in progress";
  callback_ = std::move(callback);
  filter_ = std::move(filter);

  if (approved || CanSkipConfirmation(browser_context_, extension_->id())) {
    SendGetScannerListRequest();
    return;
  }

  // If a test has set the confirmation result, go directly to the end handler
  // instead of displaying the dialog.
  if (g_discovery_confirmation_result) {
    OnConfirmationDialogClosed(g_discovery_confirmation_result.value());
    return;
  }

  ImageLoader::Get(browser_context_)
      ->LoadImageAtEveryScaleFactorAsync(
          extension_.get(), gfx::Size(kIconSize, kIconSize),
          base::BindOnce(&ScannerDiscoveryRunner::ShowScanDiscoveryDialog,
                         weak_ptr_factory_.GetWeakPtr()));
}

const ExtensionId& ScannerDiscoveryRunner::extension_id() const {
  return extension_->id();
}

void ScannerDiscoveryRunner::ShowScanDiscoveryDialog(const gfx::Image& icon) {
  // If the browser window was closed during API request handling, treat it the
  // same as if the user denied the request.
  if (native_window_tracker_ &&
      native_window_tracker_->WasNativeWindowDestroyed()) {
    OnConfirmationDialogClosed(false);
    return;
  }

  ShowDocumentScannerDiscoveryConfirmationDialog(
      native_window_, extension_->id(), base::UTF8ToUTF16(extension_->name()),
      icon.AsImageSkia(),
      base::BindOnce(&ScannerDiscoveryRunner::OnConfirmationDialogClosed,
                     weak_ptr_factory_.GetWeakPtr()));
}

void ScannerDiscoveryRunner::OnConfirmationDialogClosed(bool approved) {
  if (approved) {
    SendGetScannerListRequest();
    return;
  }

  auto response = crosapi::mojom::GetScannerListResponse::New();
  response->result = crosapi::mojom::ScannerOperationResult::kAccessDenied;
  std::move(callback_).Run(std::move(response));
}

void ScannerDiscoveryRunner::SendGetScannerListRequest() {
  document_scan_->GetScannerList(
      extension_->id(), std::move(filter_),
      base::BindOnce(&ScannerDiscoveryRunner::OnScannerListReceived,
                     weak_ptr_factory_.GetWeakPtr()));
}

void ScannerDiscoveryRunner::OnScannerListReceived(
    crosapi::mojom::GetScannerListResponsePtr response) {
  std::move(callback_).Run(std::move(response));
}

}  // namespace extensions
