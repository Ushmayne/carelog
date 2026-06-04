'use client'

import { useState, useRef } from 'react'
import { createDocument, deleteDocument } from '@/app/actions/documents'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FolderOpen, Upload, Loader2, Trash2, Download, FileText, FileImage, File } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import type { CareDocument } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  careGroupId: string
  documents: CareDocument[]
}

const CATEGORIES: Record<CareDocument['category'], { label: string; color: string }> = {
  medical_record: { label: 'Medical Record',  color: 'bg-blue-100 text-blue-800' },
  insurance:      { label: 'Insurance',        color: 'bg-purple-100 text-purple-800' },
  prescription:   { label: 'Prescription',     color: 'bg-teal-100 text-teal-800' },
  test_result:    { label: 'Test Result',       color: 'bg-orange-100 text-orange-800' },
  other:          { label: 'Other',             color: 'bg-gray-100 text-gray-700' },
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
  return <File className="h-5 w-5 text-gray-400" />
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsClient({ careGroupId, documents }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filter, setFilter] = useState<CareDocument['category'] | 'all'>('all')

  const [docName, setDocName] = useState('')
  const [docDesc, setDocDesc] = useState('')
  const [docCategory, setDocCategory] = useState<CareDocument['category']>('other')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ''))
    setOpen(true)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = selectedFile.name.split('.').pop() ?? ''
      const path = `${careGroupId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('care-documents')
        .upload(path, selectedFile)
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      const { data: { publicUrl } } = supabase.storage.from('care-documents').getPublicUrl(path)

      await createDocument(careGroupId, {
        name: docName.trim(),
        description: docDesc || undefined,
        category: docCategory,
        file_url: publicUrl,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
      })

      toast.success('Document uploaded')
      setOpen(false)
      setSelectedFile(null)
      setDocName(''); setDocDesc(''); setDocCategory('other')
      if (fileInputRef.current) fileInputRef.current.value = ''
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(doc: CareDocument) {
    if (!window.confirm(`Delete "${doc.name}"?`)) return
    try {
      const url = new URL(doc.file_url)
      const pathParts = url.pathname.split('/care-documents/')
      const filePath = pathParts[1] ?? ''
      await deleteDocument(doc.id, filePath)
      toast.success('Document deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = filter === 'all' ? documents : documents.filter(d => d.category === filter)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-indigo-600" />
            Documents
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {documents.length > 0 ? `${documents.length} documents stored` : 'Store medical records, insurance, prescriptions'}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Upload Document
          </Button>
        </div>
      </div>

      {/* Upload dialog */}
      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setSelectedFile(null); setDocName(''); setDocDesc(''); setDocCategory('other') } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-2">
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
                {fileIcon(selectedFile.type)}
                <span className="truncate flex-1">{selectedFile.name}</span>
                <span className="text-muted-foreground flex-shrink-0">{formatBytes(selectedFile.size)}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input value={docName} onChange={e => setDocName(e.target.value)} required placeholder="e.g. Lab Results Jan 2025" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={docCategory} onValueChange={v => { if (v) setDocCategory(v as CareDocument['category']) }}>
                <SelectTrigger>
                  <SelectValue>
                    {(v: string | null) => v ? CATEGORIES[v as CareDocument['category']]?.label : 'Select category'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([k, c]) => (
                    <SelectItem key={k} value={k} label={c.label}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea value={docDesc} onChange={e => setDocDesc(e.target.value)} rows={2} placeholder="Brief description..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={uploading || !selectedFile} className="flex-1">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category filter */}
      {documents.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({documents.length})
          </Button>
          {(Object.keys(CATEGORIES) as CareDocument['category'][]).map(cat => {
            const count = documents.filter(d => d.category === cat).length
            if (!count) return null
            return (
              <Button
                key={cat}
                variant={filter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(cat)}
              >
                {CATEGORIES[cat].label} ({count})
              </Button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
            <div className="font-medium text-muted-foreground">No documents yet</div>
            <div className="text-sm text-muted-foreground/70">Upload medical records, insurance cards, prescriptions</div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Upload first document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const cat = CATEGORIES[doc.category]
            return (
              <Card key={doc.id}>
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  <div className="flex-shrink-0">{fileIcon(doc.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{doc.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {doc.file_name}
                      {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}
                      {' · '}
                      {doc.uploader?.full_name ?? 'Unknown'}
                      {' · '}
                      {format(parseISO(doc.created_at), 'MMM d, yyyy')}
                    </div>
                    {doc.description && <div className="text-xs text-muted-foreground mt-0.5 italic">{doc.description}</div>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="outline" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="h-3.5 w-3.5" />View
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
