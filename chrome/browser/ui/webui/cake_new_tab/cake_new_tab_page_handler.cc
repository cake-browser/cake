// Copyright 2012 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "chrome/browser/ui/webui/cake_new_tab/cake_new_tab_page_handler.h"

#include <stddef.h>

#include <string>
#include <utility>

#include "base/auto_reset.h"
#include "base/base64.h"
#include "base/check.h"
#include "base/functional/bind.h"
#include "base/ranges/algorithm.h"
#include "base/strings/string_number_conversions.h"
#include "base/strings/utf_string_conversions.h"
#include "base/time/time.h"
#include "base/values.h"
#include "chrome/browser/autocomplete/autocomplete_scoring_model_service_factory.h"
#include "chrome/browser/autocomplete/chrome_autocomplete_provider_client.h"
#include "chrome/browser/autocomplete/chrome_autocomplete_scheme_classifier.h"
#include "chrome/browser/bitmap_fetcher/bitmap_fetcher_service.h"
#include "chrome/browser/bitmap_fetcher/bitmap_fetcher_service_factory.h"
#include "chrome/browser/bookmarks/bookmark_model_factory.h"
#include "chrome/browser/history/history_service_factory.h"
#include "chrome/browser/omnibox/autocomplete_controller_emitter_factory.h"
#include "chrome/browser/profiles/profile.h"
#include "chrome/browser/search/search.h"
#include "chrome/browser/search_engines/template_url_service_factory.h"
#include "chrome/browser/ui/webui/cake_new_tab/cake_new_tab.mojom-forward.h"
#include "components/bookmarks/browser/bookmark_model.h"
#include "components/history/core/browser/history_service.h"
#include "components/history/core/browser/url_database.h"
#include "components/omnibox/browser/actions/omnibox_pedal.h"
#include "components/omnibox/browser/autocomplete_classifier.h"
#include "components/omnibox/browser/autocomplete_controller.h"
#include "components/omnibox/browser/autocomplete_controller_emitter.h"
#include "components/omnibox/browser/autocomplete_match.h"
#include "components/omnibox/browser/autocomplete_provider.h"
#include "components/omnibox/browser/autocomplete_result.h"
#include "components/omnibox/browser/omnibox_feature_configs.h"
#include "components/omnibox/browser/omnibox_field_trial.h"
#include "components/optimization_guide/machine_learning_tflite_buildflags.h"
#include "components/search_engines/template_url.h"
#include "content/public/browser/web_ui.h"
#include "third_party/metrics_proto/omnibox_event.pb.h"
#include "third_party/metrics_proto/omnibox_focus_type.pb.h"
#include "third_party/omnibox_proto/answer_data.pb.h"
#include "third_party/omnibox_proto/answer_type.pb.h"
#include "third_party/skia/include/core/SkBitmap.h"
#include "ui/gfx/image/image.h"

#if BUILDFLAG(BUILD_WITH_TFLITE_LIB)
#include "components/omnibox/browser/autocomplete_scoring_model_service.h"
#endif

using bookmarks::BookmarkModel;

namespace {

std::string AnswerTypeToString(int answer_type) {
  switch (answer_type) {
    case omnibox::ANSWER_TYPE_UNSPECIFIED:
      return "invalid";
    case omnibox::ANSWER_TYPE_DICTIONARY:
      return "dictionary";
    case omnibox::ANSWER_TYPE_FINANCE:
      return "finance";
    case omnibox::ANSWER_TYPE_GENERIC_ANSWER:
      return "knowledge graph";
    case omnibox::ANSWER_TYPE_SPORTS:
      return "sports";
    case omnibox::ANSWER_TYPE_SUNRISE_SUNSET:
      return "sunrise";
    case omnibox::ANSWER_TYPE_TRANSLATION:
      return "translation";
    case omnibox::ANSWER_TYPE_WEATHER:
      return "weather";
    case omnibox::ANSWER_TYPE_WHEN_IS:
      return "when is";
    case omnibox::ANSWER_TYPE_CURRENCY:
      return "currency";
    case omnibox::ANSWER_TYPE_LOCAL_TIME:
      return "local time";
    case omnibox::ANSWER_TYPE_PLAY_INSTALL:
      return "play install";
    default:
      return base::NumberToString(answer_type);
  }
}

std::string SuggestionAnswerImageLineToString(
    const SuggestionAnswer::ImageLine& image_line) {
  std::string string;
  for (auto text_field : image_line.text_fields())
    string += base::UTF16ToUTF8(text_field.text());
  if (image_line.additional_text())
    string += " " + base::UTF16ToUTF8(image_line.additional_text()->text());
  if (image_line.status_text())
    string += " " + base::UTF16ToUTF8(image_line.status_text()->text());
  return string;
}

}  // namespace

namespace mojo {

template <>
struct TypeConverter<std::vector<cake_new_tab::mojom::ACMatchClassificationPtr>,
                     AutocompleteMatch::ACMatchClassifications> {
  static std::vector<cake_new_tab::mojom::ACMatchClassificationPtr> Convert(
      const AutocompleteMatch::ACMatchClassifications& input) {
    std::vector<cake_new_tab::mojom::ACMatchClassificationPtr> array;
    for (auto classification : input) {
      auto item = cake_new_tab::mojom::ACMatchClassification::New(classification.offset,
                                                    classification.style);
      array.push_back(std::move(item));
    }
    return array;
  }
};

// Boilerplate for `mojom.field = proto.field`.
#define PROTO_TO_MOJOM_SIGNAL(field) \
  mojom_signals->field =             \
      signals.has_##field() ? std::optional{signals.field()} : std::nullopt;
// Boilerplate for `proto.field = mojom.field`.
#define MOJOM_TO_PROTO_SIGNAL(field)    \
  if (mojom_signals->field.has_value()) \
    signals.set_##field(mojom_signals->field.value());

template <>
struct TypeConverter<cake_new_tab::mojom::SignalsPtr, AutocompleteMatch::ScoringSignals> {
  static cake_new_tab::mojom::SignalsPtr Convert(
      const AutocompleteMatch::ScoringSignals signals) {
    cake_new_tab::mojom::SignalsPtr mojom_signals(cake_new_tab::mojom::Signals::New());

    PROTO_TO_MOJOM_SIGNAL(typed_count);
    PROTO_TO_MOJOM_SIGNAL(visit_count);
    PROTO_TO_MOJOM_SIGNAL(elapsed_time_last_visit_secs);
    PROTO_TO_MOJOM_SIGNAL(shortcut_visit_count);
    PROTO_TO_MOJOM_SIGNAL(shortest_shortcut_len);
    PROTO_TO_MOJOM_SIGNAL(elapsed_time_last_shortcut_visit_sec);
    PROTO_TO_MOJOM_SIGNAL(is_host_only);
    PROTO_TO_MOJOM_SIGNAL(num_bookmarks_of_url);
    PROTO_TO_MOJOM_SIGNAL(first_bookmark_title_match_position);
    PROTO_TO_MOJOM_SIGNAL(total_bookmark_title_match_length);
    PROTO_TO_MOJOM_SIGNAL(num_input_terms_matched_by_bookmark_title);
    PROTO_TO_MOJOM_SIGNAL(first_url_match_position);
    PROTO_TO_MOJOM_SIGNAL(total_url_match_length);
    PROTO_TO_MOJOM_SIGNAL(host_match_at_word_boundary);
    PROTO_TO_MOJOM_SIGNAL(total_host_match_length);
    PROTO_TO_MOJOM_SIGNAL(total_path_match_length);
    PROTO_TO_MOJOM_SIGNAL(total_query_or_ref_match_length);
    PROTO_TO_MOJOM_SIGNAL(total_title_match_length);
    PROTO_TO_MOJOM_SIGNAL(has_non_scheme_www_match);
    PROTO_TO_MOJOM_SIGNAL(num_input_terms_matched_by_title);
    PROTO_TO_MOJOM_SIGNAL(num_input_terms_matched_by_url);
    PROTO_TO_MOJOM_SIGNAL(length_of_url);
    PROTO_TO_MOJOM_SIGNAL(site_engagement);
    PROTO_TO_MOJOM_SIGNAL(allowed_to_be_default_match);
    PROTO_TO_MOJOM_SIGNAL(search_suggest_relevance);
    PROTO_TO_MOJOM_SIGNAL(is_search_suggest_entity);
    PROTO_TO_MOJOM_SIGNAL(is_verbatim);
    PROTO_TO_MOJOM_SIGNAL(is_navsuggest);
    PROTO_TO_MOJOM_SIGNAL(is_search_suggest_tail);
    PROTO_TO_MOJOM_SIGNAL(is_answer_suggest);
    PROTO_TO_MOJOM_SIGNAL(is_calculator_suggest);

    return mojom_signals;
  }
};

template <>
struct TypeConverter<AutocompleteMatch::ScoringSignals, cake_new_tab::mojom::SignalsPtr> {
  static AutocompleteMatch::ScoringSignals Convert(
      const cake_new_tab::mojom::SignalsPtr& mojom_signals) {
    AutocompleteMatch::ScoringSignals signals;

    MOJOM_TO_PROTO_SIGNAL(typed_count);
    MOJOM_TO_PROTO_SIGNAL(visit_count);
    MOJOM_TO_PROTO_SIGNAL(elapsed_time_last_visit_secs);
    MOJOM_TO_PROTO_SIGNAL(shortcut_visit_count);
    MOJOM_TO_PROTO_SIGNAL(shortest_shortcut_len);
    MOJOM_TO_PROTO_SIGNAL(elapsed_time_last_shortcut_visit_sec);
    MOJOM_TO_PROTO_SIGNAL(is_host_only);
    MOJOM_TO_PROTO_SIGNAL(num_bookmarks_of_url);
    MOJOM_TO_PROTO_SIGNAL(first_bookmark_title_match_position);
    MOJOM_TO_PROTO_SIGNAL(total_bookmark_title_match_length);
    MOJOM_TO_PROTO_SIGNAL(num_input_terms_matched_by_bookmark_title);
    MOJOM_TO_PROTO_SIGNAL(first_url_match_position);
    MOJOM_TO_PROTO_SIGNAL(total_url_match_length);
    MOJOM_TO_PROTO_SIGNAL(host_match_at_word_boundary);
    MOJOM_TO_PROTO_SIGNAL(total_host_match_length);
    MOJOM_TO_PROTO_SIGNAL(total_path_match_length);
    MOJOM_TO_PROTO_SIGNAL(total_query_or_ref_match_length);
    MOJOM_TO_PROTO_SIGNAL(total_title_match_length);
    MOJOM_TO_PROTO_SIGNAL(has_non_scheme_www_match);
    MOJOM_TO_PROTO_SIGNAL(num_input_terms_matched_by_title);
    MOJOM_TO_PROTO_SIGNAL(num_input_terms_matched_by_url);
    MOJOM_TO_PROTO_SIGNAL(length_of_url);
    MOJOM_TO_PROTO_SIGNAL(site_engagement);
    MOJOM_TO_PROTO_SIGNAL(allowed_to_be_default_match);
    MOJOM_TO_PROTO_SIGNAL(search_suggest_relevance);
    MOJOM_TO_PROTO_SIGNAL(is_search_suggest_entity);
    MOJOM_TO_PROTO_SIGNAL(is_verbatim);
    MOJOM_TO_PROTO_SIGNAL(is_navsuggest);
    MOJOM_TO_PROTO_SIGNAL(is_search_suggest_tail);
    MOJOM_TO_PROTO_SIGNAL(is_answer_suggest);
    MOJOM_TO_PROTO_SIGNAL(is_calculator_suggest);

    return signals;
  }
};

#undef PROTO_TO_MOJOM_SIGNAL
#undef MOJOM_TO_PROTO_SIGNAL

template <>
struct TypeConverter<std::vector<cake_new_tab::mojom::DictionaryEntryPtr>,
                     AutocompleteMatch::AdditionalInfo> {
  static std::vector<cake_new_tab::mojom::DictionaryEntryPtr> Convert(
      const AutocompleteMatch::AdditionalInfo& input) {
    std::vector<cake_new_tab::mojom::DictionaryEntryPtr> array(input.size());
    size_t index = 0;
    for (auto i = input.begin(); i != input.end(); ++i, index++) {
      cake_new_tab::mojom::DictionaryEntryPtr item(cake_new_tab::mojom::DictionaryEntry::New());
      item->key = i->first;
      item->value = i->second;
      array[index] = std::move(item);
    }
    return array;
  }
};

template <>
struct TypeConverter<cake_new_tab::mojom::AutocompleteMatchPtr, AutocompleteMatch> {
  static cake_new_tab::mojom::AutocompleteMatchPtr Convert(const AutocompleteMatch& input) {
    cake_new_tab::mojom::AutocompleteMatchPtr result(cake_new_tab::mojom::AutocompleteMatch::New());
    if (input.provider) {
      result->provider_name = std::string(input.provider->GetName());
      result->provider_done = input.provider->done();
    }
    result->relevance = input.relevance;
    result->deletable = input.deletable;
    result->fill_into_edit = base::UTF16ToUTF8(input.fill_into_edit);
    result->inline_autocompletion =
        base::UTF16ToUTF8(input.inline_autocompletion);
    result->destination_url = input.destination_url.spec();
    result->stripped_destination_url = input.stripped_destination_url.spec();
    result->image = input.ImageUrl().spec().c_str();
    result->contents = base::UTF16ToUTF8(input.contents);
    result->contents_class =
        mojo::ConvertTo<std::vector<cake_new_tab::mojom::ACMatchClassificationPtr>>(
            input.contents_class);
    result->description = base::UTF16ToUTF8(input.description);
    result->description_class =
        mojo::ConvertTo<std::vector<cake_new_tab::mojom::ACMatchClassificationPtr>>(
            input.description_class);
    result->swap_contents_and_description = input.swap_contents_and_description;
    if (omnibox_feature_configs::SuggestionAnswerMigration::Get().enabled &&
        input.answer_template) {
      omnibox::AnswerData answer_data = input.answer_template->answers(0);
      result->answer = answer_data.headline().text() + " / " +
                       answer_data.subhead().text() + " / " +
                       AnswerTypeToString(input.answer_type);
    } else if (input.answer) {
      result->answer =
          SuggestionAnswerImageLineToString(input.answer->first_line()) +
          " / " +
          SuggestionAnswerImageLineToString(input.answer->second_line()) +
          " / " + AnswerTypeToString(input.answer_type);
    }
    result->transition =
        ui::PageTransitionGetCoreTransitionString(input.transition);
    result->allowed_to_be_default_match = input.allowed_to_be_default_match;
    result->type = AutocompleteMatchType::ToString(input.type);
    result->is_search_type = AutocompleteMatch::IsSearchType(input.type);
    omnibox::SuggestType type = input.suggest_type;
    auto subtypes = input.subtypes;
    AutocompleteController::ExtendMatchSubtypes(input, &subtypes);
    std::vector<std::string> subtypes_str;
    subtypes_str.push_back(base::NumberToString(type));
    base::ranges::transform(
        subtypes, std::back_inserter(subtypes_str),
        [](int subtype) { return base::NumberToString(subtype); });
    result->aqs_type_subtypes = base::JoinString(subtypes_str, ",");
    result->has_tab_match = input.has_tab_match.value_or(false);
    if (input.associated_keyword.get()) {
      result->associated_keyword =
          base::UTF16ToUTF8(input.associated_keyword->keyword);
    }
    result->keyword = base::UTF16ToUTF8(input.keyword);
    result->duplicates = static_cast<int32_t>(input.duplicate_matches.size());
    result->from_previous = input.from_previous;
    const auto* pedal = OmniboxPedal::FromAction(input.GetActionAt(0u));
    result->pedal_id =
        pedal == nullptr ? 0 : static_cast<int32_t>(pedal->PedalId());
    result->scoring_signals = mojo::ConvertTo<cake_new_tab::mojom::SignalsPtr>(
        input.scoring_signals.value_or(AutocompleteMatch::ScoringSignals{}));
    result->additional_info =
        mojo::ConvertTo<std::vector<cake_new_tab::mojom::DictionaryEntryPtr>>(
            input.additional_info);
    return result;
  }
};

template <>
struct TypeConverter<cake_new_tab::mojom::AutocompleteResultsForProviderPtr,
                     scoped_refptr<AutocompleteProvider>> {
  static cake_new_tab::mojom::AutocompleteResultsForProviderPtr Convert(
      const scoped_refptr<AutocompleteProvider>& input) {
    cake_new_tab::mojom::AutocompleteResultsForProviderPtr resultsForProvider(
        cake_new_tab::mojom::AutocompleteResultsForProvider::New());
    resultsForProvider->provider_name = input->GetName();
    resultsForProvider->results =
        mojo::ConvertTo<std::vector<cake_new_tab::mojom::AutocompleteMatchPtr>>(
            input->matches());
    return resultsForProvider;
  }
};

}  // namespace mojo

CakeNewTabPageHandler::CakeNewTabPageHandler(
    Profile* profile,
    mojo::PendingReceiver<cake_new_tab::mojom::CakeNewTabPageHandler> receiver)
    : profile_(profile), receiver_(this, std::move(receiver)) {
  observation_.Observe(
      AutocompleteControllerEmitterFactory::GetForBrowserContext(profile_));
  controller_ = CreateController(false);
  ml_disabled_controller_ = CreateController(true);
}

CakeNewTabPageHandler::~CakeNewTabPageHandler() = default;

void CakeNewTabPageHandler::OnStart(AutocompleteController* controller,
                                 const AutocompleteInput& input) {
  time_omnibox_started_ = base::Time::Now();
  input_ = input;
  auto type = GetAutocompleteControllerType(controller);
  page_->HandleNewAutocompleteQuery(type, base::UTF16ToUTF8(input.text()));
  // Kick off ml-disabled autocompletion to show a before/after comparison on
  // chrome://omnibox/ml.
  if (type == cake_new_tab::mojom::AutocompleteControllerType::kBrowser)
    ml_disabled_controller_->Start(input);
}

void CakeNewTabPageHandler::OnResultChanged(AutocompleteController* controller,
                                         bool default_match_changed) {
  cake_new_tab::mojom::OmniboxResponsePtr response(cake_new_tab::mojom::OmniboxResponse::New());
  response->cursor_position = input_.cursor_position();
  response->time_since_omnibox_started_ms =
      (base::Time::Now() - time_omnibox_started_).InMilliseconds();
  response->done = controller->done();
  response->type = AutocompleteInput::TypeToString(input_.type());
  const std::u16string host =
      input_.text().substr(input_.parts().host.begin, input_.parts().host.len);
  response->host = base::UTF16ToUTF8(host);
  bool is_typed_host;
  if (!LookupIsTypedHost(host, &is_typed_host))
    is_typed_host = false;
  response->is_typed_host = is_typed_host;
  response->input_text = base::UTF16ToUTF8(input_.text());

  {
    // Copy to an ACMatches to make conversion easier. Since this isn't
    // performance critical we don't worry about the cost here.
    ACMatches matches(controller->result().begin(), controller->result().end());
    response->combined_results =
        mojo::ConvertTo<std::vector<cake_new_tab::mojom::AutocompleteMatchPtr>>(matches);
  }
  std::vector<scoped_refptr<AutocompleteProvider>> providers = {};
  for (const auto& provider : controller->providers())
    if (controller->ShouldRunProvider(provider.get()))
      providers.push_back(provider);
  response->results_by_provider =
      mojo::ConvertTo<std::vector<cake_new_tab::mojom::AutocompleteResultsForProviderPtr>>(
          providers);

  // Fill AutocompleteMatch::starred.
  BookmarkModel* bookmark_model =
      BookmarkModelFactory::GetForBrowserContext(profile_);
  if (bookmark_model) {
    for (const auto& match : response->combined_results) {
      match->starred =
          bookmark_model->IsBookmarked(GURL(match->destination_url));
    }
    for (const auto& results_by_provider : response->results_by_provider) {
      for (const auto& match : results_by_provider->results) {
        match->starred =
            bookmark_model->IsBookmarked(GURL(match->destination_url));
      }
    }
  }

  // Obtain a vector of all image urls required.
  std::vector<std::string> image_urls;
  for (const auto& match : response->combined_results)
    image_urls.push_back(match->image);
  for (const auto& results_by_provider : response->results_by_provider) {
    for (const auto& match : results_by_provider->results)
      image_urls.push_back(match->image);
  }

  auto type = GetAutocompleteControllerType(controller);
  page_->HandleNewAutocompleteResponse(type, std::move(response));

  // Fill in image data
  BitmapFetcherService* bitmap_fetcher_service =
      BitmapFetcherServiceFactory::GetForBrowserContext(profile_);

  for (std::string image_url : image_urls) {
    if (image_url.empty()) {
      continue;
    }
    bitmap_fetcher_service->RequestImage(
        GURL(image_url),
        base::BindOnce(&CakeNewTabPageHandler::OnBitmapFetched,
                       weak_factory_.GetWeakPtr(), type, image_url));
  }
}

void CakeNewTabPageHandler::OnMlScored(AutocompleteController* controller,
                                    const AutocompleteResult& result) {
  ACMatches matches(result.begin(), result.end());
  auto combined_results =
      mojo::ConvertTo<std::vector<cake_new_tab::mojom::AutocompleteMatchPtr>>(matches);
  page_->HandleNewMlResponse(GetAutocompleteControllerType(controller),
                             base::UTF16ToUTF8(controller->input().text()),
                             std::move(combined_results));
}

void CakeNewTabPageHandler::OnBitmapFetched(cake_new_tab::mojom::AutocompleteControllerType type,
                                         const std::string& image_url,
                                         const SkBitmap& bitmap) {
  auto data = gfx::Image::CreateFrom1xBitmap(bitmap).As1xPNGBytes();
  std::string base_64 = base::Base64Encode(*data);
  const char kDataUrlPrefix[] = "data:image/png;base64,";
  std::string data_url = GURL(kDataUrlPrefix + base_64).spec();
  page_->HandleAnswerImageData(type, image_url, data_url);
}

bool CakeNewTabPageHandler::LookupIsTypedHost(const std::u16string& host,
                                           bool* is_typed_host) const {
  history::HistoryService* const history_service =
      HistoryServiceFactory::GetForProfile(profile_,
                                           ServiceAccessType::EXPLICIT_ACCESS);
  if (!history_service)
    return false;
  history::URLDatabase* url_db = history_service->InMemoryDatabase();
  if (!url_db)
    return false;
  *is_typed_host =
      url_db->IsTypedHost(base::UTF16ToUTF8(host), /*scheme=*/nullptr);
  return true;
}

void CakeNewTabPageHandler::SetClientPage(
    mojo::PendingRemote<cake_new_tab::mojom::CakeNewTabPage> page) {
  page_.Bind(std::move(page));
}

void CakeNewTabPageHandler::StartOmniboxQuery(const std::string& input_string) {
  AutocompleteInput input(
      base::UTF8ToUTF16(input_string), input_string.length(),
      static_cast<metrics::OmniboxEventProto::PageClassification>(1),
      ChromeAutocompleteSchemeClassifier(profile_));

  input.set_current_title(std::u16string());
  input.set_prevent_inline_autocomplete(false);
  input.set_prefer_keyword(false);
  input.set_focus_type(metrics::OmniboxFocusType::INTERACTION_DEFAULT);

  controller_->Start(input);
}

void CakeNewTabPageHandler::GetMlModelVersion(GetMlModelVersionCallback callback) {
#if BUILDFLAG(BUILD_WITH_TFLITE_LIB)
  if (auto* service = GetMlService()) {
    auto version = service->GetModelVersion();
    if (version == -1) {
      service->AddOnModelUpdatedCallback(
          base::BindOnce(&CakeNewTabPageHandler::GetMlModelVersion,
                         weak_factory_.GetWeakPtr(), std::move(callback)));
    } else {
      std::move(callback).Run(version);
    }
  } else {
    std::move(callback).Run(-1);
  }
#else
  std::move(callback).Run(-1);
#endif
}

void CakeNewTabPageHandler::StartMl(cake_new_tab::mojom::SignalsPtr mojom_signals,
                                 StartMlCallback callback) {
#if BUILDFLAG(BUILD_WITH_TFLITE_LIB)
  if (auto* service = GetMlService()) {
    AutocompleteMatch::ScoringSignals signals =
        mojo::ConvertTo<AutocompleteMatch::ScoringSignals>(mojom_signals);
    std::vector<AutocompleteScoringModelService::Result> result =
        service->BatchScoreAutocompleteUrlMatchesSync({&signals});
    std::move(callback).Run(result.size() ? result[0].value_or(-1) : -1);
  } else {
    std::move(callback).Run(-1);
  }
#else
  std::move(callback).Run(-1);
#endif
}

std::unique_ptr<AutocompleteController> CakeNewTabPageHandler::CreateController(
    bool ml_disabled) {
  auto providers = AutocompleteClassifier::DefaultOmniboxProviders();
  // `HistoryEmbeddingsProvider` only supports 1 query at a time. Running it for
  // the traditional-scoring controller used in the ML before/after comparisons
  // would break history embeddings for the other, more important controllers.
  if (ml_disabled)
    providers &= ~AutocompleteProvider::TYPE_HISTORY_EMBEDDINGS;

  auto controller = std::make_unique<AutocompleteController>(
      std::make_unique<ChromeAutocompleteProviderClient>(profile_), providers,
      false, ml_disabled);
  // We will observe our internal AutocompleteController directly, so there's
  // no reason to hook it up to the profile-keyed AutocompleteControllerEmitter.
  controller->AddObserver(this);
  return controller;
}

cake_new_tab::mojom::AutocompleteControllerType
CakeNewTabPageHandler::GetAutocompleteControllerType(
    AutocompleteController* controller) {
  if (controller == controller_.get())
    return cake_new_tab::mojom::AutocompleteControllerType::kDebug;
  if (controller == ml_disabled_controller_.get())
    return cake_new_tab::mojom::AutocompleteControllerType::kMlDisabledDebug;
  return cake_new_tab::mojom::AutocompleteControllerType::kBrowser;
}

AutocompleteScoringModelService* CakeNewTabPageHandler::GetMlService() {
#if BUILDFLAG(BUILD_WITH_TFLITE_LIB)
  return OmniboxFieldTrial::IsMlUrlScoringEnabled()
             ? AutocompleteScoringModelServiceFactory::GetInstance()
                   ->GetForProfile(profile_)
             : nullptr;
#else
  return nullptr;
#endif
}
