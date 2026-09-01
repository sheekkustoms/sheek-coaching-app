import { useState, useRef, useCallback } from 'react';
import { Loader2, Upload, FileArchive, Check, AlertCircle, FolderOpen, Film, Package, Link2, AlertTriangle, FileText, X } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';
import { uploadWithTus } from '@/lib/tusUpload';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { fetchVimeoThumbnail } from '@/lib/vimeo';

interface ZipImportModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

// ── Types ──────────────────────────────────────────────

interface ParsedAttachment {
  file: File;
  originalName: string;
}

type VideoSource = 'file' | 'vimeo' | 'missing' | 'none';

interface ParsedLesson {
  name: string;
  videoSource: VideoSource;
  videoFile?: File;
  videoFileName?: string;
  vimeoId?: string;
  sourcePath?: string;
  attachments: ParsedAttachment[];
  warnings: string[];
}

interface ParsedSection {
  name: string;
  lessons: ParsedLesson[];
}

type Phase = 'idle' | 'parsing' | 'review' | 'importing' | 'done' | 'error';

interface ProgressStep {
  label: string;
  done: boolean;
  error?: boolean;
  errorMsg?: string;
}

interface LessonSummary {
  name: string;
  sectionName: string;
  videoStatus: 'uploaded' | 'failed' | 'vimeo' | 'missing' | 'none';
  videoError?: string;
  downloadCount: number;
  hasEmbed: boolean;
}

// ── Constants ───────────────────────────────────────────

const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'm4v']);
const EMBED_EXTS = new Set(['html', 'htm', 'txt', 'json', 'csv']);
const SKIP_EXTS = new Set(['ds_store', 'thumbs', 'desktop', 'ini']);
const SKIP_NAMES = new Set(['.ds_store', 'thumbs.db', 'desktop.ini', '__macosx']);
const BUCKET_ID = 'lesson-files';
const BUCKET_FILE_SIZE_LIMIT = 5368709120; // 5 GB — from storage.buckets

// ── Utilities ───────────────────────────────────────────

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.substring(0, dot) : name;
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.substring(dot + 1).toLowerCase() : '';
}

function getMimeType(name: string): string {
  const ext = getExtension(name);
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    key: 'application/vnd.apple.keynote',
    psd: 'image/vnd.adobe.photoshop',
    ai: 'application/postscript',
    zip: 'application/zip',
    txt: 'text/plain',
    csv: 'text/csv',
    html: 'text/html',
    htm: 'text/html',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    m4v: 'video/mp4',
  };
  return map[ext] || 'application/octet-stream';
}

function isSkipped(path: string): boolean {
  const lower = path.toLowerCase();
  if (SKIP_NAMES.has(lower)) return true;
  const parts = lower.split('/');
  for (const part of parts) {
    if (part.startsWith('.') || SKIP_NAMES.has(part)) return true;
  }
  const ext = getExtension(lower);
  if (SKIP_EXTS.has(ext)) return true;
  return false;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, '');
}

function nameSuggestsVideo(path: string): boolean {
  const lower = path.toLowerCase();
  return /video|lesson|watch|play/.test(lower);
}

function extractVimeoId(text: string): string | null {
  const embedMatch = text.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (embedMatch) return embedMatch[1];
  const urlMatch = text.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (urlMatch) return urlMatch[1];
  return null;
}

function extractVimeoFromJson(text: string): { name?: string; vimeoId: string }[] {
  try {
    const data = JSON.parse(text);
    const items = Array.isArray(data) ? data : [data];
    const results: { name?: string; vimeoId: string }[] = [];
    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      const name = String(obj.name || obj.title || obj.lesson || obj.label || '');
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
          const id = extractVimeoId(value);
          if (id) {
            results.push({ name: name || undefined, vimeoId: id });
            break;
          }
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

function extractVimeoFromCsv(text: string): { name?: string; vimeoId: string }[] {
  const results: { name?: string; vimeoId: string }[] = [];
  const lines = text.split('\n').filter((l) => l.trim());
  for (const line of lines) {
    const id = extractVimeoId(line);
    if (id) {
      const firstCol = line.split(',')[0]?.trim().replace(/^["']|["']$/g, '');
      results.push({ name: firstCol || undefined, vimeoId: id });
    }
  }
  return results;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Log the full extracted file tree to console in a readable indented format. */
function logFileTree(title: string, allPaths: string[]) {
  console.group(`[zip-import] Extracted file tree from "${title}" (${allPaths.length} files)`);
  const sorted = [...allPaths].sort();
  let lastDir = '';
  for (const path of sorted) {
    const parts = path.split('/');
    const fileName = parts.pop()!;
    const dir = parts.join('/');
    if (dir !== lastDir) {
      console.log(`  ${dir || '(root)'}/`);
      lastDir = dir;
    }
    console.log(`    ${fileName}`);
  }
  console.groupEnd();
}

// ── Component ──────────────────────────────────────────

export function ZipImportModal({ open, onClose, onCreated }: ZipImportModalProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [zipName, setZipName] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [summaries, setSummaries] = useState<LessonSummary[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setError(null);
    setZipName('');
    setCourseTitle('');
    setSections([]);
    setProgress([]);
    setSummaries([]);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ── Parse ──────────────────────────────────────────

  const parseZip = useCallback(async (file: File) => {
    setPhase('parsing');
    setError(null);
    setZipName(file.name);

    try {
      const zip = await JSZip.loadAsync(file);
      const allPaths = Object.keys(zip.files).filter((p) => {
        if (zip.files[p].dir) return false;
        if (isSkipped(p)) return false;
        return true;
      });

      const title = stripExtension(file.name);

      // Log the full file tree before doing anything else
      logFileTree(file.name, allPaths);

      if (allPaths.length === 0) {
        setError('The zip file appears to be empty or contains only unsupported system files.');
        setPhase('error');
        return;
      }

      // Group files by top-level folder (= section)
      const sectionMap = new Map<string, string[]>();
      for (const path of allPaths) {
        const parts = path.split('/');
        const sectionName = parts.length >= 2 ? parts[0] : title;
        if (!sectionMap.has(sectionName)) sectionMap.set(sectionName, []);
        sectionMap.get(sectionName)!.push(path);
      }

      const parsedSections: ParsedSection[] = [];

      for (const [sectionName, paths] of sectionMap) {
        // Group files by second-level folder (= lesson) within this section
        const lessonMap = new Map<string, string[]>();
        const sectionRootFiles: string[] = [];

        for (const path of paths) {
          const parts = path.split('/');
          if (parts.length >= 3) {
            // File is inside a subfolder → belongs to a lesson
            const lessonName = parts[1];
            if (!lessonMap.has(lessonName)) lessonMap.set(lessonName, []);
            lessonMap.get(lessonName)!.push(path);
          } else {
            // File is directly in the section folder (no subfolder)
            sectionRootFiles.push(path);
          }
        }

        const lessons: ParsedLesson[] = [];

        // Process subfolder-based lessons
        for (const [lessonName, lessonPaths] of lessonMap) {
          const lesson = await parseLessonFolder(lessonName, lessonPaths, zip);
          lessons.push(lesson);
        }

        // Process section-root files (no subfolder)
        if (sectionRootFiles.length > 0) {
          const rootLessons = await parseRootFiles(sectionRootFiles, zip);
          lessons.push(...rootLessons);
        }

        if (lessons.length > 0) {
          parsedSections.push({ name: sectionName, lessons });
        }
      }

      if (parsedSections.length === 0) {
        setError('No lessons could be created from this zip. Make sure it contains video files, Vimeo embed files, or downloadable resources.');
        setPhase('error');
        return;
      }

      console.log(`[zip-import] Parsed ${parsedSections.length} sections, ${parsedSections.reduce((a, s) => a + s.lessons.length, 0)} lessons total`);

      setCourseTitle(title);
      setSections(parsedSections);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read zip file.');
      setPhase('error');
    }
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      parseZip(file);
      e.target.value = '';
    },
    [parseZip],
  );

  // ── Import ─────────────────────────────────────────

  const doImport = useCallback(async () => {
    setPhase('importing');
    setError(null);
    setSummaries([]);

    const steps: ProgressStep[] = [];
    const addStep = (label: string): number => {
      const idx = steps.length;
      steps.push({ label, done: false });
      setProgress([...steps]);
      return idx;
    };
    const markDone = (idx: number) => {
      steps[idx] = { ...steps[idx], done: true };
      setProgress([...steps]);
    };
    const markError = (idx: number, msg: string) => {
      steps[idx] = { ...steps[idx], done: true, error: true, errorMsg: msg };
      setProgress([...steps]);
    };

    const summaryList: LessonSummary[] = [];

    try {
      const courseIdx = addStep('Creating course…');
      const { data: course, error: courseErr } = await supabase
        .from('courses')
        .insert({ title: courseTitle.trim() })
        .select()
        .maybeSingle();
      if (courseErr || !course) throw new Error(courseErr?.message || 'Failed to create course.');
      markDone(courseIdx);

      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        const secIdx = addStep(`Section: ${sec.name}`);
        const { data: secRow, error: secErr } = await supabase
          .from('sections')
          .insert({ title: sec.name, course_id: course.id, position: si })
          .select()
          .maybeSingle();
        if (secErr || !secRow) throw new Error(secErr?.message || 'Failed to create section.');
        markDone(secIdx);

        for (let li = 0; li < sec.lessons.length; li++) {
          const les = sec.lessons[li];

          const sourceLabel =
            les.videoSource === 'file' ? 'uploaded file' :
            les.videoSource === 'vimeo' ? 'vimeo embed' :
            les.videoSource === 'missing' ? 'no video source' : 'downloads only';
          const lesIdx = addStep(`Lesson: ${les.name} (${sourceLabel})`);
          console.log(
            `[zip-import] Creating lesson "${les.name}": videoSource=${les.videoSource}, ` +
            `attachments=${les.attachments.length}, path=${les.sourcePath ?? 'none'}, vimeoId=${les.vimeoId ?? 'none'}`,
          );
          if (les.warnings.length > 0) {
            les.warnings.forEach((w) => console.warn(`[zip-import] Warning: ${w}`));
          }

          let videoUrl: string | null = null;
          let videoStatus: LessonSummary['videoStatus'] = 'none';
          let videoError: string | undefined;

          // ── Video upload (isolated — failure doesn't kill import) ──
          if (les.videoSource === 'file' && les.videoFile) {
            const fileSize = les.videoFile.size;
            console.log(`[zip-import] Video "${les.videoFileName}": ${formatBytes(fileSize)} (limit: ${formatBytes(BUCKET_FILE_SIZE_LIMIT)})`);

            if (fileSize > BUCKET_FILE_SIZE_LIMIT) {
              const msg = `file too large (${formatBytes(fileSize)} > ${formatBytes(BUCKET_FILE_SIZE_LIMIT)} limit)`;
              console.error(`[zip-import] Video upload skipped for "${les.videoFileName}": ${msg}`);
              videoStatus = 'failed';
              videoError = msg;
              markError(lesIdx, `Video: ${msg}`);
            } else {
              const uploadIdx = addStep(`Uploading video: ${les.videoFileName} (${formatBytes(fileSize)})`);
              const safeName = les.videoFileName!.replace(/\s+/g, '_');
              const storagePath = `${course.id}/${Date.now()}-${safeName}`;
              try {
                const { publicUrl } = await uploadWithTus({
                  bucketId: BUCKET_ID,
                  path: storagePath,
                  file: les.videoFile,
                  contentType: les.videoFile.type || 'video/mp4',
                  compress: false,
                  onProgress: (pct) => {
                    steps[uploadIdx] = { ...steps[uploadIdx], label: `Uploading video: ${les.videoFileName} (${pct}%)` };
                    setProgress([...steps]);
                  },
                  onStatus: (msg) => {
                    steps[uploadIdx] = { ...steps[uploadIdx], label: `Video: ${msg}` };
                    setProgress([...steps]);
                  },
                });
                videoUrl = publicUrl;
                videoStatus = 'uploaded';
                console.log(`[zip-import] Video uploaded: ${les.videoFileName} → ${publicUrl}`);
                markDone(uploadIdx);
              } catch (upErr) {
                const msg = upErr instanceof Error ? upErr.message : 'unknown error';
                console.error(`[zip-import] Video upload failed for "${les.videoFileName}": ${msg}`);
                videoStatus = 'failed';
                videoError = msg;
                markError(uploadIdx, `Upload failed: ${msg}`);
              }
            }
          } else if (les.videoSource === 'vimeo' && les.vimeoId) {
            videoUrl = `https://player.vimeo.com/video/${les.vimeoId}`;
            videoStatus = 'vimeo';
          } else if (les.videoSource === 'missing') {
            videoStatus = 'missing';
          }

          // ── Create lesson row ──
          const { data: lesRow, error: lesErr } = await supabase
            .from('lessons')
            .insert({
              title: les.name,
              section_id: secRow.id,
              position: li,
              published: true,
              video_url: videoUrl,
            })
            .select()
            .maybeSingle();

          if (lesErr || !lesRow) {
            console.error(`[zip-import] Failed to create lesson "${les.name}": ${lesErr?.message}`);
            markError(lesIdx, lesErr?.message || 'Failed to create lesson');
            summaryList.push({
              name: les.name,
              sectionName: sec.name,
              videoStatus,
              videoError,
              downloadCount: 0,
              hasEmbed: false,
            });
            continue;
          }
          console.log(`[zip-import] Lesson created: "${les.name}" (id: ${lesRow.id})`);

          // ── Fetch Vimeo thumbnail if applicable ──
          if (les.videoSource === 'vimeo' && les.vimeoId) {
            fetchVimeoThumbnail(`https://player.vimeo.com/video/${les.vimeoId}`).then((o) => {
              if (o?.thumbnail_url) {
                supabase.from('lessons').update({ image_url: o.thumbnail_url }).eq('id', lesRow.id).then();
              }
            });
          }

          // ── Upload attachments ──
          const fileLinks: string[] = [];
          let pdfUrl: string | null = null;
          let imageUrl: string | null = null;
          let attachmentErrors = 0;

          for (const att of les.attachments) {
            const fileIdx = addStep(`Uploading: ${att.originalName}`);
            const storagePath = `${lesRow.id}/${Date.now()}-${att.originalName.replace(/\s+/g, '_')}`;

            try {
              const { error: upErr } = await supabase.storage
                .from(BUCKET_ID)
                .upload(storagePath, att.file, {
                  contentType: att.file.type || 'application/octet-stream',
                  upsert: false,
                });
              if (upErr) throw new Error(upErr.message);

              const { data: pub } = supabase.storage.from(BUCKET_ID).getPublicUrl(storagePath);
              const url = pub.publicUrl;

              const ext = getExtension(att.originalName);
              if (ext === 'pdf' && !pdfUrl) pdfUrl = url;
              if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) && !imageUrl) imageUrl = url;

              fileLinks.push(
                `<li><a href="${url}" target="_blank" rel="noreferrer">${att.originalName}</a></li>`,
              );
              console.log(`[zip-import] Attachment uploaded: ${att.originalName} → ${url}`);
              markDone(fileIdx);
            } catch (attErr) {
              const msg = attErr instanceof Error ? attErr.message : 'unknown error';
              console.error(`[zip-import] Attachment upload failed: ${att.originalName}: ${msg}`);
              attachmentErrors++;
              markError(fileIdx, `Upload failed: ${msg}`);
            }
          }

          // ── Update lesson with body + media URLs ──
          if (fileLinks.length > 0 || pdfUrl || imageUrl) {
            const bodyHtml = fileLinks.length > 0
              ? `<p><strong>Files included in this lesson:</strong></p><ul>${fileLinks.join('')}</ul>`
              : null;
            await supabase
              .from('lessons')
              .update({ body: bodyHtml, pdf_url: pdfUrl, image_url: imageUrl })
              .eq('id', lesRow.id);
          }

          if (les.videoSource === 'file' && videoStatus === 'failed') {
            markError(lesIdx, videoError || 'Video upload failed');
          } else {
            markDone(lesIdx);
          }

          summaryList.push({
            name: les.name,
            sectionName: sec.name,
            videoStatus,
            videoError,
            downloadCount: les.attachments.length - attachmentErrors,
            hasEmbed: les.videoSource === 'vimeo',
          });
        }
      }

      addStep(`Done — ${summaryList.length} lessons processed`);
      markDone(steps.length - 1);
      setSummaries(summaryList);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
      setPhase('error');
    }
  }, [courseTitle, sections]);

  // ── Derived stats ────────────────────────────────────

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalFileVideos = sections.reduce((a, s) => a + s.lessons.filter((l) => l.videoSource === 'file').length, 0);
  const totalVimeoVideos = sections.reduce((a, s) => a + s.lessons.filter((l) => l.videoSource === 'vimeo').length, 0);
  const totalMissingVideos = sections.reduce((a, s) => a + s.lessons.filter((l) => l.videoSource === 'missing').length, 0);
  const totalDownloadFiles = sections.reduce(
    (a, s) => a + s.lessons.reduce((b, l) => b + l.attachments.length, 0),
    0,
  );

  // ── Render ───────────────────────────────────────────

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import Course from Zip"
      footer={
        phase === 'review' ? (
          <>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={doImport} disabled={!courseTitle.trim()}>
              <Upload size={16} /> Import Course
            </Button>
          </>
        ) : phase === 'done' ? (
          <Button onClick={() => { onCreated(); close(); }}>
            <Check size={16} /> Done
          </Button>
        ) : phase === 'error' ? (
          <>
            <Button variant="ghost" onClick={close}>Close</Button>
            <Button onClick={reset}>Try Again</Button>
          </>
        ) : (
          <Button variant="ghost" onClick={close} disabled={phase === 'parsing' || phase === 'importing'}>
            {phase === 'parsing' || phase === 'importing' ? 'Working…' : 'Close'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">

        {/* idle */}
        {phase === 'idle' && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-pinkline bg-ink-50/50 px-6 py-12 text-center transition-all duration-200 hover:border-hotpink/40 hover:bg-ink-50"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-pinkline bg-ink-100">
                <FileArchive className="text-gold" size={26} />
              </span>
              <span className="font-display text-lg text-snow">Select your course zip</span>
              <span className="text-sm text-snow-dim">Click to browse your computer</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={onFileChange} />

            <div className="rounded-xl border border-pinkline bg-ink-100/40 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
                <FolderOpen size={13} /> How it works
              </p>
              <div className="flex flex-col gap-2 text-xs text-snow-dim leading-relaxed">
                <div className="flex items-start gap-2">
                  <Film size={13} className="mt-0.5 shrink-0 text-gold-soft" />
                  <span><strong className="text-snow-muted">Video files</strong> (MP4, MOV, WebM, M4V) — each becomes its own lesson, uploaded and played directly in-app.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Link2 size={13} className="mt-0.5 shrink-0 text-sky-400" />
                  <span><strong className="text-snow-muted">Vimeo embeds</strong> — .html/.txt files with a Vimeo link, or .json/.csv manifests with Vimeo URLs, are detected automatically and embedded.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Package size={13} className="mt-0.5 shrink-0 text-hotpink-soft" />
                  <span><strong className="text-snow-muted">Downloads</strong> (PDFs, Excel, PNG, PSD, zips…) — attached to their parent lesson folder automatically.</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-snow-dim/60">
                Top-level folders become sections. Subfolders within a section become lessons — all files inside a lesson folder (video, PDFs, images) are grouped together. If a section has files without subfolders, each video becomes its own lesson.
              </p>
            </div>
          </div>
        )}

        {/* parsing */}
        {phase === 'parsing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="animate-spin text-gold" size={28} />
            <p className="text-sm text-snow-dim">Reading {zipName}…</p>
          </div>
        )}

        {/* review */}
        {phase === 'review' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-snow-dim">Course Title</label>
              <input
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-pinkline bg-ink-50 px-4 py-3 text-snow focus:border-hotpink/50 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {totalFileVideos > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5">
                  <Film size={15} className="text-gold-soft" />
                  <div>
                    <p className="text-xs font-semibold text-snow">{totalFileVideos}</p>
                    <p className="text-[10px] text-snow-dim">uploaded file{totalFileVideos !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              {totalVimeoVideos > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2.5">
                  <Link2 size={15} className="text-sky-400" />
                  <div>
                    <p className="text-xs font-semibold text-snow">{totalVimeoVideos}</p>
                    <p className="text-[10px] text-snow-dim">vimeo embed{totalVimeoVideos !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              {totalMissingVideos > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-3 py-2.5">
                  <AlertTriangle size={15} className="text-error-soft" />
                  <div>
                    <p className="text-xs font-semibold text-snow">{totalMissingVideos}</p>
                    <p className="text-[10px] text-snow-dim">no video source</p>
                  </div>
                </div>
              )}
              {totalDownloadFiles > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-pinkline bg-ink-100/40 px-3 py-2.5">
                  <Package size={15} className="text-hotpink-soft" />
                  <div>
                    <p className="text-xs font-semibold text-snow">{totalDownloadFiles}</p>
                    <p className="text-[10px] text-snow-dim">download file{totalDownloadFiles !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-pinkline bg-ink-100/40 p-4 max-h-64 overflow-y-auto scrollbar-thin">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-snow-dim">
                {sections.length} section{sections.length !== 1 ? 's' : ''} · {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-col gap-4">
                {sections.map((sec, si) => (
                  <div key={si}>
                    <p className="font-display text-sm text-hotpink">{sec.name}</p>
                    <div className="ml-3 mt-1 flex flex-col gap-1.5">
                      {sec.lessons.map((les, li) => (
                        <div key={li} className="flex items-center gap-2 text-xs text-snow-muted">
                          <VideoSourceBadge lesson={les} />
                          <span className="truncate">{les.name}</span>
                          {les.attachments.length > 0 && (
                            <span className="shrink-0 rounded bg-hotpink/15 px-1.5 py-0.5 text-[10px] text-hotpink-soft">
                              {les.attachments.length} file{les.attachments.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {les.warnings.length > 0 && (
                            <span className="shrink-0 text-[10px] text-gold-soft/70" title={les.warnings.join('; ')}>
                              <AlertCircle size={10} className="inline" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {totalMissingVideos > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/5 px-3 py-2.5 text-xs text-error-soft">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                {totalMissingVideos} lesson{totalMissingVideos !== 1 ? 's' : ''} flagged as "no video source" — check that the Vimeo URL is correct or add a video file.
              </div>
            )}
          </div>
        )}

        {/* importing */}
        {phase === 'importing' && (
          <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto scrollbar-thin py-2">
            {progress.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {step.error ? (
                  <X size={14} className="shrink-0 text-error-soft" />
                ) : step.done ? (
                  <Check size={14} className="shrink-0 text-gold" />
                ) : (
                  <Loader2 size={14} className="shrink-0 animate-spin text-snow-dim" />
                )}
                <span className={step.error ? 'text-error-soft' : step.done ? 'text-snow-dim' : 'text-snow'}>
                  {step.label}
                </span>
                {step.error && step.errorMsg && (
                  <span className="text-[10px] text-error-soft/70 truncate">— {step.errorMsg}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* done */}
        {phase === 'done' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                <Check className="text-gold" size={28} />
              </span>
              <p className="font-display text-xl text-snow">Course imported!</p>
              <p className="text-sm text-snow-dim">
                {summaries.length} lesson{summaries.length !== 1 ? 's' : ''} across {sections.length} section{sections.length !== 1 ? 's' : ''} processed.
              </p>
            </div>

            {/* Per-lesson summary */}
            <div className="rounded-xl border border-pinkline bg-ink-100/40 p-4 max-h-72 overflow-y-auto scrollbar-thin">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-snow-dim">Import Summary</p>
              <div className="flex flex-col gap-3">
                {summaries.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <SummaryBadge status={s.videoStatus} />
                    <div className="flex-1 min-w-0">
                      <p className="text-snow truncate">{s.name}</p>
                      <p className="text-[10px] text-snow-dim/60">
                        {s.sectionName}
                        {s.videoStatus === 'uploaded' && ' · video uploaded'}
                        {s.videoStatus === 'failed' && ` · video FAILED: ${s.videoError}`}
                        {s.videoStatus === 'vimeo' && ' · vimeo embed'}
                        {s.videoStatus === 'missing' && ' · no video source'}
                        {s.videoStatus === 'none' && ' · downloads only'}
                        {s.downloadCount > 0 && ` · ${s.downloadCount} download file${s.downloadCount !== 1 ? 's' : ''}`}
                        {s.hasEmbed && ' · embed detected'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {summaries.some((s) => s.videoStatus === 'failed') && (
              <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/5 px-3 py-2.5 text-xs text-error-soft">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                {summaries.filter((s) => s.videoStatus === 'failed').length} video upload(s) failed — see the summary above and the browser console for details. Lesson rows were still created so you can re-upload videos manually.
              </div>
            )}
          </div>
        )}

        {/* error */}
        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-error/30 bg-error/10">
              <AlertCircle className="text-error-soft" size={28} />
            </span>
            <p className="font-display text-lg text-snow">Import failed</p>
            <p className="max-w-sm text-sm text-snow-dim">{error}</p>
          </div>
        )}

      </div>
    </Modal>
  );
}

// ── Sub-components ──────────────────────────────────────

function VideoSourceBadge({ lesson }: { lesson: ParsedLesson }) {
  if (lesson.videoSource === 'file') {
    return <Film size={11} className="shrink-0 text-gold-soft" title="Uploaded video file" />;
  }
  if (lesson.videoSource === 'vimeo') {
    return <Link2 size={11} className="shrink-0 text-sky-400" title="Vimeo embed" />;
  }
  if (lesson.videoSource === 'missing') {
    return <AlertTriangle size={11} className="shrink-0 text-error-soft" title="No video source detected" />;
  }
  return <Package size={11} className="shrink-0 text-hotpink-soft" title="Downloads only" />;
}

function SummaryBadge({ status }: { status: LessonSummary['videoStatus'] }) {
  if (status === 'uploaded') {
    return <Check size={14} className="shrink-0 text-gold" />;
  }
  if (status === 'failed') {
    return <X size={14} className="shrink-0 text-error-soft" />;
  }
  if (status === 'vimeo') {
    return <Link2 size={14} className="shrink-0 text-sky-400" />;
  }
  if (status === 'missing') {
    return <AlertTriangle size={14} className="shrink-0 text-error-soft" />;
  }
  return <FileText size={14} className="shrink-0 text-snow-dim" />;
}

// ── Parsing helpers ─────────────────────────────────────

/** Parse all files inside a lesson subfolder into a single ParsedLesson. */
async function parseLessonFolder(
  lessonName: string,
  paths: string[],
  zip: JSZip,
): Promise<ParsedLesson> {
  const videoFiles: { path: string; fileName: string; file: File }[] = [];
  const embedFiles: { path: string; fileName: string; ext: string }[] = [];
  const downloadFiles: { path: string; fileName: string }[] = [];

  for (const path of paths) {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    if (!fileName || isSkipped(fileName)) continue;
    const ext = getExtension(fileName);

    if (VIDEO_EXTS.has(ext)) {
      const blob = await zip.files[path].async('blob');
      const mime = getMimeType(fileName);
      videoFiles.push({ path, fileName, file: new File([blob], fileName, { type: mime }) });
    } else if (EMBED_EXTS.has(ext)) {
      embedFiles.push({ path, fileName, ext });
    } else {
      downloadFiles.push({ path, fileName });
    }
  }

  console.log(
    `[zip-import] Lesson folder "${lessonName}": ${videoFiles.length} video(s), ` +
    `${embedFiles.length} embed file(s), ${downloadFiles.length} download(s)`,
  );

  const lesson: ParsedLesson = {
    name: lessonName,
    videoSource: 'none',
    attachments: [],
    warnings: [],
  };

  // ── Determine video source ──
  if (videoFiles.length > 0) {
    // Use the first video file (most lessons have one)
    const vf = videoFiles[0];
    if (videoFiles.length > 1) {
      lesson.warnings.push(`${videoFiles.length} video files found — using "${vf.fileName}"`);
      console.warn(`[zip-import] Lesson "${lessonName}": multiple video files found, using "${vf.fileName}"`);
    }
    lesson.videoSource = 'file';
    lesson.videoFile = vf.file;
    lesson.videoFileName = vf.fileName;
    lesson.sourcePath = vf.path;

    // Extra video files → add as downloads
    for (let i = 1; i < videoFiles.length; i++) {
      const extra = videoFiles[i];
      downloadFiles.push({ path: extra.path, fileName: extra.fileName });
    }
  }

  // ── Check embed files for Vimeo IDs ──
  let foundVimeoId: string | null = null;
  for (const { path, fileName, ext } of embedFiles) {
    const text = await zip.files[path].async('text');

    if (ext === 'json') {
      const entries = extractVimeoFromJson(text);
      if (entries.length > 0) {
        const entry = entries[0];
        foundVimeoId = entry.vimeoId;
        if (entry.name) {
          // If the JSON manifest gives a lesson name, use it to override
          const normJson = normalizeName(entry.name);
          const normFolder = normalizeName(lessonName);
          if (normJson !== normFolder) {
            console.log(`[zip-import] JSON manifest name "${entry.name}" differs from folder name "${lessonName}" — using folder name`);
          }
        }
        console.log(`[zip-import] Vimeo ID ${foundVimeoId} found in JSON "${path}"`);
        break;
      }
    } else if (ext === 'csv') {
      const entries = extractVimeoFromCsv(text);
      if (entries.length > 0) {
        foundVimeoId = entries[0].vimeoId;
        console.log(`[zip-import] Vimeo ID ${foundVimeoId} found in CSV "${path}"`);
        break;
      }
    } else {
      // html, htm, txt
      const id = extractVimeoId(text);
      if (id) {
        foundVimeoId = id;
        console.log(`[zip-import] Vimeo ID ${foundVimeoId} found in "${path}"`);
        break;
      }
    }
  }

  // If we have a video file AND a vimeo embed, prefer the file but keep the vimeo ID as fallback
  if (lesson.videoSource === 'file' && foundVimeoId) {
    lesson.vimeoId = foundVimeoId;
    lesson.warnings.push('Both native file and Vimeo embed found — using uploaded file');
    console.warn(`[zip-import] Lesson "${lessonName}": both file and Vimeo embed found — preferring file`);
  } else if (lesson.videoSource === 'none' && foundVimeoId) {
    lesson.videoSource = 'vimeo';
    lesson.vimeoId = foundVimeoId;
  } else if (lesson.videoSource === 'none') {
    // Check if any embed file looked like it should be a video
    for (const { path } of embedFiles) {
      if (nameSuggestsVideo(path)) {
        lesson.videoSource = 'missing';
        lesson.warnings.push('No video source detected');
        console.warn(`[zip-import] Lesson "${lessonName}": no video source detected (filename suggests video)`);
        break;
      }
    }
  }

  // ── Process download files ──
  for (const { path, fileName } of downloadFiles) {
    const blob = await zip.files[path].async('blob');
    lesson.attachments.push({
      file: new File([blob], fileName, { type: getMimeType(fileName) }),
      originalName: fileName,
    });
  }

  // Embed files that didn't yield a Vimeo ID become downloads too
  for (const { path, fileName, ext } of embedFiles) {
    const text = await zip.files[path].async('text');
    let hasVimeo = false;
    if (ext === 'json') hasVimeo = extractVimeoFromJson(text).length > 0;
    else if (ext === 'csv') hasVimeo = extractVimeoFromCsv(text).length > 0;
    else hasVimeo = extractVimeoId(text) !== null;

    if (!hasVimeo) {
      const blob = await zip.files[path].async('blob');
      lesson.attachments.push({
        file: new File([blob], fileName, { type: getMimeType(fileName) }),
        originalName: fileName,
      });
    }
  }

  return lesson;
}

/** Parse files that sit directly in a section folder (no subfolder).
 *  Each video file becomes its own lesson; remaining files become a downloads lesson. */
async function parseRootFiles(
  paths: string[],
  zip: JSZip,
): Promise<ParsedLesson[]> {
  const videoLessons: ParsedLesson[] = [];
  const downloadAttachments: ParsedAttachment[] = [];

  for (const path of paths) {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    if (!fileName || isSkipped(fileName)) continue;
    const ext = getExtension(fileName);

    if (VIDEO_EXTS.has(ext)) {
      const blob = await zip.files[path].async('blob');
      const mime = getMimeType(fileName);
      videoLessons.push({
        name: stripExtension(fileName),
        videoSource: 'file',
        videoFile: new File([blob], fileName, { type: mime }),
        videoFileName: fileName,
        sourcePath: path,
        attachments: [],
        warnings: [],
      });
      console.log(`[zip-import] Root video file → lesson "${stripExtension(fileName)}"`);
    } else if (EMBED_EXTS.has(ext)) {
      const text = await zip.files[path].async('text');
      let vimeoId: string | null = null;

      if (ext === 'json') {
        const entries = extractVimeoFromJson(text);
        if (entries.length > 0) vimeoId = entries[0].vimeoId;
      } else if (ext === 'csv') {
        const entries = extractVimeoFromCsv(text);
        if (entries.length > 0) vimeoId = entries[0].vimeoId;
      } else {
        vimeoId = extractVimeoId(text);
      }

      if (vimeoId) {
        videoLessons.push({
          name: stripExtension(fileName),
          videoSource: 'vimeo',
          vimeoId,
          sourcePath: path,
          attachments: [],
          warnings: [],
        });
        console.log(`[zip-import] Root embed file → lesson "${stripExtension(fileName)}" (Vimeo ${vimeoId})`);
      } else if (nameSuggestsVideo(path)) {
        videoLessons.push({
          name: stripExtension(fileName),
          videoSource: 'missing',
          sourcePath: path,
          attachments: [],
          warnings: ['No video source detected'],
        });
      } else {
        const blob = await zip.files[path].async('blob');
        downloadAttachments.push({
          file: new File([blob], fileName, { type: getMimeType(fileName) }),
          originalName: fileName,
        });
      }
    } else {
      const blob = await zip.files[path].async('blob');
      downloadAttachments.push({
        file: new File([blob], fileName, { type: getMimeType(fileName) }),
        originalName: fileName,
      });
    }
  }

  if (downloadAttachments.length > 0) {
    videoLessons.push({
      name: 'Templates & Downloads',
      videoSource: 'none',
      attachments: downloadAttachments,
      warnings: [],
    });
  }

  return videoLessons;
}
