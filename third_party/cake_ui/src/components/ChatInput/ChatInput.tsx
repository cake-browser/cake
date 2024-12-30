import { React, useEffect, useRef } from '../../deps/react';
import { COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND, $getRoot } from 'lexical';
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
  onKeyDown,
  onChange,
  onNewLineCount,
  onTab,
  onSubmit,
}: {
  onKeyDown?: (event: React.KeyboardEvent, value: string) => void;
  onChange?: (event: React.KeyboardEvent, value: string, lineCount: number) => void;
  onNewLineCount?: (lineCount: number) => void;
  onTab?: (value: string) => void;
  onSubmit?: (value: string) => void;
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

        const bubbleUp = (submit: boolean, tab: boolean) => {
          editor.getEditorState().read(() => {
            const root = $getRoot();
            const value = root.getTextContent();
            onKeyDown?.(event, value);
            submit && onSubmit?.(value);
            tab && onTab?.(value);
          });
        };

        // SUBMIT.
        if (event.key === key.ENTER && !event.shiftKey && onSubmit) {
          event.preventDefault();
          bubbleUp(true, false);
          return true; // stop propagation
        }

        // TAB.
        if (event.key === key.TAB && onTab) {
          event.preventDefault();
          bubbleUp(false, true);
          return true;
        }

        bubbleUp(false, false);
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
  }, [editor, onKeyDown, onChange, onSubmit]);

  return null;
};

export type ChatInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ChatInputProps = {
  id: string;
  size?: ChatInputSize;
  placeholder?: string;
  autoFocus?: boolean;
  onKeyDown?: (event: React.KeyboardEvent, value: string) => void;
  onChange?: (event: React.KeyboardEvent, value: string, lineCount: number) => void;
  onNewLineCount?: (lineCount: number) => void;
  onTab?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onError?: (err: Error) => void;
};

export const ChatInput = ({
  id,
  size = 'sm',
  placeholder = '',
  autoFocus = false,
  onKeyDown,
  onChange,
  onNewLineCount,
  onTab,
  onSubmit,
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
          onKeyDown={onKeyDown}
          onChange={onChange}
          onNewLineCount={onNewLineCount}
          onTab={onTab}
          onSubmit={onSubmit}
        />
      </LexicalComposer>
    </div>
  );
};
