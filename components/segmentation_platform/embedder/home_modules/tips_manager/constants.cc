// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "components/segmentation_platform/embedder/home_modules/tips_manager/constants.h"

namespace segmentation_platform {

// LINT.IfChange(NameForTipIdentifier)
std::string NameForTipIdentifier(TipIdentifier tip) {
  switch (tip) {
    case TipIdentifier::kUnknown:
      return "Unknown";
    case TipIdentifier::kLensSearch:
      return "LensSearch";
    case TipIdentifier::kLensShop:
      return "LensShop";
    case TipIdentifier::kLensTranslate:
      return "LensTranslate";
    case TipIdentifier::kAddressBarPosition:
      return "AddressBarPosition";
    case TipIdentifier::kSavePasswords:
      return "SavePasswords";
    case TipIdentifier::kAutofillPasswords:
      return "AutofillPasswords";
    case TipIdentifier::kEnhancedSafeBrowsing:
      return "EnhancedSafeBrowsing";
  }
}
// LINT.ThenChange(/components/segmentation_platform/embedder/home_modules/tips_manager/constants.h:TipIdentifier)

// LINT.IfChange(TipIdentifierForName)
TipIdentifier TipIdentifierForName(std::string_view name) {
  if (name == "Unknown") {
    return TipIdentifier::kUnknown;
  } else if (name == "LensSearch") {
    return TipIdentifier::kLensSearch;
  } else if (name == "LensShop") {
    return TipIdentifier::kLensShop;
  } else if (name == "LensTranslate") {
    return TipIdentifier::kLensTranslate;
  } else if (name == "AddressBarPosition") {
    return TipIdentifier::kAddressBarPosition;
  } else if (name == "SavePasswords") {
    return TipIdentifier::kSavePasswords;
  } else if (name == "AutofillPasswords") {
    return TipIdentifier::kAutofillPasswords;
  } else if (name == "EnhancedSafeBrowsing") {
    return TipIdentifier::kEnhancedSafeBrowsing;
  } else {
    return TipIdentifier::kUnknown;  // Default to unknown if not found.
  }
}
// LINT.ThenChange(/components/segmentation_platform/embedder/home_modules/tips_manager/constants.h:TipIdentifier)

// LINT.IfChange(NameForTipPresentationContext)
std::string NameForTipPresentationContext(TipPresentationContext context) {
  switch (context) {
    case TipPresentationContext::kUnknown:
      return "Unknown";
    case TipPresentationContext::kIOSMagicStack:
      return "IOSMagicStack";
  }
}
// LINT.ThenChange(/components/segmentation_platform/embedder/home_modules/tips_manager/constants.h:TipPresentationContext)

constexpr char kFirstObservedTime[] = "first_observed_time";
constexpr char kLastObservedTime[] = "last_observed_time";
constexpr char kTotalOccurrences[] = "total_occurrences";
constexpr char kTipsSignalHistory[] =
    "segmentation_platform.tips.signal_history";

}  // namespace segmentation_platform
