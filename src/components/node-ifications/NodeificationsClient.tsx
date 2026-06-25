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
import { TabToggle } from './TabToggle'
import { FeaturedAnnouncementCard } from './FeaturedAnnouncementCard'
import { AnnouncementList } from './AnnouncementList'
import { AddAnnouncementForm } from './AddAnnouncementForm'
import { ReminderList } from './ReminderList'
import { AddReminderForm } from './AddReminderForm'
import { CompletedReminders } from './CompletedReminders'
import { Toast } from './Toast'

interface Props {
  initialAnnouncements: AnnouncementRow[]
  initialReminders: ReminderRow[]
  initialCompletions: CompletionRow[]
}

export function NodeificationsClient({
  initialAnnouncements,
  initialReminders,
  initialCompletions,
}: Props) {
  const [activeTab, setActiveTab] = useState<'announcements' | 'reminders'>('announcements')
  const [toast, setToast] = useState<string | null>(null)
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set())
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>(initialAnnouncements)
  const [reminders, setReminders] = useState<ReminderRow[]>(initialReminders)
  const [completions, setCompletions] = useState<CompletionRow[]>(initialCompletions)
  const { nickname } = useNickname()
  const shouldReduce = useReducedMotion()

  const featured = announcements.find((a) => a.pinned) ?? announcements[0] ?? null
  const annList = featured ? announcements.filter((a) => a.id !== featured.id) : announcements

  const activeReminders = reminders.filter(
    (r) => !completions.some((c) => c.reminder_id === r.id && c.nickname === nickname),
  )
  const completedReminders = reminders.filter((r) =>
    completions.some((c) => c.reminder_id === r.id && c.nickname === nickname),
  )

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
          {activeTab === 'announcements' ? (
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
                    />
                  )}
                  <AnnouncementList
                    announcements={annList}
                    nickname={nickname}
                    onDelete={handleDeleteAnnouncement}
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
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: '1.5 1 340px', minWidth: 0 }}>
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
                      ✅ Reminders
                    </h2>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--green)' }}>
                      {completions.filter((c) => c.nickname === nickname).length}/{reminders.length}{' '}
                      done
                    </span>
                  </div>
                  <ReminderList
                    reminders={activeReminders}
                    completions={completions}
                    nickname={nickname}
                    onToggle={handleToggle}
                    onResolve={handleResolve}
                    submittingIds={submittingIds}
                  />
                  <div style={{ marginTop: '20px' }}>
                    <AddReminderForm
                      nickname={nickname}
                      onAdd={handleAddReminder}
                      onToast={setToast}
                    />
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <div
                  style={{
                    background: 'var(--card)',
                    borderRadius: '26px',
                    border: '1px solid var(--bd)',
                    boxShadow: '0 22px 46px -32px var(--shadow)',
                    padding: '24px',
                  }}
                >
                  <CompletedReminders
                    completed={completedReminders}
                    nickname={nickname}
                    onUntick={handleUntick}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
