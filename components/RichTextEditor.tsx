"use client";

import { useEffect } from 'react';
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonUnderline,
  MenuButtonStrikethrough,
  MenuButtonBulletedList,
  MenuButtonOrderedList,
  MenuButtonBlockquote,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditorProvider,
  RichTextField,
  MenuButtonUndo,
  MenuButtonRedo,
  MenuButtonHorizontalRule,
  MenuButtonSubscript,
  MenuButtonSuperscript,
  MenuButtonHighlightColor,
  MenuButtonTextColor,
  MenuSelectTextAlign,
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
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

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
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
      }),
      LinkBubbleMenuHandler,
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
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        placeholder: placeholder || '',
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <RichTextEditorProvider editor={editor}>
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all">
        <MenuControlsContainer className="flex-wrap">
          <MenuButtonUndo />
          <MenuButtonRedo />
          <MenuDivider />
          <MenuSelectHeading />
          <MenuDivider />
          <MenuButtonBold />
          <MenuButtonItalic />
          <MenuButtonUnderline />
          <MenuButtonStrikethrough />
          <MenuDivider />
          <MenuButtonTextColor />
          <MenuButtonHighlightColor />
          <MenuDivider />
          <MenuSelectTextAlign />
          <MenuDivider />
          <MenuButtonBulletedList />
          <MenuButtonOrderedList />
          <MenuDivider />
          <MenuButtonBlockquote />
          <MenuButtonCode />
          <MenuButtonCodeBlock />
          <MenuDivider />
          <MenuButtonHorizontalRule />
          <MenuDivider />
          <MenuButtonSubscript />
          <MenuButtonSuperscript />
        </MenuControlsContainer>
        <LinkBubbleMenu />
        <RichTextField
          controls={null}
          className="min-h-[300px]"
        />
      </div>
    </RichTextEditorProvider>
  );
}
