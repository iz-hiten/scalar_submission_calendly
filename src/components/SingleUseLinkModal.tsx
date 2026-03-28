import React, { useState, useEffect } from 'react';
import { X, Search, Plus, ChevronDown, ChevronUp, Clock, MapPin, RefreshCw, User, ExternalLink, Link2, Share2, Info, XCircle, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, parse, addMinutes } from 'date-fns';
import { EventType, Availability, SingleUseLink } from '../types';
import { auth, db, handleFirestoreError, FirestoreOperationType } from '../firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface SingleUseLinkModalProps {
  eventType: EventType;
  onClose: () => void;
  onShare?: (link: SingleUseLink) => void;
}

const DAYS_SHORT: Record<string, string> = {
  Sunday: 'S', Monday: 'M', Tuesday: 'T', Wednesday: 'W',
  Thursday: 'T', Friday: 'F', Saturday: 'S',
};
const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];
const LOCATION_OPTIONS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Phone Call', 'In Person'];
const DAYS_AHEAD_OPTIONS = [7, 14, 30, 60, 90];
const NOTICE_OPTIONS = ['30 minutes', '1 hour', '2 hours', '4 hours', '1 day'];

function to12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
}

function generateSlug(): string {
  return `sul-${Math.random().toString(36).substr(2, 8)}`;
}

interface DaySlot { start: string; end: string; }
interface DayConfig { enabled: boolean; slots: DaySlot[]; }
type WeeklyHours = Record<string, DayConfig>;

// Accordion section wrapper
const Section: React.FC<{ title: string; summary?: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, summary, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="text-left">
          <p className="text-[15px] font-bold text-[#0f1f3d]">{title}</p>
          {!open && summary && <p className="text-[13px] text-gray-500 mt-0.5">{summary}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SingleUseLinkModal: React.FC<SingleUseLinkModalProps> = ({ eventType, onClose, onShare }) => {
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta' };
  const displayName = currentUser.displayName || 'Hiten Mehta';

  // Form state — pre-filled from eventType
  const [duration, setDuration] = useState(eventType.duration);
  const [location, setLocation] = useState(eventType.location || 'Google Meet');
  const [contactSearch, setContactSearch] = useState('');
  const [daysAhead, setDaysAhead] = useState(60);
  const [noticeTime, setNoticeTime] = useState('4 hours');
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>({});
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saving, setSaving] = useState(false);

  // Load user's availability from Firestore
  useEffect(() => {
    getDoc(doc(db, 'availability', currentUser.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as Availability;
        setTimezone(data.timezone || timezone);
        // Build weeklyHours from availability
        const wh: WeeklyHours = {};
        ALL_DAYS.forEach(day => {
          const d = data.days[day];
          wh[day] = d ? { enabled: d.enabled, slots: d.slots.map(s => ({ start: s.start, end: s.end })) }
                      : { enabled: false, slots: [{ start: '09:00', end: '17:00' }] };
        });
        setWeeklyHours(wh);
      } else {
        // Default weekdays 9-5
        const wh: WeeklyHours = {};
        ALL_DAYS.forEach(day => {
          wh[day] = {
            enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
            slots: [{ start: '09:00', end: '17:00' }],
          };
        });
        setWeeklyHours(wh);
      }
      setAvailabilityLoaded(true);
    }).catch(() => {
      const wh: WeeklyHours = {};
      ALL_DAYS.forEach(day => {
        wh[day] = {
          enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
          slots: [{ start: '09:00', end: '17:00' }],
        };
      });
      setWeeklyHours(wh);
      setAvailabilityLoaded(true);
    });
  }, [currentUser.uid]);

  const updateSlot = (day: string, idx: number, field: 'start' | 'end', val: string) => {
    setWeeklyHours(prev => {
      const slots = [...prev[day].slots];
      slots[idx] = { ...slots[idx], [field]: val };
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const addSlot = (day: string) => {
    setWeeklyHours((prev: WeeklyHours) => {
      const cur = prev[day];
      // If day was disabled (no active slots), just enable with one default slot
      if (!cur.enabled) {
        return { ...prev, [day]: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] } };
      }
      // Otherwise append a new slot
      return { ...prev, [day]: { ...cur, slots: [...cur.slots, { start: '09:00', end: '17:00' }] } };
    });
  };

  const removeSlot = (day: string, idx: number) => {
    setWeeklyHours(prev => {
      const slots = prev[day].slots.filter((_, i) => i !== idx);
      return { ...prev, [day]: { ...prev[day], slots, enabled: slots.length > 0 } };
    });
  };

  const toggleDay = (day: string) => {
    setWeeklyHours(prev => {
      const cur = prev[day];
      if (cur.enabled) {
        return { ...prev, [day]: { ...cur, enabled: false } };
      }
      return { ...prev, [day]: { ...cur, enabled: true, slots: cur.slots.length ? cur.slots : [{ start: '09:00', end: '17:00' }] } };
    });
  };

  // Availability summary for collapsed view
  const availabilitySummary = (() => {
    const enabledDays = ALL_DAYS.filter(d => weeklyHours[d]?.enabled);
    if (!enabledDays.length) return 'No availability set';
    const allSame = enabledDays.every(d => {
      const s = weeklyHours[d]?.slots[0];
      return s?.start === weeklyHours[enabledDays[0]]?.slots[0]?.start && s?.end === weeklyHours[enabledDays[0]]?.slots[0]?.end;
    });
    if (allSame && enabledDays.length === 5 && !weeklyHours['Saturday']?.enabled && !weeklyHours['Sunday']?.enabled) {
      const s = weeklyHours[enabledDays[0]]?.slots[0];
      return `Weekdays, ${to12h(s.start)} - ${to12h(s.end)}`;
    }
    return `${enabledDays.map(d => d.slice(0, 3)).join(', ')}`;
  })();

  const createLink = async (andShare = false): Promise<SingleUseLink | null> => {
    setSaving(true);
    try {
      const slug = generateSlug();
      const linkData = {
        name: eventType.name,
        duration,
        slug,
        expiresAt: addDays(new Date(), daysAhead).toISOString(),
        isUsed: false,
        userId: currentUser.uid,
        eventTypeId: eventType.id,
        location,
        weeklyHours,
        timezone,
        noticeTime,
        contactSearch: contactSearch || null,
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, 'singleUseLinks'), linkData);
      return { id: ref.id, name: linkData.name, duration, slug, expiresAt: linkData.expiresAt, isUsed: false, userId: currentUser.uid };
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.CREATE, 'singleUseLinks');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndCopy = async () => {
    const link = await createLink();
    if (link) {
      navigator.clipboard.writeText(`${window.location.origin}/b/${link.slug}`);
      onClose();
    }
  };

  const handleShare = async () => {
    const link = await createLink(true);
    if (link) {
      onShare?.(link);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:justify-end bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="bg-white h-full sm:h-screen w-full sm:w-[480px] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[12px] font-bold text-[#006BFF] uppercase tracking-wider mb-1">Single-use link</p>
              <button
                onClick={() => window.open(`${window.location.origin}/b/${eventType.slug}`, '_blank')}
                className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-[#006BFF] transition-colors mb-3"
              >
                {eventType.name} <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2">
                <div className={cn('w-5 h-5 rounded-full shrink-0', eventType.color || 'bg-[#8247e5]')} />
                <h2 className="text-[22px] font-bold text-[#0f1f3d]">{eventType.name}</h2>
              </div>
              <p className="text-[13px] text-gray-500 mt-0.5 ml-7">One-on-One</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors mt-0.5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-5">
            {/* Info banner */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#eef5ff] border border-[#c5d9f7] rounded-xl">
              <Info className="w-4 h-4 text-[#006BFF] shrink-0" />
              <span className="text-[13px] text-[#0f1f3d] font-medium">Changes here will not affect the event type</span>
            </div>

            {/* Add a contact */}
            <div>
              <h3 className="text-[15px] font-bold text-[#0f1f3d] mb-0.5">
                Add a contact <span className="font-normal text-gray-400">(optional)</span>
              </h3>
              <p className="text-[13px] text-gray-500 mb-3">Pre-fill your booking page with a contact's information</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Type name or email address..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#006BFF] focus:border-transparent transition-all"
                />
              </div>
              <button className="mt-2 flex items-center gap-1.5 text-[13px] font-bold text-[#006BFF] hover:underline">
                <Plus className="w-4 h-4" /> Create new contact
              </button>
            </div>

            {/* Customize meeting details */}
            <div>
              <h3 className="text-[15px] font-bold text-[#0f1f3d] mb-3">
                Customize meeting details <span className="font-normal text-gray-400">(optional)</span>
              </h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {/* Duration */}
                <Section
                  title="Duration"
                  summary={`${duration} min`}
                  defaultOpen={true}
                >
                  <div className="relative">
                    <select
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-medium text-[#0f1f3d] outline-none focus:ring-2 focus:ring-[#006BFF] cursor-pointer bg-white"
                    >
                      {DURATION_OPTIONS.map(d => (
                        <option key={d} value={d}>{d} min</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#006BFF] pointer-events-none" />
                  </div>
                  <button className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-[#006BFF] hover:underline">
                    <Plus className="w-4 h-4" /> Add duration option <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </Section>

                {/* Location */}
                <Section
                  title="Location"
                  summary={location || 'None'}
                  defaultOpen={false}
                >
                  {location ? (
                    <>
                      <div className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {location === 'Google Meet' && (
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                              <path d="M29 24L35.5 18.5V29.5L29 24Z" fill="#00832D"/>
                              <rect x="6" y="16" width="23" height="16" rx="2" fill="#0066DA"/>
                              <path d="M29 24L35.5 29.5H29V24Z" fill="#E94235"/>
                            </svg>
                          )}
                          <span className="text-[14px] font-medium text-[#0f1f3d]">{location}</span>
                        </div>
                        <button onClick={() => setLocation('')} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[13px] text-gray-500 mb-3">Conferencing details provided after booking completion.</p>
                    </>
                  ) : (
                    <div className="mb-3">
                      <p className="text-[13px] text-gray-500 mb-2">No location set. Choose one:</p>
                      <div className="flex flex-wrap gap-2">
                        {LOCATION_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setLocation(opt)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:border-[#006BFF] hover:text-[#006BFF] transition-colors"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[13px] text-gray-600 mb-2">Let your invitee choose from multiple meeting locations.</p>
                    <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#006BFF] hover:underline">
                      <Plus className="w-4 h-4" /> Add location
                    </button>
                  </div>
                </Section>

                {/* Availability */}
                <Section
                  title="Availability"
                  summary={availabilitySummary}
                  defaultOpen={false}
                >
                  {/* Date range */}
                  <div className="mb-5">
                    <p className="text-[13px] font-bold text-[#0f1f3d] mb-1">Date-range</p>
                    <p className="text-[13px] text-gray-700 leading-relaxed">
                      Invitees can schedule{' '}
                      <select
                        value={daysAhead}
                        onChange={e => setDaysAhead(Number(e.target.value))}
                        className="inline appearance-none text-[#006BFF] font-bold bg-transparent border-0 outline-none cursor-pointer underline"
                      >
                        {DAYS_AHEAD_OPTIONS.map(d => <option key={d} value={d}>{d} days</option>)}
                      </select>
                      {' '}into the future with at least{' '}
                      <select
                        value={noticeTime}
                        onChange={e => setNoticeTime(e.target.value)}
                        className="inline appearance-none text-[#006BFF] font-bold bg-transparent border-0 outline-none cursor-pointer underline"
                      >
                        {NOTICE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      {' '}notice
                    </p>
                  </div>

                  {/* Weekly hours */}
                  <div className="mb-2">
                    <p className="text-[13px] font-bold text-[#0f1f3d] mb-0.5">Schedule: Custom</p>
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-gray-500" />
                      <span className="text-[13px] font-semibold text-gray-700">Weekly hours</span>
                    </div>
                    <p className="text-[12px] text-gray-500 mb-4">Set times that hosts can be scheduled for this event.</p>
                  </div>

                  {!availabilityLoaded ? (
                    <div className="py-4 text-center text-gray-400 text-[13px]">Loading...</div>
                  ) : (
                    <div className="space-y-3">
                      {ALL_DAYS.map(day => {
                        const cfg = weeklyHours[day] || { enabled: false, slots: [] };
                        return (
                          <div key={day}>
                            {cfg.enabled ? (
                              cfg.slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2 mb-2">
                                  {idx === 0 ? (
                                    <button
                                      onClick={() => toggleDay(day)}
                                      className="w-8 h-8 rounded-full bg-[#0f1f3d] text-white text-[12px] font-bold flex items-center justify-center shrink-0 hover:bg-[#1a3060] transition-colors"
                                    >
                                      {DAYS_SHORT[day]}
                                    </button>
                                  ) : (
                                    <div className="w-8 h-8 shrink-0" />
                                  )}
                                  <div className="flex items-center gap-2 flex-1">
                                    <select
                                      value={slot.start}
                                      onChange={e => updateSlot(day, idx, 'start', e.target.value)}
                                      className="flex-1 bg-gray-100 border-0 rounded-lg px-3 py-2 text-[13px] font-medium text-[#0f1f3d] outline-none focus:ring-2 focus:ring-[#006BFF] cursor-pointer appearance-none"
                                    >
                                      {generateTimeOptions().map(t => <option key={t} value={t}>{to12h(t)}</option>)}
                                    </select>
                                    <span className="text-gray-400 text-[13px]">-</span>
                                    <select
                                      value={slot.end}
                                      onChange={e => updateSlot(day, idx, 'end', e.target.value)}
                                      className="flex-1 bg-gray-100 border-0 rounded-lg px-3 py-2 text-[13px] font-medium text-[#0f1f3d] outline-none focus:ring-2 focus:ring-[#006BFF] cursor-pointer appearance-none"
                                    >
                                      {generateTimeOptions().map(t => <option key={t} value={t}>{to12h(t)}</option>)}
                                    </select>
                                    <button onClick={() => removeSlot(day, idx)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                      <X className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => addSlot(day)} className="text-gray-400 hover:text-[#006BFF] transition-colors">
                                      <PlusCircle className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleDay(day)}
                                  className="w-8 h-8 rounded-full bg-gray-300 text-white text-[12px] font-bold flex items-center justify-center shrink-0 hover:bg-gray-400 transition-colors"
                                >
                                  {DAYS_SHORT[day]}
                                </button>
                                <span className="text-[13px] text-gray-400">Unavailable</span>
                                <button onClick={() => addSlot(day)} className="text-gray-400 hover:text-[#006BFF] transition-colors ml-1">
                                  <PlusCircle className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Timezone */}
                  <button className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-[#006BFF] hover:underline">
                    {timezone} <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Date-specific hours */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f1f3d]">Date-specific hours</p>
                        <p className="text-[12px] text-gray-500">Adjust hours for specific days</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-[13px] font-bold text-[#0f1f3d] hover:bg-gray-50 transition-colors">
                      <Plus className="w-4 h-4" /> Hours
                    </button>
                  </div>
                </Section>

                {/* Host */}
                <Section
                  title="Host"
                  summary={`${displayName} (you)`}
                  defaultOpen={false}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-bold text-gray-600 shrink-0">
                      {displayName[0]}
                    </div>
                    <span className="text-[14px] text-gray-700">{displayName} (you)</span>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0 bg-white">
          <button
            onClick={handleCreateAndCopy}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 rounded-full text-[14px] font-bold text-[#0f1f3d] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Link2 className="w-4 h-4" />
            {saving ? 'Creating...' : 'Create & copy link'}
          </button>
          <button
            onClick={handleShare}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#006BFF] text-white rounded-full text-[14px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Generate 30-min time options for the whole day
function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return times;
}

export default SingleUseLinkModal;
