// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef CHROME_BROWSER_UI_WEBUI_SIGNIN_BATCH_UPLOAD_HANDLER_H_
#define CHROME_BROWSER_UI_WEBUI_SIGNIN_BATCH_UPLOAD_HANDLER_H_

#include <string>

#include "base/containers/flat_map.h"
#include "base/functional/callback.h"
#include "base/types/id_type.h"
#include "chrome/browser/profiles/batch_upload/batch_upload_delegate.h"
#include "chrome/browser/ui/webui/signin/batch_upload/batch_upload.mojom.h"
#include "mojo/public/cpp/bindings/receiver.h"
#include "mojo/public/cpp/bindings/remote.h"

struct AccountInfo;

// WebUI message handler for the Batch Upload dialog bubble.
class BatchUploadHandler : public batch_upload::mojom::PageHandler {
 public:
  // Initializes the handler with the mojo handlers and the needed information
  // to be displayed as well as callbacks to the main native view.
  BatchUploadHandler(
      mojo::PendingReceiver<batch_upload::mojom::PageHandler> receiver,
      mojo::PendingRemote<batch_upload::mojom::Page> page,
      const AccountInfo& account_info,
      std::vector<BatchUploadDataContainer> data_containers_list,
      base::RepeatingCallback<void(int)> update_view_height_callback,
      SelectedDataTypeItemsCallback completion_callback);
  ~BatchUploadHandler() override;

  BatchUploadHandler(const BatchUploadHandler&) = delete;
  BatchUploadHandler& operator=(const BatchUploadHandler&) = delete;

  // batch_upload::mojom::PageHandler:
  void UpdateViewHeight(uint32_t height) override;
  // The order of the input vector `ids_to_move` matches with the order of
  // `data_containers_list_`.
  void SaveToAccount(
      const std::vector<std::vector<int32_t>>& ids_to_move) override;
  void Close() override;

 private:
  // Strong Alias ID which is reprenseted as an int.
  using InternalId = base::IdType32<BatchUploadHandler>;

  // Construct the `BatchUploadData` structure to be used in the Ui. Combining
  // the account info, dialog subtitle and a list of data containers.
  // The Data contaiers are a list items to be shown on the batch upload ui.
  // Sending the information using the Mojo equivalent structures:
  // `BatchUploadDataContainer` -> `batch_upload::mojom::DataContainer`
  // `BatchUploadDataItem` -> `batch_upload::mojom::DataItem`
  // Also populates the `internal_data_item_id_mapping_list_` for each data
  // item per section.
  batch_upload::mojom::BatchUploadDataPtr ConstructMojoBatchUploadData(
      const AccountInfo& account_info);

  std::vector<BatchUploadDataContainer> data_containers_list_;
  base::RepeatingCallback<void(int)> update_view_height_callback_;
  SelectedDataTypeItemsCallback completion_callback_;

  // Internal Id mapping used to map items from their real
  // `BatchUploadDataItemModel::DataId` (which can be of different types) to the
  // id given to the Ui through Mojo (which is a fixed type). The vector size
  // matches the `data_containers_list_` size and positions.
  // The mapping is needed for getting back the real ids when receiving the
  // result from Mojo in `SaveToAccount()`.
  std::vector<base::flat_map<InternalId, BatchUploadDataItemModel::DataId>>
      internal_data_item_id_mapping_list_;

  // Allows handling received messages from the web ui page.
  mojo::Receiver<batch_upload::mojom::PageHandler> receiver_;
  // Interface to send information to the web ui page.
  mojo::Remote<batch_upload::mojom::Page> page_;
};

#endif  // CHROME_BROWSER_UI_WEBUI_SIGNIN_BATCH_UPLOAD_HANDLER_H_
