"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { updatePolicy } from "@/app/dashboard/policy/actions";

const TEXT_COLORS = [
  { label: "אדום", value: "#dc2626" },
  { label: "ירוק", value: "#059669" },
  { label: "כחול", value: "#2563eb" },
  { label: "סגול", value: "#7c3aed" },
  { label: "כתום", value: "#d97706" },
];

const HIGHLIGHT_COLORS = [
  { label: "צהוב", value: "#fef08a" },
  { label: "ירוק", value: "#bbf7d0" },
  { label: "כחול", value: "#bfdbfe" },
  { label: "ורוד", value: "#fbcfe8" },
];

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`min-w-[28px] px-2 py-1 rounded-md text-sm ${
        active ? "bg-stone-800 text-white" : "text-stone-700 hover:bg-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mb-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
      <ToolbarButton
        title="הדגשה"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">א</span>
      </ToolbarButton>
      <ToolbarButton
        title="הטיה"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">א</span>
      </ToolbarButton>
      <ToolbarButton
        title="קו תחתון"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">א</span>
      </ToolbarButton>

      <div className="w-px h-5 bg-stone-300 mx-1" />

      <ToolbarButton
        title="רשימת תבליטים"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        title="רשימה ממוספרת"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>

      <div className="w-px h-5 bg-stone-300 mx-1" />

      <span className="text-xs text-stone-400">צבע טקסט</span>
      <button
        type="button"
        title="ללא צבע"
        onClick={() => editor.chain().focus().unsetColor().run()}
        className="w-5 h-5 rounded-full border border-stone-300 bg-white text-[10px] leading-none text-stone-500"
      >
        ✕
      </button>
      {TEXT_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => editor.chain().focus().setColor(c.value).run()}
          className="w-5 h-5 rounded-full border border-stone-300"
          style={{ backgroundColor: c.value }}
        />
      ))}

      <div className="w-px h-5 bg-stone-300 mx-1" />

      <span className="text-xs text-stone-400">צבע רקע</span>
      <button
        type="button"
        title="ללא רקע"
        onClick={() => editor.chain().focus().unsetHighlight().run()}
        className="w-5 h-5 rounded-full border border-stone-300 bg-white text-[10px] leading-none text-stone-500"
      >
        ✕
      </button>
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => editor.chain().focus().toggleHighlight({ color: c.value }).run()}
          className="w-5 h-5 rounded-full border border-stone-300"
          style={{ backgroundColor: c.value }}
        />
      ))}
    </div>
  );
}

export default function PolicyEditor({
  initialContent,
  updatedAt,
  updatedBy,
}: {
  initialContent: string;
  updatedAt: string | null;
  updatedBy: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isEmptyView, setIsEmptyView] = useState(
    !initialContent || initialContent.replace(/<[^>]*>/g, "").trim() === ""
  );
  const [isPending, startTransition] = useTransition();

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none leading-relaxed [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_li]:mb-1 [&_p]:mb-2 [&_p:last-child]:mb-0",
      },
    },
  });

  function startEditing() {
    editor?.setEditable(true);
    setEditing(true);
  }

  function cancel() {
    editor?.commands.setContent(initialContent);
    editor?.setEditable(false);
    setEditing(false);
  }

  function save() {
    if (!editor) return;
    const html = editor.getHTML();
    startTransition(async () => {
      await updatePolicy(html);
      editor.setEditable(false);
      setIsEmptyView(editor.isEmpty);
      setEditing(false);
    });
  }

  return (
    <div>
      {editing && <Toolbar editor={editor} />}

      {!editing && isEmptyView ? (
        <p className="bg-stone-50 rounded-xl p-4 leading-relaxed min-h-32">
          אין עדיין תוכן מדיניות. לחצו על עריכה כדי להוסיף.
        </p>
      ) : (
        <div
          className={
            editing
              ? "rounded-xl border border-stone-300 p-4 min-h-32 focus-within:ring-2 focus-within:ring-stone-400"
              : "bg-stone-50 rounded-xl p-4 min-h-32"
          }
        >
          <EditorContent editor={editor} />
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div>
          {editing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={isPending}
                className="text-sm bg-stone-800 text-white rounded-lg px-3 py-1.5 hover:bg-stone-700"
              >
                שמירה
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={isPending}
                className="text-sm text-stone-500 hover:underline"
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="text-sm text-stone-500 hover:text-stone-800 underline"
            >
              ✏️ עריכה
            </button>
          )}
        </div>
        {updatedAt && (
          <p className="text-xs text-stone-400">
            עודכן לאחרונה {new Date(updatedAt).toLocaleString("he-IL")}
            {updatedBy && ` על ידי ${updatedBy}`}
          </p>
        )}
      </div>
    </div>
  );
}
