import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, ChevronDown, Info, Check, Copy, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, parse, addMinutes } from 'date-fns';
import { EventType, Availability } from '../types';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface OfferTimeSlotsModalProps {
  eventType: EventType;
  onClose: () => void;
}

function to12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  let cur = parse(start, 'HH:mm', new Date());
  const endTime = parse(end, 'HH:mm', new Date());
  while (cur < endTime) {
    slots.push(format(cur, 'HH:mm'));
    cur = addMinutes(cur, 30);
  }
  return slots;
}

interface DayData {
  date: string;
  displayDate: string;
  allSlots: string[];
  selectedSlots: string[];
}

const DEFAULT_AVAILABILITY: Availability = {
  userId: 'default-user',
  timezone: 'Eastern Time - US & Canada',
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].reduce((acc, day) => ({
    ...acc,
    [day]: {
      enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
      slots: [{ start: '09:00', end: '17:00' }]
    }
  }), {})
};

const OfferTimeSlotsModal: React.FC<OfferTimeSlotsModalProps> = ({ eventType, onClose }) => {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysToOffer, setDaysToOffer] = useState(3);
  const [days, setDays] = useState<DayData[]>([]);
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser || { uid: 'default-user' };

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'availability', currentUser.uid));
        setAvailability(docSnap.exists() ? (docSnap.data() as Availability) : DEFAULT_AVAILABILITY);
      } catch {
        setAvailability(DEFAULT_AVAILABILITY);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [currentUser.uid]);

  useEffect(() => {
    if (!availability) return;
    const result: DayData[] = [];
    let cur = new Date();
    let added = 0;
    while (added < daysToOffer) {
      const dayName = format(cur, 'EEEE');
      const dayConfig = availability.days[dayName];
      if (dayConfig?.enabled) {
        const allSlots = dayConfig.slots.flatMap(s => generateSlots(s.start, s.end));
        result.push({
          date: format(cur, 'yyyy-MM-dd'),
          displayDate: format(cur, 'EEEE, MMMM d'),
          allSlots,
          selectedSlots: [...allSlots],
        });
        added++;
      }
      cur = addDays(cur, 1);
    }
    setDays(result);
  }, [availability, daysToOffer]);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverDate) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverDate(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverDate]);

  const openPopover = (dateKey: string) => {
    const day = days.find(d => d.date === dateKey);
    setTempSelected(day ? [...day.selectedSlots] : []);
    setPopoverDate(dateKey);
  };

  const applyPopover = () => {
    if (!popoverDate) return;
    setDays(prev => prev.map(d =>
      d.date === popoverDate ? { ...d, selectedSlots: [...tempSelected] } : d
    ));
    setPopoverDate(null);
  };

  const deleteDay = (dateKey: string) => {
    setDays(prev => prev.filter(d => d.date !== dateKey));
  };

  const toggleTemp = (slot: string) => {
    setTempSelected(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const currentPopoverDay = popoverDate ? days.find(d => d.date === popoverDate) : null;

  const handleCopy = () => {
    const lines: string[] = [`Proposed times for ${eventType.name}:\n`];
    days.forEach(d => {
      if (d.selectedSlots.length === 0) return;
      lines.push(d.displayDate);
      lines.push(d.selectedSlots.map(to12h).join(', ') + '\n');
    });
    lines.push(`Book here: ${window.location.origin}/b/${eventType.slug}`);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalSelected = days.reduce((sum, d) => sum + d.selectedSlots.length, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-[#1a1a1a]">Offer time slots in email</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">{eventType.duration} min · {eventType.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[72vh] space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Copy time slot suggestions and paste them into an email to share your availability. Your booking page link will also be included.
          </p>

          {/* Offer availability select */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-gray-700">Offer availability</label>
            <div className="relative w-64">
              <select
                value={daysToOffer}
                onChange={e => setDaysToOffer(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#006BFF] cursor-pointer"
              >
                <option value={3}>Next 3 available days</option>
                <option value={5}>Next 5 available days</option>
                <option value={7}>Next 7 available days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Preview box */}
          <div className="border border-[#dce8ff] rounded-xl bg-[#f8faff]">
            {/* Preview header */}
            <div className="px-5 py-4 border-b border-[#dce8ff] flex items-center gap-2">
              <span className="text-[14px] font-bold text-gray-800">Preview</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Timezone */}
              <div>
                <p className="text-[13px] font-bold text-gray-700 mb-2">Displayed time zone</p>
                <button className="flex items-center gap-1.5 text-[#006BFF] text-[14px] font-semibold hover:underline">
                  <Globe className="w-4 h-4" />
                  {availability?.timezone || 'Eastern Time - US & Canada'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Days */}
              {loading ? (
                <div className="py-8 text-center text-gray-400 text-[14px]">Loading availability...</div>
              ) : (
                <div className="space-y-4">
                  {days.map(day => (
                    <div
                      key={day.date}
                      className={cn(
                        "relative rounded-xl p-4 transition-colors",
                        hoveredDay === day.date ? "bg-[#e8f0fe]" : "bg-transparent"
                      )}
                      onMouseEnter={() => setHoveredDay(day.date)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Day header with hover actions */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[15px] font-bold text-gray-900">{day.displayDate}</h3>

                        {/* Edit + Delete — only on hover */}
                        <div className={cn(
                          "flex items-center gap-1 transition-opacity",
                          hoveredDay === day.date ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}>
                          {/* Edit with tooltip */}
                          <div className="relative group/edit">
                            <button
                              onClick={() => openPopover(day.date)}
                              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-[#006BFF] hover:border-[#006BFF] transition-colors shadow-sm"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-[12px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none z-10">
                              Edit times
                              <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
                            </div>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => deleteDay(day.date)}
                            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Time slot pills */}
                      <div className="flex flex-wrap gap-2 relative">
                        {day.selectedSlots.length > 0 ? (
                          day.selectedSlots.map(slot => (
                            <span
                              key={slot}
                              className="px-4 py-2 rounded-xl border border-[#c5d9f7] bg-white text-[13px] font-medium text-gray-800"
                            >
                              {to12h(slot)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[13px] text-gray-400 italic">No times selected</span>
                        )}

                        {/* Popover */}
                        <AnimatePresence>
                          {popoverDate === day.date && currentPopoverDay && (
                            <motion.div
                              ref={popoverRef}
                              initial={{ opacity: 0, y: 6, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 6, scale: 0.97 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 top-full mt-2 z-50 w-[260px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                            >
                              <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-[14px] font-bold text-gray-900">Available times</p>
                              </div>
                              <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-[13px]">
                                <button
                                  onClick={() => setTempSelected([...currentPopoverDay.allSlots])}
                                  className="text-[#006BFF] font-semibold hover:underline"
                                >
                                  select all
                                </button>
                                <span className="text-gray-400">/</span>
                                <button
                                  onClick={() => setTempSelected([])}
                                  className="text-[#006BFF] font-semibold hover:underline"
                                >
                                  clear
                                </button>
                              </div>
                              <div className="max-h-[220px] overflow-y-auto">
                                {currentPopoverDay.allSlots.map(slot => {
                                  const checked = tempSelected.includes(slot);
                                  return (
                                    <label
                                      key={slot}
                                      className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-[14px]",
                                        checked ? "bg-[#eef5ff]" : "hover:bg-gray-50"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                        checked ? "bg-[#006BFF] border-[#006BFF]" : "border-gray-300 bg-white"
                                      )}>
                                        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={checked}
                                        onChange={() => toggleTemp(slot)}
                                      />
                                      <span className="text-gray-800">{to12h(slot)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
                                <button
                                  onClick={() => setPopoverDate(null)}
                                  className="flex-1 py-2 rounded-full border border-gray-300 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={applyPopover}
                                  className="flex-1 py-2 rounded-full bg-[#006BFF] text-white text-[13px] font-bold hover:bg-blue-700 transition-colors"
                                >
                                  Done
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}

                  {days.length === 0 && (
                    <p className="text-[14px] text-gray-400 italic text-center py-6">All days removed. Change the dropdown to reload.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleCopy}
            disabled={totalSelected === 0}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all text-[14px]",
              totalSelected > 0
                ? "bg-[#006BFF] text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy to clipboard</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OfferTimeSlotsModal;
