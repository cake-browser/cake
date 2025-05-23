// Copyright 2018 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "services/network/http_cache_data_counter.h"

#include <utility>

#include "base/functional/bind.h"
#include "base/functional/callback.h"
#include "base/location.h"
#include "base/memory/ptr_util.h"
#include "base/memory/raw_ptr.h"
#include "base/task/sequenced_task_runner.h"
#include "net/disk_cache/disk_cache.h"
#include "net/http/http_cache.h"
#include "net/url_request/url_request_context.h"

namespace network {

std::unique_ptr<HttpCacheDataCounter> HttpCacheDataCounter::CreateAndStart(
    net::URLRequestContext* url_request_context,
    base::Time start_time,
    base::Time end_time,
    HttpCacheDataCounterCallback callback) {
  HttpCacheDataCounter* instance =
      new HttpCacheDataCounter(start_time, end_time, std::move(callback));
  net::HttpCache* http_cache =
      url_request_context->http_transaction_factory()->GetCache();
  if (!http_cache) {
    // No cache, no space used. Posts a task, so it will run after the return.
    instance->PostResult(false, 0);
  } else {
    auto get_backend_callback = base::BindOnce(
        &HttpCacheDataCounter::GotBackend, instance->GetWeakPtr());
    net::HttpCache::GetBackendResult result =
        http_cache->GetBackend(std::move(get_backend_callback));
    if (result.first != net::ERR_IO_PENDING) {
      instance->GotBackend(result);
    }
  }

  return base::WrapUnique(instance);
}

HttpCacheDataCounter::HttpCacheDataCounter(
    base::Time start_time,
    base::Time end_time,
    HttpCacheDataCounterCallback callback)
    : start_time_(start_time),
      end_time_(end_time),
      callback_(std::move(callback)) {}

HttpCacheDataCounter::~HttpCacheDataCounter() {}

void HttpCacheDataCounter::GotBackend(
    std::pair<int, raw_ptr<disk_cache::Backend>> result) {
  int error_code = result.first;
  disk_cache::Backend* cache = result.second;
  DCHECK_LE(error_code, 0);
  bool is_upper_limit = false;
  if (error_code != net::OK) {
    PostResult(is_upper_limit, error_code);
    return;
  }

  if (!cache) {
    PostResult(is_upper_limit, 0);
    return;
  }

  int64_t rv;

  // Handle this here since some backends would DCHECK on this.
  if (start_time_ > end_time_) {
    PostResult(is_upper_limit, 0);
    return;
  }

  if (start_time_.is_null() && end_time_.is_max()) {
    rv = cache->CalculateSizeOfAllEntries(base::BindOnce(
        &HttpCacheDataCounter::PostResult, GetWeakPtr(), is_upper_limit));
  } else {
    rv = cache->CalculateSizeOfEntriesBetween(
        start_time_, end_time_,
        base::BindOnce(&HttpCacheDataCounter::PostResult, GetWeakPtr(),
                       is_upper_limit));
    if (rv == net::ERR_NOT_IMPLEMENTED) {
      is_upper_limit = true;
      rv = cache->CalculateSizeOfAllEntries(base::BindOnce(
          &HttpCacheDataCounter::PostResult, GetWeakPtr(), is_upper_limit));
    }
  }
  if (rv != net::ERR_IO_PENDING)
    PostResult(is_upper_limit, rv);
}

void HttpCacheDataCounter::PostResult(bool is_upper_limit,
                                      int64_t result_or_error) {
  base::SequencedTaskRunner::GetCurrentDefault()->PostTask(
      FROM_HERE, base::BindOnce(std::move(callback_), this, is_upper_limit,
                                result_or_error));
}

}  // namespace network
