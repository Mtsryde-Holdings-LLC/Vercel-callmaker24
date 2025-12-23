"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export default function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start typing...",
  editable = true,
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {editable && (
        <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 bg-gray-50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("bold")
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("italic")
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("strike")
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <s>S</s>
          </button>
          <div className="w-px bg-gray-300" />
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("heading", { level: 1 })
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("heading", { level: 2 })
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("heading", { level: 3 })
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            H3
          </button>
          <div className="w-px bg-gray-300" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("bulletList")
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("orderedList")
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("blockquote")
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Quote
          </button>
          <div className="w-px bg-gray-300" />
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Enter URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive("link")
                ? "bg-primary-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Link
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
            className="px-3 py-1 text-sm rounded bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Unlink
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="prose max-w-none" />
    </div>
  );
}
