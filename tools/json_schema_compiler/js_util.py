# Copyright 2015 The Chromium Authors
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import re
from datetime import datetime

from code_util import Code
from model import PropertyType

LICENSE = """// Copyright %s The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
"""

INFO = """// This file was generated by:
//   %s.
"""


class JsUtil(object):
  """A helper class for generating JS Code.
  """

  def GetLicense(self):
    """Returns the license text for JS extern and interface files.
    """
    return (LICENSE % datetime.now().year)

  def GetInfo(self, tool):
    """Returns text describing how the file was generated.
    """
    return (INFO % tool.replace('\\', '/'))

  def GetPropertyName(self, e):
    # Enum properties are normified to be in ALL_CAPS_STYLE.
    # Assume enum '1ring-rulesThemAll'.
    # Transform to '1ring-rules_Them_All'.
    e = re.sub(r"([a-z])([A-Z])", r"\1_\2", e)
    # Transform to '1ring_rules_Them_All'.
    e = re.sub(r"\W", "_", e)
    # Transform to '_1ring_rules_Them_All'.
    e = re.sub(r"^(\d)", r"_\1", e)
    # Transform to '_1RING_RULES_THEM_ALL'.
    return e.upper()

  def AppendObjectDefinition(self,
                             c,
                             namespace_name,
                             properties,
                             new_line=True):
    """Given an OrderedDict of properties, returns a Code containing the
       description of an object.
    """
    if not properties:
      return

    c.Sblock('{', new_line=new_line)
    first = True
    for field, prop in properties.items():
      # Avoid trailing comma.
      # TODO(devlin): This will be unneeded, if/when
      # https://github.com/google/closure-compiler/issues/796 is fixed.
      if not first:
        c.Append(',', new_line=False)
      first = False
      js_type = self._TypeToJsType(namespace_name, prop.type_)
      if prop.optional:
        js_type = (Code().Append('(') \
                         .Concat(js_type, new_line=False) \
                         .Append('|undefined)', new_line=False))
      c.Append('%s: ' % field, strip_right=False)
      c.Concat(js_type, new_line=False)

    c.Eblock('}')

  def AppendFunctionJsDoc(self, c, namespace_name, function):
    """Appends the documentation for a function as a Code.

    Returns an empty code object if the object has no documentation.
    """
    c.Sblock(line='/**', line_prefix=' * ')

    if function.description:
      c.Comment(function.description, comment_prefix='')

    def append_field(c, tag, js_type, name, optional, description):
      c.Append('@%s {' % tag)
      c.Concat(js_type, new_line=False)
      if optional:
        c.Append('=', new_line=False)
      c.Append('}', new_line=False)
      c.Comment(' %s' % name, comment_prefix='', wrap_indent=4, new_line=False)
      if description:
        c.Comment(' %s' % description,
                  comment_prefix='',
                  wrap_indent=4,
                  new_line=False)

    for i, param in enumerate(function.params):
      # Mark the parameter as optional, *only if* all following parameters are
      # also optional, to avoid JSC_OPTIONAL_ARG_AT_END errors thrown by Closure
      # Compiler.
      optional = (all(p.optional for p in function.params[i:])
                  and (function.returns_async is None
                       or function.returns_async.optional))
      js_type = self._TypeToJsType(namespace_name, param.type_)

      # If the parameter was originally optional, but was followed by
      # non-optional parameters, allow it to be `null` or `undefined` instead.
      if not optional and param.optional:
        js_type_string = js_type.Render()

        # Remove the leading "!" from |js_type_string| if it exists, since "?!"
        # is not a valid type modifier.
        if js_type_string.startswith('!'):
          js_type_string = js_type_string[1:]
        js_type = Code().Append('?%s|undefined' % js_type_string)

      append_field(c, 'param', js_type, param.name, optional, param.description)

    if function.returns_async:
      append_field(
          c, 'param',
          self._ReturnsAsyncToJsFunction(namespace_name,
                                         function.returns_async),
          function.returns_async.name, function.returns_async.optional,
          function.returns_async.description)

    if function.returns:
      append_field(c, 'return',
                   self._TypeToJsType(namespace_name, function.returns), '',
                   False, function.returns.description)

    if function.deprecated:
      c.Append('@deprecated %s' % function.deprecated)

    self.AppendSeeLink(c, namespace_name, 'method', function.name)

    c.Eblock(' */')

  def AppendTypeJsDoc(self, c, namespace_name, js_type, optional):
    """Appends the documentation for a type as a Code.
    """
    c.Append('@type {')
    if optional:
      c.Append('(', new_line=False)
      c.Concat(self._TypeToJsType(namespace_name, js_type), new_line=False)
      c.Append('|undefined)', new_line=False)
    else:
      c.Concat(self._TypeToJsType(namespace_name, js_type), new_line=False)
    c.Append('}', new_line=False)

  def _FunctionToJsFunction(self, namespace_name, function):
    """Converts a model.Function to a JS type (i.e., function([params])...)"""
    c = Code()
    c.Append('function(')
    c.Concat(self._FunctionParamsToJsParams(namespace_name, function.params),
             new_line=False)
    c.Append('): ', new_line=False, strip_right=False)

    if function.returns:
      c.Concat(self._TypeToJsType(namespace_name, function.returns),
               new_line=False)
    else:
      c.Append('void', new_line=False)

    return c

  def _ReturnsAsyncToJsFunction(self, namespace_name, returns_async):
    """Converts a model.ReturnsAsync to a JS function equivalent"""
    # TODO(crbug.com/40728031) update this to generate promise-based
    # types and show that as a return from the API function itself, rather than
    # appended to the params as a callback.
    c = Code()
    c.Append('function(')
    c.Concat(self._FunctionParamsToJsParams(namespace_name,
                                            returns_async.params),
             new_line=False)
    c.Append('): ', new_line=False, strip_right=False)

    c.Append('void', new_line=False)
    return c

  def _FunctionParamsToJsParams(self, namespace_name, params):
    c = Code()
    for i, param in enumerate(params):
      t = self._TypeToJsType(namespace_name, param.type_)
      if param.optional:
        c.Append('(', new_line=False)
        c.Concat(t, new_line=False)
        c.Append('|undefined)', new_line=False)
      else:
        c.Concat(t, new_line=False)
      if i is not len(params) - 1:
        c.Append(', ', new_line=False, strip_right=False)
    return c

  def _TypeToJsType(self, namespace_name, js_type):
    """Converts a model.Type to a JS type (number, Array, etc.)"""
    if js_type.property_type in (PropertyType.INTEGER, PropertyType.DOUBLE):
      return Code().Append('number')
    if js_type.property_type is PropertyType.OBJECT:
      if js_type.properties:
        c = Code()
        self.AppendObjectDefinition(c, namespace_name, js_type.properties)
        return c

      # Support instanceof for types in the same namespace and built-in
      # types. This doesn't support types in another namespace e.g. if
      # js_type.instanceof is 'tabs.Tab'.
      if js_type.instance_of:
        if js_type.instance_of in js_type.namespace.types:
          return Code().Append('chrome.%s.%s' %
                               (namespace_name, js_type.instance_of))
        return Code().Append(js_type.instance_of)
      return Code().Append('Object')
    if js_type.property_type is PropertyType.ARRAY:
      return (Code().Append('!Array<').Concat(
          self._TypeToJsType(namespace_name, js_type.item_type),
          new_line=False).Append('>', new_line=False))
    if js_type.property_type is PropertyType.REF:
      ref_type = '!chrome.%s.%s' % (namespace_name, js_type.ref_type)
      return Code().Append(ref_type)
    if js_type.property_type is PropertyType.CHOICES:
      c = Code()
      c.Append('(')
      for i, choice in enumerate(js_type.choices):
        c.Concat(self._TypeToJsType(namespace_name, choice), new_line=False)
        if i is not len(js_type.choices) - 1:
          c.Append('|', new_line=False)
      c.Append(')', new_line=False)
      return c
    if js_type.property_type is PropertyType.FUNCTION:
      return self._FunctionToJsFunction(namespace_name, js_type.function)
    if js_type.property_type is PropertyType.BINARY:
      return Code().Append('ArrayBuffer')
    if js_type.property_type is PropertyType.ANY:
      return Code().Append('*')
    if js_type.property_type.is_fundamental:
      return Code().Append(js_type.property_type.name)
    return Code().Append('?')  # TODO(tbreisacher): Make this more specific.

  def AppendSeeLink(self, c, namespace_name, object_type, object_name):
    """Appends a @see link for a given API 'object' (type, method, or event).
    """

    # TODO(nigeltao): this should actually be gated on if there is
    # documentation, rather than if it's a private API. Most private APIs
    # aren't documented, but some are. For example:
    #  - https://developer.chrome.com/apps/developerPrivate exists
    #  - https://developer.chrome.com/apps/mediaPlayerPrivate does not
    if namespace_name.endswith('Private'):
      return

    # NOTE(devlin): This is kind of a hack. Some APIs will be hosted on
    # developer.chrome.com/apps/ instead of /extensions/, and some APIs have
    # '.'s in them (like app.window), which should resolve to 'app_window'.
    # Luckily, the doc server has excellent url resolution, and knows exactly
    # what we mean. This saves us from needing any complicated logic here.
    c.Append('@see https://developer.chrome.com/extensions/%s#%s-%s' %
             (namespace_name, object_type, object_name))
