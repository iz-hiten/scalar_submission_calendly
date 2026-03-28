import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, FirestoreOperationType } from '../firebase';
import { Availability, DayAvailability } from '../types';
import { 
  Clock, 
  Globe, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  ChevronDown, 
  Settings,
  MoreVertical,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_AVAILABILITY: Availability = {
  userId: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  days: DAYS.reduce((acc, day) => ({
    ...acc,
    [day]: {
      enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
      slots: [{ start: '09:00', end: '17:00' }]
    }
  }), {})
};

export const AvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('Schedules');
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [listView, setListView] = useState(false);

  // Mock user for "No Login Required" requirement
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta' };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'availability', currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setAvailability(snapshot.data() as Availability);
      } else {
        setAvailability({ ...DEFAULT_AVAILABILITY, userId: currentUser.uid });
      }
      setLoading(false);
    }, (error) => {
      // If not logged in, we might get permission error, but we'll show default
      console.warn('Firestore error, showing default availability:', error);
      setAvailability({ ...DEFAULT_AVAILABILITY, userId: 'default-user' });
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser.uid]);

  const handleSave = async () => {
    if (!availability) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'availability', currentUser.uid), availability);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, `availability/${currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (day: string, updates: Partial<DayAvailability>) => {
    if (!availability) return;
    setAvailability({
      ...availability,
      days: {
        ...availability.days,
        [day]: { ...availability.days[day], ...updates }
      }
    });
  };

  const addSlot = (day: string) => {
    if (!availability) return;
    const dayData = availability.days[day];
    updateDay(day, {
      slots: [...dayData.slots, { start: '09:00', end: '17:00' }]
    });
  };

  const removeSlot = (day: string, index: number) => {
    if (!availability) return;
    const dayData = availability.days[day];
    updateDay(day, {
      slots: dayData.slots.filter((_, i) => i !== index)
    });
  };

  const updateSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    if (!availability) return;
    const dayData = availability.days[day];
    const newSlots = [...dayData.slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    updateDay(day, { slots: newSlots });
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-12 bg-gray-200 rounded-lg w-1/4"></div><div className="h-96 bg-gray-100 rounded-xl"></div></div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-bold text-[#1a1a1a]">Availability</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#006BFF] text-white font-bold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : showSaved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
          </button>
          <button
            onClick={() => addSlot('Monday')}
            title="Add new schedule"
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full border border-gray-300"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200 mb-8">
        {['Schedules', 'Holidays'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-[15px] font-semibold transition-all relative",
              activeTab === tab 
                ? "text-[#1a1a1a] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#006BFF]" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Schedule Settings */}
        <div className="w-full lg:w-72 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#1a1a1a]">Working Hours</h3>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Timezone</p>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors" onClick={() => setShowTimezoneModal(true)}>
                <div className="flex items-center gap-2 text-[14px] text-[#1a1a1a]">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {availability?.timezone}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#1a1a1a]">Active on</h3>
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[14px] text-gray-600">
                <div className="w-2 h-2 rounded-full bg-[#006BFF]" />
                30 Minute Meeting
              </div>
            </div>
          </div>
        </div>

        {/* Main Area - Weekly Schedule */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1a1a1a]">Weekly hours</h2>
            <div className="flex items-center gap-4">
              <button onClick={() => setListView(!listView)} className="text-[14px] font-semibold text-[#006BFF] hover:underline flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {listView ? 'Grid view' : 'List view'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {DAYS.map((day) => {
              const dayData = availability?.days[day] || { enabled: false, slots: [] };
              return (
                <div key={day} className="p-5 flex flex-col sm:flex-row sm:items-start gap-6 hover:bg-gray-50/50 transition-colors">
                  <div className="w-32 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={dayData.enabled}
                      onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                      className="w-5 h-5 text-[#006BFF] border-gray-300 rounded focus:ring-[#006BFF]"
                    />
                    <span className={cn(
                      "text-[14px] font-bold uppercase tracking-wide", 
                      dayData.enabled ? "text-[#1a1a1a]" : "text-gray-400"
                    )}>
                      {day.slice(0, 3)}
                    </span>
                  </div>

                  <div className="flex-1">
                    {!dayData.enabled ? (
                      <span className="text-gray-400 text-[14px]">Unavailable</span>
                    ) : (
                      <div className="space-y-3">
                        {dayData.slots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 group">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(day, index, 'start', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 outline-none w-32"
                            />
                            <span className="text-gray-400">—</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(day, index, 'end', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 outline-none w-32"
                            />
                            <button
                              onClick={() => removeSlot(day, index)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addSlot(day)}
                          className="flex items-center gap-1.5 text-[14px] font-bold text-[#006BFF] hover:text-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add interval
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timezone picker modal */}
      {showTimezoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1a1a1a]">Select Timezone</h3>
              <button onClick={() => setShowTimezoneModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <select
              value={availability?.timezone || ''}
              onChange={(e) => {
                if (availability) setAvailability({ ...availability, timezone: e.target.value });
                setShowTimezoneModal(false);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#006BFF]"
              size={8}
            >
              {Intl.supportedValuesOf('timeZone').map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
