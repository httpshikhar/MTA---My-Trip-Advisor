import React from 'react'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
})

export function MarkdownRenderer({ content }: { content: string }) {
  const html = React.useMemo(() => marked.parse(content || '') as string, [content])
  return (
    <div className="prose prose-invert prose-headings:scroll-mt-20 prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline"
         dangerouslySetInnerHTML={{ __html: html }} />
  )
}
