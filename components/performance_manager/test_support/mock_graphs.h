// Copyright 2017 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef COMPONENTS_PERFORMANCE_MANAGER_TEST_SUPPORT_MOCK_GRAPHS_H_
#define COMPONENTS_PERFORMANCE_MANAGER_TEST_SUPPORT_MOCK_GRAPHS_H_

#include <vector>

#include "base/process/process.h"
#include "base/process/process_handle.h"
#include "base/time/time.h"
#include "components/performance_manager/graph/process_node_impl.h"
#include "components/performance_manager/test_support/graph_test_harness.h"
#include "content/public/browser/browsing_instance_id.h"
#include "content/public/common/process_type.h"

namespace performance_manager {

class FrameNodeImpl;
class PageNodeImpl;
class SystemNodeImpl;

// The browsing instance for all frames on `page` in graphs defined below.
extern const content::BrowsingInstanceId kBrowsingInstanceForPage;

// The browsing instance for all frames on `other_page` in graphs defined below.
extern const content::BrowsingInstanceId kBrowsingInstanceForOtherPage;

// A for-testing subclass of the process node that allows mocking the
// process' PID.
class TestProcessNodeImpl : public ProcessNodeImpl {
 public:
  // Default to creating a renderer process node.
  TestProcessNodeImpl();

  // Create a non-renderer child process node with the given `process_type`.
  explicit TestProcessNodeImpl(content::ProcessType process_type);

  // Inherit the default constructors so that tests can create browser process
  // nodes or assign explicit RenderProcessHostProxy or
  // BrowserChildProcessHostProxy objects.
  using ProcessNodeImpl::ProcessNodeImpl;

  // Assigns the given `pid`, `process` and `launch_time` to the process node.
  void SetProcessWithPid(base::ProcessId pid,
                         base::Process process = base::Process::Current(),
                         base::TimeTicks launch_time = base::TimeTicks::Now());
};

// The following graph topology is created to emulate a scenario when a single
// page executes in a single process:
//
// Pr  Pg  BPr
//  \ /
//   F
//
// Where:
// F: frame(frame_tree_id:0)
// BPr: browser_process(pid:1)
// Pr: process(pid:2)
// Pg: page
struct MockSinglePageInSingleProcessGraph {
  explicit MockSinglePageInSingleProcessGraph(TestGraphImpl* graph);
  ~MockSinglePageInSingleProcessGraph();
  TestNodeWrapper<SystemNodeImpl> system;
  TestNodeWrapper<TestProcessNodeImpl> browser_process;
  TestNodeWrapper<TestProcessNodeImpl> process;
  TestNodeWrapper<PageNodeImpl> page;
  TestNodeWrapper<FrameNodeImpl> frame;
};

// The following graph topology is created to emulate a scenario where multiple
// pages are executing in a single process:
//
// Pg  Pr OPg  BPr
//  \ / \ /
//   F  OF
//
// Where:
// F: frame(frame_tree_id:0)
// OF: other_frame(frame_tree_id:1)
// Pg: page
// OPg: other_page
// BPr: browser_process(pid:1)
// Pr: process(pid:2)
struct MockMultiplePagesInSingleProcessGraph
    : public MockSinglePageInSingleProcessGraph {
  explicit MockMultiplePagesInSingleProcessGraph(TestGraphImpl* graph);
  ~MockMultiplePagesInSingleProcessGraph();
  TestNodeWrapper<PageNodeImpl> other_page;
  TestNodeWrapper<FrameNodeImpl> other_frame;
};

// The following graph topology is created to emulate a scenario where
// `num_other_pages` pages are executing in a single process:
//
// Pg  Pr OPg...  BPr
//  \ / \ /
//   F  OF...
//
// Where:
// F: frame(frame_tree_id:0)
// OFs...: other_frames(frame_tree_id:1..num_other_pages)
// Pg: page
// OPgs...: other_pages
// BPr: browser_process(pid:1)
// Pr: process(pid:2)
struct MockManyPagesInSingleProcessGraph
    : public MockSinglePageInSingleProcessGraph {
  explicit MockManyPagesInSingleProcessGraph(TestGraphImpl* graph,
                                             size_t num_other_pages);
  ~MockManyPagesInSingleProcessGraph();
  std::vector<TestNodeWrapper<PageNodeImpl>> other_pages;
  std::vector<TestNodeWrapper<FrameNodeImpl>> other_frames;
};

// The following graph topology is created to emulate a scenario where a single
// page that has frames is executing in different processes (e.g. out-of-process
// iFrames):
//
// Pg  Pr
// |\ /
// | F  OPr
// |  \ /
// |__CF  BPr
//
// Where:
// F: frame(frame_tree_id:0)
// CF: child_frame(frame_tree_id:2)
// Pg: page
// BPr: browser_proces(pid:1)
// Pr: process(pid:2)
// OPr: other_process(pid:3)
struct MockSinglePageWithMultipleProcessesGraph
    : public MockSinglePageInSingleProcessGraph {
  explicit MockSinglePageWithMultipleProcessesGraph(TestGraphImpl* graph);
  ~MockSinglePageWithMultipleProcessesGraph();
  TestNodeWrapper<TestProcessNodeImpl> other_process;
  TestNodeWrapper<FrameNodeImpl> child_frame;
};

// The following graph topology is created to emulate a scenario where multiple
// pages are utilizing multiple processes (e.g. out-of-process iFrames and
// multiple pages in a process):
//
// Pg  Pr OPg___
//  \ / \ /     |
//   F   OF OPr |
//        \ /   |
//   BPr   CF___|
//
// Where:
// F: frame(frame_tree_id:0)
// OF: other_frame(frame_tree_id:1)
// CF: child_frame(frame_tree_id:3)
// Pg: page
// OPg: other_page
// BPr: browser_process(pid:1)
// Pr: process(pid:2)
// OPr: other_process(pid:3)
struct MockMultiplePagesWithMultipleProcessesGraph
    : public MockMultiplePagesInSingleProcessGraph {
  explicit MockMultiplePagesWithMultipleProcessesGraph(TestGraphImpl* graph);
  ~MockMultiplePagesWithMultipleProcessesGraph();
  TestNodeWrapper<TestProcessNodeImpl> other_process;
  TestNodeWrapper<FrameNodeImpl> child_frame;
};

// The following graph topology is created to emulate a scenario where a page
// contains a single frame that creates a single dedicated worker.
//
// Pg  Pr_   BPr
//  \ /   |
//   F    |
//    \   |
//     W__|
//
// Where:
// Pg: page
// F: frame(frame_tree_id:0)
// W: worker
// BPr: browser_process(pid:1)
// Pr: process(pid:2)
struct MockSinglePageWithFrameAndWorkerInSingleProcessGraph
    : public MockSinglePageInSingleProcessGraph {
  explicit MockSinglePageWithFrameAndWorkerInSingleProcessGraph(
      TestGraphImpl* graph);
  ~MockSinglePageWithFrameAndWorkerInSingleProcessGraph();
  TestNodeWrapper<WorkerNodeImpl> worker;

  void DeleteWorker();
};

// The following graph topology is created to emulate a scenario where multiple
// pages making use of workers are hosted in multiple processes (e.g.
// out-of-process iFrames and multiple pages in a process):
//
//    Pg    OPg
//    |     |
//    F     OF
//   /\    /  \
//  W  \  /   CF
//   \ | /    | \
//     Pr     | OW
//            | /
//     BPr    OPr
//
// Where:
// Pg: page
// OPg: other_page
// F: frame(frame_tree_id:0)
// OF: other_frame(frame_tree_id:1)
// CF: child_frame(frame_tree_id:3)
// W: worker
// OW: other_worker
// BPr: browser_process(pid:1)
// Pr: process(pid:2)
// OPr: other_process(pid:3)
struct MockMultiplePagesAndWorkersWithMultipleProcessesGraph
    : public MockMultiplePagesWithMultipleProcessesGraph {
  explicit MockMultiplePagesAndWorkersWithMultipleProcessesGraph(
      TestGraphImpl* graph);
  ~MockMultiplePagesAndWorkersWithMultipleProcessesGraph();
  TestNodeWrapper<WorkerNodeImpl> worker;
  TestNodeWrapper<WorkerNodeImpl> other_worker;
};

// The following graph topology is created to emulate a scenario where a utility
// process is running, plus multiple pages making use of workers are hosted in
// multiple renderer processes (e.g. out-of-process iFrames and multiple pages
// in a process):
//
//    Pg    OPg
//    |     |
//    F     OF
//   /\    /  \
//  W  \  /   CF
//   \ | /    | \
//     Pr     | OW
//            | /
//     BPr    OPr    UPr
//
// Where:
// Pg: page
// OPg: other_page
// F: frame(frame_tree_id:0)
// OF: other_frame(frame_tree_id:1)
// CF: child_frame(frame_tree_id:3)
// W: worker
// OW: other_worker
// BPr: browser_process(pid:1)
// Pr: process(pid:2)
// OPr: other_process(pid:3)
// UPr: utility_process(pid:4)
struct MockUtilityAndMultipleRenderProcessesGraph
    : public MockMultiplePagesAndWorkersWithMultipleProcessesGraph {
  explicit MockUtilityAndMultipleRenderProcessesGraph(TestGraphImpl* graph);
  ~MockUtilityAndMultipleRenderProcessesGraph();
  TestNodeWrapper<TestProcessNodeImpl> utility_process;
};

}  // namespace performance_manager

#endif  // COMPONENTS_PERFORMANCE_MANAGER_TEST_SUPPORT_MOCK_GRAPHS_H_
