import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError, FirestoreOperationType } from '../firebase';
import { Meeting, EventType } from '../types';
import { useOutletContext } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  Search,
  ChevronDown,
  HelpCircle,
  Filter,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { HelpPage } from '../components/HelpSidebar';

export const Meetings: React.FC = () => {
  const { openHelp } = useOutletContext<{ openHelp: (page: HelpPage) => void }>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [eventTypes, setEventTypes] = useState<Record<string, EventType>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Mock user for "No Login Required" requirement
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta' };

  useEffect(() => {
    // Fetch all event types for reference
    const etQuery = query(collection(db, 'eventTypes'));
    const etUnsubscribe = onSnapshot(etQuery, (snapshot) => {
      const types: Record<string, EventType> = {};
      snapshot.docs.forEach(doc => {
        types[doc.id] = { id: doc.id, ...doc.data() } as EventType;
      });
      setEventTypes(types);
    }, (error) => {
      console.warn('Firestore error fetching event types:', error);
    });

    // Fetch all meetings (no userId filter — works for demo mode)
    const mQuery = query(collection(db, 'meetings'));

    const mUnsubscribe = onSnapshot(mQuery, (snapshot) => {
      const mList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting));
      setMeetings(mList);
      setLoading(false);
    }, (error) => {
      console.warn('Firestore error fetching meetings:', error);
      setLoading(false);
    });

    return () => {
      etUnsubscribe();
      mUnsubscribe();
    };
  }, [currentUser.uid]);

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      try {
        await updateDoc(doc(db, 'meetings', id), { status: 'cancelled' });
      } catch (error) {
        handleFirestoreError(error, FirestoreOperationType.UPDATE, `meetings/${id}`);
      }
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const meetingDate = parseISO(m.date);
    const now = new Date();
    const searchMatch = m.inviteeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       m.inviteeEmail.toLowerCase().includes(searchQuery.toLowerCase());
    if (!searchMatch) return false;
    if (filterEventType !== 'all' && m.eventTypeId !== filterEventType) return false;
    if (activeTab === 'Upcoming') return m.status !== 'cancelled' && (isAfter(meetingDate, now) || m.date >= format(now, 'yyyy-MM-dd'));
    if (activeTab === 'Past') return m.status !== 'cancelled' && m.date < format(now, 'yyyy-MM-dd');
    if (activeTab === 'Pending') return false;
    if (activeTab === 'Cancelled') return m.status === 'cancelled';
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const handleExport = () => {
    const rows = [
      ['Name', 'Email', 'Date', 'Start', 'End', 'Event Type', 'Status'],
      ...filteredMeetings.map(m => [
        m.inviteeName, m.inviteeEmail, m.date, m.startTime, m.endTime,
        eventTypes[m.eventTypeId]?.name || 'Meeting', m.status
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'meetings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-[24px] font-bold text-[#1a1a1a]">Meetings</h1>
          <button 
            onClick={() => openHelp('meetings')}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200">
          {['Upcoming', 'Pending', 'Past', 'Cancelled'].map((tab) => (
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
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[14px] text-gray-500">
            <span>Displaying {filteredMeetings.length} of {meetings.length} events</span>
          </div>
          <div className="h-4 w-[1px] bg-gray-300 hidden md:block" />
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 text-[14px] font-bold text-[#006BFF] hover:underline"
            >
              <Filter className="w-4 h-4" />
              Filter {filterEventType !== 'all' && <span className="bg-[#006BFF] text-white text-[10px] rounded-full px-1.5 py-0.5">1</span>}
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30">
                  <p className="px-4 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Event Type</p>
                  <button
                    onClick={() => { setFilterEventType('all'); setShowFilterMenu(false); }}
                    className={cn("w-full px-4 py-2 text-left text-[14px] hover:bg-gray-50", filterEventType === 'all' && "text-[#006BFF] font-bold")}
                  >
                    All event types
                  </button>
                  {Object.values(eventTypes).map(et => (
                    <button
                      key={et.id}
                      onClick={() => { setFilterEventType(et.id); setShowFilterMenu(false); }}
                      className={cn("w-full px-4 py-2 text-left text-[14px] hover:bg-gray-50", filterEventType === et.id && "text-[#006BFF] font-bold")}
                    >
                      {et.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[14px] w-64"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-[14px] font-bold text-[#1a1a1a] hover:bg-gray-50">
            Export
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg border border-gray-200"></div>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1a1a1a]">No {activeTab.toLowerCase()} events</h3>
          <p className="text-gray-500 mt-1">When someone books a meeting, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => {
            const eventType = eventTypes[meeting.eventTypeId];
            const date = parseISO(meeting.date);
            return (
              <div key={meeting.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-[240px] p-4 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-3 h-3 rounded-full", eventType?.color || "bg-[#006BFF]")} />
                      <span className="text-[14px] font-bold text-[#1a1a1a]">{meeting.startTime} - {meeting.endTime}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 font-medium">
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex-1 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[15px] font-bold text-[#1a1a1a] mb-0.5">{meeting.inviteeName}</p>
                        <p className="text-[13px] text-gray-500 font-medium">Event type: <span className="text-[#1a1a1a]">{eventType?.name || 'Meeting'}</span></p>
                      </div>
                    </div>

                  <div className="flex items-center gap-4">
                      <button
                        onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                        className="flex items-center gap-1.5 text-[14px] font-bold text-[#006BFF] hover:underline"
                      >
                        {expandedId === meeting.id ? 'Hide' : 'Details'}
                        <ChevronRight className={cn("w-4 h-4 transition-transform", expandedId === meeting.id && "rotate-90")} />
                      </button>
                      {meeting.status !== 'cancelled' && activeTab === 'Upcoming' && (
                        <button
                          onClick={() => handleCancel(meeting.id)}
                          className="flex items-center gap-1.5 text-[14px] font-bold text-red-500 hover:text-red-700 hover:underline transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                      {meeting.status === 'cancelled' && (
                        <span className="text-[12px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-full">Cancelled</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Expanded details */}
                {expandedId === meeting.id && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 grid grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Invitee Email</p>
                      <p className="text-[#1a1a1a] font-semibold">{meeting.inviteeEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Location</p>
                      <p className="text-[#1a1a1a] font-semibold">{eventType?.location || 'Google Meet'}</p>
                    </div>
                    {(meeting as any).notes && (
                      <div className="col-span-2">
                        <p className="text-gray-400 font-medium mb-0.5">Notes</p>
                        <p className="text-[#1a1a1a]">{(meeting as any).notes}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Booking link</p>
                      <a href={`/b/${eventType?.slug}`} target="_blank" rel="noreferrer"
                        className="text-[#006BFF] hover:underline font-semibold">
                        {window.location.origin}/b/{eventType?.slug}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
