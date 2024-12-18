// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef CHROME_BROWSER_ASH_POLICY_REPORTING_METRICS_REPORTING_KIOSK_VISION_KIOSK_VISION_TELEMETRY_SAMPLER_H_
#define CHROME_BROWSER_ASH_POLICY_REPORTING_METRICS_REPORTING_KIOSK_VISION_KIOSK_VISION_TELEMETRY_SAMPLER_H_

#include "components/reporting/metrics/sampler.h"

namespace reporting {

// Sampler used to create KioskVision messages to be sent via ERP controlled
// by a periodic collector.
class KioskVisionTelemetrySampler : public Sampler {
 public:
  KioskVisionTelemetrySampler() = default;
  KioskVisionTelemetrySampler(const KioskVisionTelemetrySampler&) = delete;
  KioskVisionTelemetrySampler& operator=(const KioskVisionTelemetrySampler&) =
      delete;
  ~KioskVisionTelemetrySampler() override = default;

  // Sampler:
  // Collects KioskVision's telemetry report whenever called and passes it to
  // the callback.
  void MaybeCollect(OptionalMetricCallback callback) override;
};

}  // namespace reporting

#endif  // CHROME_BROWSER_ASH_POLICY_REPORTING_METRICS_REPORTING_KIOSK_VISION_KIOSK_VISION_TELEMETRY_SAMPLER_H_
