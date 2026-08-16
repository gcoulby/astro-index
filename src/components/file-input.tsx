import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import { Upload, X, File as FileIcon } from 'lucide-react'
import { extractAstroIndex } from '@/converter/extract'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface FileInputProps {
  multiple?: boolean
  accept?: string
  maxSizeMB?: number
  onFilesChange?: (files: File[]) => void
}

export default function FileInput({
  multiple = true,
  accept,
  maxSizeMB = 500,
  onFilesChange = () => {},
}: FileInputProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = useCallback(
    (incoming: File[]): File[] => {
      const valid: File[] = []
      for (const file of incoming) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`"${file.name}" is over ${maxSizeMB}MB`)
          continue
        }
        valid.push(file)
      }
      return valid
    },
    [maxSizeMB],
  )

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return
      const incoming = Array.from(list)
      const valid = validate(incoming)
      if (valid.length === 0) return

      setError('')
      setFiles((prev) => {
        const next = multiple ? [...prev, ...valid] : valid.slice(0, 1)
        onFilesChange(next)
        return next
      })
    },
    [multiple, onFilesChange, validate],
  )

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      onFilesChange(next)
      return next
    })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  useEffect(() => {
    if (files.length > 0) {
      const run = async () => {
        const bytes = await files[0].arrayBuffer()
        const pages = await extractAstroIndex(
          bytes,
          { ignore: [1, 2, 3, 144], offset: 3 },
          pdfjsLib,
        )
        console.log(pages)
      }
      run()
    }
  }, [files])

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
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 '
        }`}
      >
        <Upload className="w-6 h-6 text-gray-500" />
        <p className="text-gray-600 text-sm text-center">
          <span className="font-medium text-blue-600">Click to upload</span> or
          drag and drop
        </p>
        {accept && <p className="text-gray-400 text-xs">{accept}</p>}
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            addFiles(e.target.files)
          }
        />
      </div>

      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-2 mt-3">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex justify-between items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-gray-400 shrink-0">
                  {formatSize(file.size)}
                </span>
              </div>
              <button
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
                className="text-gray-400 hover:text-red-600 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
