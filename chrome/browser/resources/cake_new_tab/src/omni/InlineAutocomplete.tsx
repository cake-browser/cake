import { useState, useImperativeHandle, forwardRef } from 'resources/cake_ui/ui.rollup.js';

const baseClass = 'omni-inline-autocomplete';

export type InlineAutocompleteProps = {
  inputText?: string;
  completionText?: string;
}

export type InlineAutocompleteHandle = {
  update: (props: InlineAutocompleteProps) => void;
  getData: () => InlineAutocompleteProps;
};

export const InlineAutocomplete = forwardRef<InlineAutocompleteHandle, InlineAutocompleteProps>((props, ref) => {
  const [data, setData] = useState<InlineAutocompleteProps>(props);

  useImperativeHandle(ref, () => ({
    update: (props: InlineAutocompleteProps) => setData(props),
    getData: () => data,
  }), [data]);

  return (
    <div className={baseClass}>
      <span>{(data.inputText || '').trimEnd()}</span>
      <span>{(data.completionText || '').trimStart()}</span>
    </div>
  );
});