import type { ReactNode } from 'react'

// Render markdown tối giản bằng phần tử React, không bao giờ dùng HTML thô: mọi chữ đều là text node nên
// thẻ <script> hay <img onerror> của AI/người dùng chỉ hiện thành chữ. Link chỉ nhận http/https.

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g

/** Chỉ cho phép http/https; mọi giao thức khác (javascript:, data:...) bị bỏ. */
export function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return (
        <code key={i} className="rounded-sm bg-surface-muted px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const href = safeHref(link[2]!)
      return href ? (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-accent-text underline underline-offset-2"
        >
          {link[1]}
        </a>
      ) : (
        <span key={i}>{link[1]}</span>
      )
    }
    return part
  })
}

type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'h'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'code'; text: string }

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = []
  let para: string[] | null = null
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null
  let code: string[] | null = null

  const flush = () => {
    if (para) blocks.push({ type: 'p', lines: para })
    if (list) blocks.push(list)
    para = null
    list = null
  }

  for (const line of source.split(/\r?\n/)) {
    if (code) {
      if (line.trim().startsWith('```')) {
        blocks.push({ type: 'code', text: code.join('\n') })
        code = null
      } else code.push(line)
      continue
    }
    if (line.trim().startsWith('```')) {
      flush()
      code = []
      continue
    }
    if (line.trim() === '') {
      flush()
      continue
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      blocks.push({ type: 'h', text: heading[1]! })
      continue
    }
    const item = /^\s*(?:([-*])|\d+[.)])\s+(.*)$/.exec(line)
    if (item) {
      const type = item[1] ? 'ul' : 'ol'
      if (!list || list.type !== type) {
        flush()
        list = { type, items: [] }
      }
      list.items.push(item[2]!)
      continue
    }
    if (list) flush()
    ;(para ??= []).push(line)
  }
  // Khối code chưa đóng (đang stream) vẫn hiện phần đã nhận
  if (code) blocks.push({ type: 'code', text: (code as string[]).join('\n') })
  flush()
  return blocks
}

export function SafeMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 break-words">
      {parseBlocks(text).map((block, i) => {
        switch (block.type) {
          case 'h':
            return (
              <p key={i} className="font-semibold">
                {renderInline(block.text)}
              </p>
            )
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {block.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="list-decimal space-y-1 pl-5">
                {block.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <pre key={i} className="overflow-x-auto rounded-field bg-surface-muted p-3 text-sm">
                <code>{block.text}</code>
              </pre>
            )
          default:
            return (
              <p key={i}>
                {block.lines.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </span>
                ))}
              </p>
            )
        }
      })}
    </div>
  )
}
