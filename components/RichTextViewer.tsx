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

interface RichTextViewerProps {
  content: string;
}

export function RichTextViewer({ content }: RichTextViewerProps) {
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
        openOnClick: true,
        autolink: true,
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
