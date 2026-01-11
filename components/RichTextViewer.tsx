"use client";

import { useEffect } from 'react';
import {
  RichTextEditorProvider,
  RichTextField,
} from 'mui-tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { useSplitScreen } from './SplitScreenProvider';

interface RichTextViewerProps {
  content: string;
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const { openInSplitScreen, splitScreenEnabled, isDesktop } = useSplitScreen();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
      }).extend({
        addProseMirrorPlugins() {
          return [
            ...(this.parent?.() || []),
          ];
        },
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
    ],
    content: content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a');

        if (link) {
          event.preventDefault();
          const href = link.getAttribute('href');

          if (href) {
            // If split screen is enabled, open in split screen (works on both mobile and desktop)
            if (splitScreenEnabled) {
              openInSplitScreen(href);
            } else {
              // Otherwise open in new tab
              window.open(href, '_blank', 'noopener,noreferrer');
            }
          }

          return true;
        }

        return false;
      },
    },
  });

  // Update editor content when content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <RichTextEditorProvider editor={editor}>
      <div className="w-full h-full overflow-y-auto">
        <RichTextField
          controls={null}
          className="[&_.MuiInputBase-root]:border-0 [&_.MuiInputBase-root]:shadow-none [&_.MuiInputBase-root]:min-h-full [&_.ProseMirror]:p-8 [&_.ProseMirror]:outline-none"
        />
      </div>
    </RichTextEditorProvider>
  );
}
