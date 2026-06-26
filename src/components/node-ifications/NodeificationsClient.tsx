'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNickname } from '@/hooks/useNickname'
import type { AnnouncementRow, ReminderRow, CompletionRow } from '@/types'
import {
  deleteAnnouncement,
  toggleReminderCompletion,
  resolveReminder,
} from '@/app/node-ifications/actions'
import { TabToggle, type Tab } from './TabToggle'
import { FeaturedAnnouncementCard } from './FeaturedAnnouncementCard'
import { AnnouncementList } from './AnnouncementList'
import { AddAnnouncementForm } from './AddAnnouncementForm'
import { ReminderList } from './ReminderList'
import { AddReminderForm } from './AddReminderForm'
import { CompletedReminders } from './CompletedReminders'
import { Toast } from './Toast'
import { ReminderModal } from './ReminderModal'
import { AnnouncementModal } from './AnnouncementModal'

interface Props {
  initialAnnouncements: AnnouncementRow[]
  initialReminders: ReminderRow[]
  initialCompletions: CompletionRow[]
  isAdmin: boolean
}

export function NodeificationsClient({
  initialAnnouncements,
  initialReminders,
  initialCompletions,
  isAdmin,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [selectedReminder, setSelectedReminder] = useState<ReminderRow | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRow | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set())
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>(initialAnnouncements)
  const [reminders, setReminders] = useState<ReminderRow[]>(initialReminders)
  const [completions, setCompletions] = useState<CompletionRow[]>(initialCompletions)
  const { nickname } = useNickname()
  const shouldReduce = useReducedMotion()

  const featured = announcements.find((a) => a.pinned) ?? announcements[0] ?? null
  const annList = featured ? announcements.filter((a) => a.id !== featured.id) : announcements

  type DateFilter = 'all' | 'overdue' | 'today' | 'this-week' | 'no-date' | 'done'
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  // Personal reminders are only visible to their creator; team reminders to everyone
  const visibleReminders = reminders.filter(
    (r) => (r.type ?? 'team') === 'team' || r.created_by.toLowerCase() === nickname?.toLowerCase(),
  )

  const activeReminders = visibleReminders.filter(
    (r) => !completions.some((c) => c.reminder_id === r.id && c.nickname === nickname),
  )
  const completedReminders = visibleReminders.filter((r) =>
    completions.some((c) => c.reminder_id === r.id && c.nickname === nickname),
  )

  function applyDateFilter(list: typeof activeReminders): typeof activeReminders {
    if (dateFilter === 'all') return list
    const todayStr = new Date().toISOString().slice(0, 10)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().slice(0, 10)
    switch (dateFilter) {
      case 'overdue':    return list.filter((r) => r.due_date && r.due_date < todayStr)
      case 'today':      return list.filter((r) => r.due_date === todayStr)
      case 'this-week':  return list.filter((r) => r.due_date && r.due_date >= todayStr && r.due_date < nextWeekStr)
      case 'no-date':    return list.filter((r) => !r.due_date)
      default:           return list
    }
  }

  const filteredActiveReminders = dateFilter === 'done'
    ? completedReminders
    : applyDateFilter(activeReminders)

  const handleAddAnnouncement = useCallback((a: AnnouncementRow) => {
    setAnnouncements((prev) => [a, ...prev])
  }, [])

  const handleDeleteAnnouncement = useCallback(
    async (id: string) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      const res = await deleteAnnouncement({ id, nickname: nickname! })
      if ('error' in res) {
        setAnnouncements(initialAnnouncements)
        setToast('Could not delete — try again.')
      }
    },
    [nickname, initialAnnouncements],
  )

  const handleAddReminder = useCallback((r: ReminderRow) => {
    setReminders((prev) => [r, ...prev])
  }, [])

  const handleToggle = useCallback(
    async (reminderId: string, done: boolean) => {
      setSubmittingIds((prev) => new Set(prev).add(reminderId))

      if (done) {
        const opt: CompletionRow = {
          id: 'opt-' + reminderId,
          reminder_id: reminderId,
          nickname: nickname!,
          completed_at: new Date().toISOString(),
        }
        setCompletions((prev) => [...prev, opt])
      } else {
        setCompletions((prev) =>
          prev.filter((c) => !(c.reminder_id === reminderId && c.nickname === nickname)),
        )
      }

      const res = await toggleReminderCompletion({ reminderId, nickname: nickname!, done })

      if ('error' in res) {
        if (done) {
          setCompletions((prev) => prev.filter((c) => c.id !== 'opt-' + reminderId))
        } else {
          setCompletions(initialCompletions)
        }
        setToast('Something went wrong — try again.')
      }

      setSubmittingIds((prev) => {
        const s = new Set(prev)
        s.delete(reminderId)
        return s
      })
    },
    [nickname, initialCompletions],
  )

  const handleResolve = useCallback(
    async (id: string) => {
      setReminders((prev) => prev.filter((r) => r.id !== id))
      const res = await resolveReminder({ id, nickname: nickname! })
      if ('error' in res) {
        setReminders(initialReminders)
        setToast('Could not resolve — try again.')
      }
    },
    [nickname, initialReminders],
  )

  const handleUntick = useCallback(
    (reminderId: string) => {
      handleToggle(reminderId, false)
    },
    [handleToggle],
  )

  return (
    <div>
      <TabToggle activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduce ? 0 : -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'all' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ flex: '1.7 1 360px', minWidth: 0 }}>
                <div style={{ background: 'var(--card)', borderRadius: '26px', border: '1px solid var(--bd)', boxShadow: '0 22px 46px -32px var(--shadow)', padding: '24px' }}>
                  <h2 style={{ margin: '0 0 16px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '20px', letterSpacing: '-.01em' }}>
                    📣 Announcements
                  </h2>
                  {featured && (
                    <FeaturedAnnouncementCard announcement={featured} nickname={nickname} onDelete={handleDeleteAnnouncement} onView={setSelectedAnnouncement} isAdmin={isAdmin} />
                  )}
                  <AnnouncementList announcements={annList} nickname={nickname} onDelete={handleDeleteAnnouncement} onView={setSelectedAnnouncement} isAdmin={isAdmin} />
                </div>
              </div>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <div style={{ background: 'var(--card)', borderRadius: '26px', border: '1px solid var(--bd)', boxShadow: '0 22px 46px -32px var(--shadow)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '20px', letterSpacing: '-.01em' }}>
                      ✅ Reminders
                    </h2>
                    {completedReminders.length > 0 && (
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--green)' }}>
                        {completedReminders.length}/{visibleReminders.length} done
                      </span>
                    )}
                  </div>
                  <ReminderList reminders={activeReminders} completions={completions} nickname={nickname} onToggle={handleToggle} onResolve={handleResolve} onView={setSelectedReminder} submittingIds={submittingIds} isAdmin={isAdmin} />
                  {completedReminders.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <CompletedReminders completed={completedReminders} nickname={nickname} onUntick={handleUntick} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'announcements' ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: '1.7 1 360px', minWidth: 0 }}>
                <div
                  style={{
                    background: 'var(--card)',
                    borderRadius: '26px',
                    border: '1px solid var(--bd)',
                    boxShadow: '0 22px 46px -32px var(--shadow)',
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 700,
                        fontSize: '20px',
                        letterSpacing: '-.01em',
                      }}
                    >
                      📣 Announcements
                    </h2>
                  </div>
                  {featured && (
                    <FeaturedAnnouncementCard
                      announcement={featured}
                      nickname={nickname}
                      onDelete={handleDeleteAnnouncement}
                      onView={setSelectedAnnouncement}
                      isAdmin={isAdmin}
                    />
                  )}
                  <AnnouncementList
                    announcements={annList}
                    nickname={nickname}
                    onDelete={handleDeleteAnnouncement}
                    onView={setSelectedAnnouncement}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <AddAnnouncementForm
                  nickname={nickname}
                  onAdd={handleAddAnnouncement}
                  onToast={setToast}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
              {/* Left: form — appears first in DOM so it stacks on top on mobile */}
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <AddReminderForm nickname={nickname} onAdd={handleAddReminder} onToast={setToast} />
              </div>

              {/* Right: list with filters */}
              <div style={{ flex: '1.6 1 380px', minWidth: 0 }}>
                <div style={{ background: 'var(--card)', borderRadius: '26px', border: '1px solid var(--bd)', boxShadow: '0 22px 46px -32px var(--shadow)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '20px', letterSpacing: '-.01em' }}>
                      ✅ Reminders
                    </h2>
                    {completedReminders.length > 0 && (
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--green)' }}>
                        {completedReminders.length}/{visibleReminders.length} done
                      </span>
                    )}
                  </div>

                  {/* Date / status filter chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {([
                      { id: 'all', label: 'All' },
                      { id: 'overdue', label: '🔴 Overdue' },
                      { id: 'today', label: 'Today' },
                      { id: 'this-week', label: 'This week' },
                      { id: 'no-date', label: 'No date' },
                      { id: 'done', label: '✅ Done' },
                    ] as { id: DateFilter; label: string }[]).map((chip) => {
                      const active = dateFilter === chip.id
                      return (
                        <button
                          key={chip.id}
                          onClick={() => setDateFilter(chip.id)}
                          style={{
                            padding: '5px 13px',
                            borderRadius: '999px',
                            border: active ? 'none' : '1px solid var(--bd)',
                            background: active ? 'var(--tx)' : 'transparent',
                            color: active ? 'var(--bg)' : 'var(--txs)',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                        >
                          {chip.label}
                        </button>
                      )
                    })}
                  </div>

                  <ReminderList
                    reminders={filteredActiveReminders}
                    completions={completions}
                    nickname={nickname}
                    onToggle={handleToggle}
                    onResolve={handleResolve}
                    onView={setSelectedReminder}
                    submittingIds={submittingIds}
                    isAdmin={isAdmin}
                    emptyLabel={dateFilter === 'done' ? 'Nothing done yet — keep going!' : undefined}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Toast message={toast} onDismiss={() => setToast(null)} />
      <ReminderModal reminder={selectedReminder} onClose={() => setSelectedReminder(null)} />
      <AnnouncementModal announcement={selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />
    </div>
  )
}
