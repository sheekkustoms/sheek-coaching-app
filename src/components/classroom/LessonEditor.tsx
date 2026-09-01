import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from 'lucide-react';

interface LessonEditorProps {
  value: string;
  onChange: (html: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

const COLORS = [
  { label: 'White', value: '#f0eee9' },
  { label: 'Muted', value: '#9a8fa8' },
  { label: 'Pink', value: '#ff2d78' },
  { label: 'Gold', value: '#e8c84a' },
  { label: 'Sky', value: '#7dd3fc' },
  { label: 'Green', value: '#86efac' },
  { label: 'Red', value: '#fca5a5' },
];

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Sans', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, Times New Roman, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
];

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-hotpink/20 text-hotpink' : 'text-snow-dim hover:bg-white/8 hover:text-snow'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-pinkline" />;
}

export function LessonEditor({ value, onChange, onSave, readOnly = false }: LessonEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-lesson min-h-[160px] focus:outline-none px-4 py-3 leading-relaxed text-snow-muted',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [readOnly]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onSave && (e.metaKey || e.ctrlKey) && e.key === 'Enter') onSave();
    },
    [onSave],
  );

  if (!editor) return null;

  if (readOnly) {
    return (
      <div
        className="prose-lesson px-1 py-2 leading-relaxed text-snow-muted"
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
    );
  }

  const currentFont = editor.getAttributes('textStyle').fontFamily ?? '';

  return (
    <div
      className="overflow-hidden rounded-xl border border-hotpink/40 bg-ink-50 focus-within:shadow-glow transition-shadow"
      onKeyDown={handleKeyDown}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-pinkline bg-ink-100/80 px-2 py-1.5">
        <ToolBtn title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow size={13} />
        </ToolBtn>
        <ToolBtn title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={13} />
        </ToolBtn>
        <ToolBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={13} />
        </ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={13} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={13} />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={13} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={13} />
        </ToolBtn>
        <ToolBtn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={13} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn title="Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={13} />
        </ToolBtn>
        <ToolBtn title="Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={13} />
        </ToolBtn>

        <Sep />

        {/* Color swatches */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c.value).run(); }}
              style={{ background: c.value }}
              className="h-3.5 w-3.5 rounded-full border border-white/20 transition-transform hover:scale-125"
            />
          ))}
        </div>

        <Sep />

        {/* Font */}
        <select
          value={currentFont}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
          className="h-7 rounded-lg border border-pinkline bg-ink-200 px-1.5 text-xs text-snow focus:border-hotpink/50 focus:outline-none"
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.value} className="bg-ink-200">{f.label}</option>
          ))}
        </select>
      </div>

      <EditorContent editor={editor} />

      <div className="border-t border-pinkline px-3 py-1.5 text-xs text-snow-dim/40">
        Ctrl+Enter to save
      </div>
    </div>
  );
}
