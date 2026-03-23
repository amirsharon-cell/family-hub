import { useState, useEffect } from 'react'
import { format, startOfDay, addDays, subDays, isToday, isTomorrow } from 'date-fns'
import { Plus, Trash2, Pencil, CheckCircle2, Circle } from 'lucide-react'
import { fetchChores, createChore, updateChore, deleteChore, createCalendar, listCalendars } from '../lib/google'
import { useApp, useLang } from '../App'
import type { ChoreItem, AssigneeId } from '../types'
import { CHORE_TYPES, FAMILY_MEMBERS } from '../types'
import ChoreModal from '../components/ChoreModal'

export default function Chores() {
  const { calendarIds, setCalendarIds } = useApp()
  const { lang, s } = useLang()

  const [chores, setChores] = useState<ChoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingChore, setEditingChore] = useState<ChoreItem | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'yonatan' | 'mika'>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [creatingCalendar, setCreatingCalendar] = useState(false)

  const choreCalId = calendarIds?.chores

  async function load() {
    if (!choreCalId) { setLoading(false); return }
    setLoading(true)
    try {
      const now = new Date()
      const timeMin = subDays(now, 14).toISOString()
      const timeMax = addDays(now, 60).toISOString()
      const items = await fetchChores(choreCalId, timeMin, timeMax)
      setChores(items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [choreCalId])

  async function handleSetupCalendar() {
    setCreatingCalendar(true)
    try {
      const cals = await listCalendars()
      let choreId = cals.find(c => c.summary === 'Family Chores')?.id
      if (!choreId) {
        const created = await createCalendar('Family Chores', 'Family home chores and tasks')
        choreId = created.id
      }
      setCalendarIds({ ...calendarIds!, chores: choreId })
    } catch (e) {
      console.error(e)
    } finally {
      setCreatingCalendar(false)
    }
  }

  async function handleSave(data: Omit<ChoreItem, 'id'>) {
    if (!choreCalId) return
    if (editingChore) {
      await updateChore(choreCalId, editingChore.id, data)
      setEditingChore(null)
    } else {
      await createChore(choreCalId, data)
      setShowModal(false)
    }
    await load()
  }

  async function handleToggleComplete(chore: ChoreItem) {
    if (!choreCalId) return
    setToggling(chore.id)
    try {
      const updated = {
        ...chore,
        completed: !chore.completed,
        completedAt: !chore.completed ? new Date().toISOString() : undefined,
      }
      await updateChore(choreCalId, chore.id, updated)
      await load()
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(chore: ChoreItem) {
    if (!choreCalId) return
    if (!confirm(s.deleteChore(chore.title))) return
    setDeleting(chore.id)
    try {
      await deleteChore(choreCalId, chore.id)
      await load()
    } finally {
      setDeleting(null)
    }
  }

  // Fairness scores (pending chores in next 14 days)
  const today = startOfDay(new Date())
  const horizon = addDays(today, 14)
  function parseDate(str: string) { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d) }

  const pendingUpcoming = chores.filter(c => !c.completed && parseDate(c.dueDate) >= today && parseDate(c.dueDate) <= horizon)
  const scores: Record<AssigneeId, number> = {
    yonatan: pendingUpcoming.filter(c => c.assignedTo === 'yonatan').reduce((acc, c) => acc + c.weight, 0),
    mika:    pendingUpcoming.filter(c => c.assignedTo === 'mika').reduce((acc, c) => acc + c.weight, 0),
  }
  const totalScore = scores.yonatan + scores.mika

  // Filter + sort chores
  const visibleChores = chores
    .filter(c => filter === 'all' || c.assignedTo === filter)
    .filter(c => showCompleted ? true : !c.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  // Group pending by date, then show completed at the bottom
  const pendingChores = visibleChores.filter(c => !c.completed)
  const completedChores = visibleChores.filter(c => c.completed)

  // Group pending by date
  const groups: { label: string; chores: ChoreItem[] }[] = []
  for (const chore of pendingChores) {
    const d = parseDate(chore.dueDate)
    let label: string
    if (isToday(d)) label = s.today
    else if (isTomorrow(d)) label = s.tomorrow
    else label = format(d, lang === 'he' ? 'EEEE, d MMM' : 'EEEE, MMM d')
    const existing = groups.find(g => g.label === label)
    if (existing) existing.chores.push(chore)
    else groups.push({ label, chores: [chore] })
  }

  function ChoreCard({ c }: { c: ChoreItem }) {
    const meta = CHORE_TYPES[c.choreType]
    const member = FAMILY_MEMBERS[c.assignedTo]
    const isCompleted = c.completed
    return (
      <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-opacity ${isCompleted ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => handleToggleComplete(c)}
            disabled={toggling === c.id}
            className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            {isCompleted
              ? <CheckCircle2 size={22} className="text-green-500" />
              : <Circle size={22} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`font-semibold text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {meta.emoji} {c.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${member.color}`}>
                    {lang === 'he' ? member.heName : member.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {'●'.repeat(c.weight)}{'○'.repeat(3 - c.weight)}
                  </span>
                  {c.notes && <span className="text-xs text-gray-400 italic truncate">{c.notes}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!isCompleted && (
                  <button
                    onClick={() => setEditingChore(c)}
                    className="p-1.5 text-gray-300 hover:text-indigo-500 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(c)}
                  disabled={deleting === c.id}
                  className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (!choreCalId) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{s.choresTitle}</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="text-4xl">🧹</div>
          <p className="text-gray-600 text-sm">{s.setupChoresDesc}</p>
          <button
            onClick={handleSetupCalendar}
            disabled={creatingCalendar}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {creatingCalendar ? s.creating : s.createChoresCalendar}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{s.choresTitle}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> {s.addChore}
        </button>
      </div>

      {/* Fairness balance bar */}
      {totalScore > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-3">{s.fairnessTitle}</p>
          <div className="flex gap-3 items-center">
            <span className="text-xs font-medium text-blue-700 w-16 text-right">
              {lang === 'he' ? FAMILY_MEMBERS.yonatan.heName : FAMILY_MEMBERS.yonatan.name}
            </span>
            <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-gray-100 gap-px">
              <div
                className="bg-blue-400 rounded-l-full transition-all"
                style={{ width: `${totalScore > 0 ? (scores.yonatan / totalScore) * 100 : 50}%` }}
              />
              <div
                className="bg-pink-400 rounded-r-full transition-all"
                style={{ width: `${totalScore > 0 ? (scores.mika / totalScore) * 100 : 50}%` }}
              />
            </div>
            <span className="text-xs font-medium text-pink-700 w-16">
              {lang === 'he' ? FAMILY_MEMBERS.mika.heName : FAMILY_MEMBERS.mika.name}
            </span>
          </div>
          <div className="flex justify-between mt-1 px-16">
            <span className="text-xs text-gray-400">{s.fairnessPts(scores.yonatan)}</span>
            <span className="text-xs text-gray-400">{s.fairnessPts(scores.mika)}</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="bg-gray-100 rounded-2xl p-1 flex gap-1">
        {(['all', 'yonatan', 'mika'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'flex-1 py-1.5 rounded-xl text-sm font-medium transition-colors',
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
            ].join(' ')}
          >
            {f === 'all'
              ? (lang === 'he' ? 'הכל' : 'All')
              : (lang === 'he' ? FAMILY_MEMBERS[f].heName : FAMILY_MEMBERS[f].name)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      )}

      {/* Pending chores grouped by date */}
      {!loading && groups.length === 0 && completedChores.length === 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-2">
          <p className="text-gray-400 text-sm">{s.noChoresPending}</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-indigo-600 text-sm font-medium"
          >
            {s.addFirstChore}
          </button>
        </div>
      )}

      {!loading && groups.map(group => (
        <div key={group.label} className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">{group.label}</p>
          {group.chores.map(c => <ChoreCard key={c.id} c={c} />)}
        </div>
      ))}

      {/* Show completed toggle */}
      {!loading && (
        <button
          onClick={() => setShowCompleted(v => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium px-1"
        >
          {showCompleted ? '▾' : '▸'} {s.showCompleted}
          {completedChores.length > 0 && ` (${completedChores.length})`}
        </button>
      )}

      {/* Completed chores */}
      {showCompleted && completedChores.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">{s.completed}</p>
          {completedChores.map(c => <ChoreCard key={c.id} c={c} />)}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <ChoreModal
          allChores={chores}
          onClose={() => setShowModal(false)}
          onSaved={handleSave}
        />
      )}

      {/* Edit modal */}
      {editingChore && (
        <ChoreModal
          chore={editingChore}
          allChores={chores}
          onClose={() => setEditingChore(null)}
          onSaved={handleSave}
        />
      )}
    </div>
  )
}
