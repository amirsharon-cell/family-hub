import { useState } from 'react'
import { X } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import { useApp, useLang } from '../App'
import type { ChoreItem, ChoreType, AssigneeId, WorkSession } from '../types'
import { CHORE_TYPES, FAMILY_MEMBERS } from '../types'
import CalendarPicker from './CalendarPicker'

// Fairness algorithm: burden-balancing + last-did tiebreak
function suggestAssignee(chores: ChoreItem[], choreType: ChoreType): AssigneeId {
  const now = startOfDay(new Date())
  const horizon = addDays(now, 14)

  function parseDate(s: string) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const upcoming = chores.filter(c => {
    if (c.completed) return false
    const d = parseDate(c.dueDate)
    return d >= now && d <= horizon
  })

  const scores: Record<AssigneeId, number> = {
    yonatan: upcoming.filter(c => c.assignedTo === 'yonatan').reduce((s, c) => s + c.weight, 0),
    mika:    upcoming.filter(c => c.assignedTo === 'mika').reduce((s, c) => s + c.weight, 0),
  }

  if (scores.yonatan !== scores.mika) {
    return scores.yonatan < scores.mika ? 'yonatan' : 'mika'
  }

  // Tiebreak: who did this type last?
  const sameType = chores
    .filter(c => c.choreType === choreType && c.completed && c.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  if (sameType.length > 0) return sameType[0].assignedTo === 'yonatan' ? 'mika' : 'yonatan'

  return 'yonatan'
}

export default function ChoreModal({
  chore,
  allChores,
  workSessions,
  onClose,
  onSaved,
}: {
  chore?: ChoreItem
  allChores: ChoreItem[]
  workSessions?: WorkSession[]
  onClose: () => void
  onSaved: (saved: Omit<ChoreItem, 'id'>) => Promise<void>
}) {
  const { } = useApp()
  const { lang, s } = useLang()
  const now = new Date()
  const isEdit = !!chore

  const [choreType, setChoreType] = useState<ChoreType>(chore?.choreType ?? 'garbage')
  const [title, setTitle] = useState(chore?.title ?? (lang === 'he' ? CHORE_TYPES['garbage'].heLabel : CHORE_TYPES['garbage'].label))
  const [titleEdited, setTitleEdited] = useState(isEdit)
  const [dueDate, setDueDate] = useState<Date>(() => {
    if (chore?.dueDate) {
      const [y, m, d] = chore.dueDate.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    return now
  })
  const suggested = suggestAssignee(allChores, choreType)
  const [assignedTo, setAssignedTo] = useState<AssigneeId>(chore?.assignedTo ?? suggested)
  const [weight, setWeight] = useState(chore?.weight ?? CHORE_TYPES['garbage'].weight)
  const [notes, setNotes] = useState(chore?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Check if assigned person has work on the selected due date
  const dueDateStr = format(dueDate, 'yyyy-MM-dd')
  const workerHasWorkOnDay = workSessions?.some(
    ws => ws.worker === assignedTo && ws.date === dueDateStr
  ) ?? false

  function handleTypeChange(t: ChoreType) {
    setChoreType(t)
    if (!titleEdited) {
      setTitle(lang === 'he' ? CHORE_TYPES[t].heLabel : CHORE_TYPES[t].label)
    }
    setWeight(CHORE_TYPES[t].weight)
    // Re-suggest assignee for new type
    setAssignedTo(suggestAssignee(allChores, t))
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError('')
    try {
      await onSaved({
        title: title.trim(),
        choreType,
        assignedTo,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        completed: chore?.completed ?? false,
        completedAt: chore?.completedAt,
        weight,
        notes: notes.trim() || undefined,
      })
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  const weightOptions = [
    { value: 1, label: s.weightLight },
    { value: 2, label: s.weightMedium },
    { value: 3, label: s.weightHeavy },
  ]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md max-h-[92dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? s.editChore : s.addChore}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
              <X size={20} />
            </button>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          {/* Chore type chips */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{s.choreType}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CHORE_TYPES) as [ChoreType, typeof CHORE_TYPES[ChoreType]][]).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    choreType === key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white',
                  ].join(' ')}
                >
                  {meta.emoji} {lang === 'he' ? meta.heLabel : meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setTitleEdited(true) }}
            placeholder={s.choreTitlePlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Assign to */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{s.assignTo}</p>
            <div className="flex gap-2">
              {(Object.entries(FAMILY_MEMBERS) as [AssigneeId, typeof FAMILY_MEMBERS[AssigneeId]][]).map(([id, member]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAssignedTo(id)}
                  className={[
                    'flex-1 flex flex-col items-center py-2.5 rounded-xl border text-sm font-medium transition-colors',
                    assignedTo === id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300 bg-white',
                  ].join(' ')}
                >
                  <span>{lang === 'he' ? member.heName : member.name}</span>
                  {!isEdit && id === suggested && (
                    <span className={`text-xs mt-0.5 ${assignedTo === id ? 'text-indigo-200' : 'text-indigo-500'}`}>
                      ✦ {s.suggested}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3">{s.choreDue}</p>
            <CalendarPicker value={dueDate} onChange={setDueDate} />
          </div>

          {/* Work conflict warning */}
          {workerHasWorkOnDay && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <span className="text-amber-500 text-sm">⚠️</span>
              <p className="text-amber-700 text-sm">
                {s.workedOn(format(dueDate, lang === 'he' ? 'd/M/yyyy' : 'MMM d'))}
              </p>
            </div>
          )}

          {/* Effort level */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{s.weightLabel}</p>
            <div className="flex gap-2">
              {weightOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWeight(opt.value)}
                  className={[
                    'flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                    weight === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300 bg-white',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder={s.notesPlaceholderChore}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Sticky save button */}
        <div className="px-5 pb-5 pt-3 pb-safe border-t border-gray-100 bg-white">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? s.saving : isEdit ? s.saveChanges : s.saveChore}
          </button>
        </div>
      </div>
    </div>
  )
}
