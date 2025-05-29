"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import CodeBlock from "@tiptap/extension-code-block";
import Highlight from "@tiptap/extension-highlight";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Underline as UnderlineIcon,
  HighlighterIcon,
  FileCode,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Enter content here...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        html: true,
        preserveWhitespace: true,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      CodeBlock,
      Highlight,
    ],
    content: content.replace(/\\"/g, '"').replace(/\\'/g, "'"),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] max-w-none prose-headings:mb-3 prose-p:mb-3 prose-ul:my-3 prose-li:my-0 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
      },
      parseOptions: {
        preserveWhitespace: "full",
      },
    },
    parseOptions: {
      preserveWhitespace: "full",
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handlePasteHtml = () => {
    const html = prompt("Paste your formatted HTML content here:");
    if (html) {
      // Parse the HTML to ensure it's valid and clean
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const cleanHtml = doc.body.innerHTML;

      // Set the content and ensure it's not escaped
      editor.commands.setContent(cleanHtml, {
        preserveWhitespace: "full",
        parseOptions: {
          preserveWhitespace: "full",
        },
      });
      editor.commands.focus();
    }
  };

  return (
    <div className="border rounded-md">
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-muted" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-muted" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "bg-muted" : ""}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-muted" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={
              editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""
            }
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""
            }
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={
              editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""
            }
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={
              editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""
            }
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={editor.isActive("link") ? "bg-muted" : ""}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addImage}
            className={editor.isActive("image") ? "bg-muted" : ""}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "bg-muted" : ""}
          >
            <FileCode className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive("highlight") ? "bg-muted" : ""}
          >
            <HighlighterIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePasteHtml}
            className="ml-auto"
          >
            Paste HTML
          </Button>
        </div>
      )}
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}
