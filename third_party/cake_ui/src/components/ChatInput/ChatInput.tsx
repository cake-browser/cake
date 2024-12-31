import { React, useEffect, useRef } from '../../deps/react';
import {
  COMMAND_PRIORITY_NORMAL,
  KEY_DOWN_COMMAND,
  $getRoot,
  $getSelection,
  RangeSelection,
} from 'lexical';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { cn, getPCN } from '../../utils/cn';
import { key } from '../../utils/keyboard';

const baseClass = 'ck-chat-input';
const pcn = getPCN(baseClass);

// Maybe use later if more custom classes are needed on nested elements.
const theme = {};

const KeyPressPlugin = ({
  isMultiline,
  onKeyDown,
  onChange,
  onNewLineCount,
  onTab,
  onSubmit,
  onEmptyShiftEnter,
}: {
  isMultiline: boolean;
  onKeyDown?: (event: React.KeyboardEvent, value: string, cursorAtEndPosition: boolean) => void;
  onChange?: (event: React.KeyboardEvent, value: string, lineCount: number) => void;
  onNewLineCount?: (lineCount: number) => void;
  onTab?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onEmptyShiftEnter?: () => void;
}) => {
  const [editor] = useLexicalComposerContext();
  const lastKeyDownEvent = useRef<React.KeyboardEvent | null>(null);
  const lineHeight = useRef<number>(0);
  const prevLineCount = useRef<number>(1);

  useEffect(() => {
    // KEY DOWN.
    const keyDownUnregister = editor.registerCommand<React.KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event: React.KeyboardEvent) => {
        lastKeyDownEvent.current = event;

        // Empty shift-enter.
        if (event.key === key.ENTER && event.shiftKey && !isMultiline) {
          editor.getEditorState().read(() => {
            const root = $getRoot();
            const value = root.getTextContent();
            const selection = $getSelection() as RangeSelection;
            const cursorAtEndPosition = selection
              ? selection.anchor.offset === value.length
              : false;
            onKeyDown?.(event, value, cursorAtEndPosition);

            if (!value) {
              event.preventDefault();
              onEmptyShiftEnter?.();
            }
          });
          return true; // stop propagation
        }

        // Submit.
        if (event.key === key.ENTER && !event.shiftKey && !isMultiline && onSubmit) {
          event.preventDefault();
          editor.getEditorState().read(() => {
            const root = $getRoot();
            const value = root.getTextContent();
            const selection = $getSelection() as RangeSelection;
            const cursorAtEndPosition = selection
              ? selection.anchor.offset === value.length
              : false;
            onKeyDown?.(event, value, cursorAtEndPosition);
            onSubmit?.(value);
          });
          return true; // stop propagation
        }

        // Tab.
        if (event.key === key.TAB && onTab) {
          event.preventDefault();
          editor.getEditorState().read(() => {
            const root = $getRoot();
            const value = root.getTextContent();
            const selection = $getSelection() as RangeSelection;
            const cursorAtEndPosition = selection
              ? selection.anchor.offset === value.length
              : false;
            onKeyDown?.(event, value, cursorAtEndPosition);
            onTab?.(value);
          });
          return true;
        }

        // Bubble up event.
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const value = root.getTextContent();
          const selection = $getSelection() as RangeSelection;
          const cursorAtEndPosition = selection ? selection.anchor.offset === value.length : false;
          onKeyDown?.(event, value, cursorAtEndPosition);
        });
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );

    // VALUE CHANGE.
    const changeUnregister = onChange
      ? editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            const root = $getRoot();
            const value = root.getTextContent();
            const editorElement = editor.getRootElement();

            const currentHeight = editorElement?.offsetHeight || 1;
            lineHeight.current = lineHeight.current || currentHeight;
            const currentLineCount = Math.ceil(currentHeight / lineHeight.current);

            if (lastKeyDownEvent.current) {
              onChange(lastKeyDownEvent.current, value, currentLineCount);

              // NEW LINE COUNT.
              if (currentLineCount !== prevLineCount.current) {
                onNewLineCount?.(currentLineCount);
                prevLineCount.current = currentLineCount;
              }
            }
          });
        })
      : null;

    return () => {
      keyDownUnregister();
      changeUnregister?.();
    };
  }, [
    editor,
    isMultiline,
    onKeyDown,
    onChange,
    onNewLineCount,
    onTab,
    onSubmit,
    onEmptyShiftEnter,
  ]);

  return null;
};

export type ChatInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ChatInputProps = {
  id: string;
  size?: ChatInputSize;
  placeholder?: string;
  autoFocus?: boolean;
  isMultiline?: boolean;
  onKeyDown?: (event: React.KeyboardEvent, value: string, cursorAtEndPosition: boolean) => void;
  onChange?: (event: React.KeyboardEvent, value: string, lineCount: number) => void;
  onNewLineCount?: (lineCount: number) => void;
  onTab?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onEmptyShiftEnter?: () => void;
  onError?: (err: Error) => void;
};

export const ChatInput = ({
  id,
  size = 'sm',
  placeholder = '',
  autoFocus = false,
  isMultiline = false,
  onKeyDown,
  onChange,
  onNewLineCount,
  onTab,
  onSubmit,
  onEmptyShiftEnter,
  onError = (err: Error) => console.error(err),
}: ChatInputProps) => {
  const initialConfig = {
    namespace: id,
    theme,
    onError,
  };

  return (
    <div className={cn(baseClass, `--${size}`)}>
      <LexicalComposer initialConfig={initialConfig}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable className={pcn('__input')} spellCheck={false} autoComplete="off" />
          }
          placeholder={
            <div className={pcn('__ph')}>
              <p>
                <span>{placeholder}</span>
              </p>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        {autoFocus && <AutoFocusPlugin />}
        <KeyPressPlugin
          isMultiline={isMultiline}
          onKeyDown={onKeyDown}
          onChange={onChange}
          onNewLineCount={onNewLineCount}
          onTab={onTab}
          onSubmit={onSubmit}
          onEmptyShiftEnter={onEmptyShiftEnter}
        />
      </LexicalComposer>
    </div>
  );
};
