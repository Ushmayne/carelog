'use client'

import { useState } from 'react'
import { addVital, deleteVital } from '@/app/actions/vitals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Plus, Loader2, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import type { VitalReading } from '@/types'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface Props {
  careGroupId: string
  vitals: VitalReading[]
}

const VITAL_CONFIG: Record<VitalReading['type'], { label: string; unit: string; placeholder: string; color: string }> = {
  blood_pressure:     { label: 'Blood Pressure',     unit: 'mmHg', placeholder: '120/80',  color: '#ef4444' },
  heart_rate:         { label: 'Heart Rate',          unit: 'bpm',  placeholder: '72',      color: '#ec4899' },
  weight:             { label: 'Weight',              unit: 'lbs',  placeholder: '165',     color: '#3b82f6' },
  blood_sugar:        { label: 'Blood Sugar',         unit: 'mg/dL',placeholder: '95',      color: '#f97316' },
  temperature:        { label: 'Temperature',         unit: '°F',   placeholder: '98.6',    color: '#eab308' },
  oxygen_saturation:  { label: 'O₂ Saturation',       unit: '%',    placeholder: '98',      color: '#0d9488' },
}

const VITAL_TYPES = Object.keys(VITAL_CONFIG) as VitalReading['type'][]

function parseNumericValue(value: string): number | null {
  const n = parseFloat(value.split('/')[0])
  return isNaN(n) ? null : n
}

export function VitalsClient({ careGroupId, vitals }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [vType, setVType] = useState<VitalReading['type']>('blood_pressure')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('mmHg')
  const [notes, setNotes] = useState('')
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 16))

  function handleTypeChange(type: VitalReading['type']) {
    setVType(type)
    setUnit(VITAL_CONFIG[type].unit)
    setValue('')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await addVital(careGroupId, {
        type: vType,
        value: value.trim(),
        unit,
        notes: notes || undefined,
        recorded_at: new Date(recordedAt).toISOString(),
      })
      toast.success('Reading recorded')
      setOpen(false)
      setValue(''); setNotes('')
      setRecordedAt(new Date().toISOString().slice(0, 16))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save reading')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this reading?')) return
    try {
      await deleteVital(id)
      toast.success('Reading deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const byType = VITAL_TYPES.reduce((acc, t) => {
    acc[t] = vitals.filter(v => v.type === t)
    return acc
  }, {} as Record<VitalReading['type'], VitalReading[]>)

  const hasAny = vitals.length > 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-rose-600" />
            Vitals
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {hasAny ? `${vitals.length} readings recorded` : 'Track health measurements over time'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />Record Vital
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Vital Sign</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={vType} onValueChange={v => { if (v) handleTypeChange(v as VitalReading['type']) }}>
                  <SelectTrigger>
                    <SelectValue>
                      {(v: string | null) => v ? VITAL_CONFIG[v as VitalReading['type']]?.label : 'Select type'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {VITAL_TYPES.map(t => (
                      <SelectItem key={t} value={t} label={VITAL_CONFIG[t].label}>{VITAL_CONFIG[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    placeholder={VITAL_CONFIG[vType].placeholder}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={unit} onChange={e => setUnit(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recorded at <span className="text-muted-foreground font-normal">(change for late logging)</span></Label>
                <Input type="datetime-local" value={recordedAt} onChange={e => setRecordedAt(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="Any observations..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Reading
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!hasAny ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
            <Activity className="h-12 w-12 text-muted-foreground/30" />
            <div className="font-medium text-muted-foreground">No readings yet</div>
            <div className="text-sm text-muted-foreground/70">Record blood pressure, weight, and more</div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {VITAL_TYPES.filter(t => byType[t].length > 0).map(t => (
              <TabsTrigger key={t} value={t}>{VITAL_CONFIG[t].label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VITAL_TYPES.map(t => {
                const latest = byType[t][0]
                if (!latest) return null
                const cfg = VITAL_CONFIG[t]
                return (
                  <Card key={t}>
                    <CardContent className="pt-5 pb-4">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{cfg.label}</div>
                      <div className="text-3xl font-bold" style={{ color: cfg.color }}>
                        {latest.value}
                        <span className="text-sm font-normal text-muted-foreground ml-1">{latest.unit}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(latest.recorded_at), 'MMM d, h:mm a')}
                        {latest.recorder?.full_name ? ` · ${latest.recorder.full_name}` : ''}
                      </div>
                      {byType[t].length > 1 && (
                        <div className="mt-3">
                          <MiniSparkline readings={byType[t].slice(0, 14).reverse()} color={cfg.color} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {VITAL_TYPES.filter(t => byType[t].length > 0).map(t => {
            const cfg = VITAL_CONFIG[t]
            const readings = byType[t]
            const chartData = readings.slice(0, 30).reverse().map(r => ({
              date: format(parseISO(r.recorded_at), 'MMM d'),
              value: parseNumericValue(r.value),
              raw: r.value,
            })).filter(d => d.value !== null)

            return (
              <TabsContent key={t} value={t}>
                {chartData.length >= 2 && (
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" style={{ color: cfg.color }} />
                        Trend — last {chartData.length} readings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={40} />
                          <Tooltip
                            formatter={(value) => [`${value} ${cfg.unit}`, cfg.label]}
                          />
                          <Line type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-2">
                  {readings.map(r => (
                    <Card key={r.id}>
                      <CardContent className="py-3 px-4 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="font-semibold" style={{ color: cfg.color }}>
                            {r.value} <span className="text-sm font-normal text-muted-foreground">{r.unit}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {format(parseISO(r.recorded_at), 'EEEE, MMM d, h:mm a')}
                            {r.recorder?.full_name ? ` · ${r.recorder.full_name}` : ''}
                          </div>
                          {r.notes && <div className="text-xs text-muted-foreground mt-1 italic">{r.notes}</div>}
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}

function MiniSparkline({ readings, color }: { readings: VitalReading[]; color: string }) {
  const values = readings.map(r => parseNumericValue(r.value)).filter((v): v is number => v !== null)
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 200
  const h = 40
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 32 }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  )
}
