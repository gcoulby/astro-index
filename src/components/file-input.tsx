import { useState, useRef, useCallback } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import { Upload, X, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileInputProps {
  accept?: string
  maxSizeMB?: number
  onFileSelected: (file: File) => void
}

/** Drag-and-drop / click-to-browse file picker. Purely presentational —
 * callers decide what happens with the selected file. */
export default function FileInput({
  accept = 'application/pdf',
  maxSizeMB = 500,
  onFileSelected,
}: FileInputProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const acceptFile = useCallback(
    (candidate: File | undefined) => {
      if (!candidate) return
      if (candidate.size > maxSizeMB * 1024 * 1024) {
        setError(`"${candidate.name}" is over ${maxSizeMB}MB`)
        return
      }
      setError('')
      setFile(candidate)
      onFileSelected(candidate)
    },
    [maxSizeMB, onFileSelected],
  )

  const clearFile = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    acceptFile(e.dataTransfer.files[0])
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink',
          isDragging
            ? 'border-accent-pink bg-accent-pink/10'
            : 'border-astro-white/25 hover:border-astro-white/50',
        )}
      >
        <Upload className="size-6 text-astro-white/60" />
        <p className="font-mono text-sm text-astro-white/80">
          <span className="font-medium text-accent-pink">Click to upload</span>{' '}
          or drag and drop
        </p>
        {accept && (
          <p className="font-mono text-xs text-astro-white/40">{accept}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            acceptFile(e.target.files?.[0])
          }
        />
      </div>

      {error && (
        <p className="mt-2 font-mono text-sm text-accent-pink">{error}</p>
      )}

      {file && (
        <div className="mt-3 flex items-center gap-2 border border-astro-white/15 px-3 py-2 font-mono text-sm">
          <FileIcon className="size-4 shrink-0 text-astro-white/40" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-astro-white/40">
            {formatSize(file.size)}
          </span>
          <button
            onClick={clearFile}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 text-astro-white/40 hover:text-accent-pink"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
