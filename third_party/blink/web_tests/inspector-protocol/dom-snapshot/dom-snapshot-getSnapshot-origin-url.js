// Expected DOM structure:
// Note: unrelated elements like script, \n text nodes are omitted.
// For originUrl:
// * denotes dom-snapshot-origin-url-3.js.
// ** denotes dom-snapshot-origin-url.html, aka document inlined javascript.
// *** denotes dom-snapshot-origin-url-1.js.
// **** denoates dom-snapshot-origin-url-2.js.
// <img***>
// <firstChild**>
// <testWrite <html**** <p<text>> <span*<p<text>>> <p*<text>>>>
// <testInnerText <'New content'*>>
// <testInnerHtml1 <'Hello'**>>
// <testInnerHtml2 <p* <span <'Inner World'>>>>
// <p* <span <'Outer World'>>> (used to be testOuterHtml)
(async function(/** @type {import('test_runner').TestRunner} */ testRunner) {
  const {page, session, dp} = await testRunner.startBlank('Tests that DOMSnapshot.getSnapshot records origin url of dom nodes generated by script.');
  await dp.DOMSnapshot.enable();
  await page.navigate('../resources/dom-snapshot-origin-url.html');

  function cleanupPaths(obj) {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === 'string' && value.indexOf('file://') !== -1)
        obj[key] = '<value>';
      else if (typeof value === 'object')
        cleanupPaths(value);
    }
    return obj;
  }

  const response = await dp.DOMSnapshot.getSnapshot({'computedStyleWhitelist': [], 'includeEventListeners': true});
  if (response.error)
    testRunner.log(response);
  else
    testRunner.log(cleanupPaths(response.result), null, ['documentURL', 'baseURL', 'frameId', 'backendNodeId', 'layoutTreeNodes']);
  testRunner.completeTest();
})
