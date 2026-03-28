import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Video, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Plus,
  MessageSquare,
  User,
  Mail,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, isToday, parseISO } from 'date-fns';
import { EventType, Meeting } from '../types';
import { auth, db, handleFirestoreError, FirestoreOperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface BookMeetingModalProps {
  eventType: EventType;
  onClose: () => void;
}

const BookMeetingModal: React.FC<BookMeetingModalProps> = ({ eventType, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta', email: 'hiten@example.com' };

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleBookMeeting = async () => {
    if (!selectedDate || !selectedTime || !inviteeName || !inviteeEmail) {
      alert('Please fill in all required fields and select a time.');
      return;
    }

    setLoading(true);
    try {
      const startTime = selectedTime;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(hours);
      endDateTime.setMinutes(minutes + eventType.duration);
      const endTime = format(endDateTime, 'HH:mm');

      const meetingData: Omit<Meeting, 'id'> = {
        eventTypeId: eventType.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        inviteeName,
        inviteeEmail,
        status: 'upcoming',
        userId: currentUser.uid,
      };

      await addDoc(collection(db, 'meetings'), {
        ...meetingData,
        createdAt: new Date().toISOString(),
        notes
      });

      onClose();
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.CREATE, 'meetings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] h-[90vh] flex overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Sidebar */}
        <div className="w-[400px] border-r border-gray-200 flex flex-col overflow-y-auto bg-white">
          <div className="p-8 space-y-8">
            <div>
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">Meeting Details</p>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[24px] font-bold text-[#1a1a1a]">{eventType.name}</h2>
                <button className="p-1 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span className="text-[15px] font-medium">{eventType.duration} min</span>
                  <ChevronLeft className="w-4 h-4 rotate-270" />
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Video className="w-5 h-5" />
                  <span className="text-[15px] font-medium">{eventType.location || 'Google Meet web conference'}</span>
                  <ChevronLeft className="w-4 h-4 rotate-270" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <p className="text-[14px] font-bold text-gray-700 mb-3">Hosts</p>
              <div className="bg-[#f2f8ff] rounded-xl p-3 flex items-center justify-between border border-[#e1efff]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#006BFF] rounded-full flex items-center justify-center text-white text-[12px] font-bold">
                    {currentUser.displayName?.[0] || 'H'}
                  </div>
                  <span className="text-[14px] font-semibold text-[#1a1a1a]">{currentUser.displayName} (you)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-[12px]">
                  <Globe className="w-3 h-3" />
                  <span>EDT</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <p className="text-[14px] font-bold text-gray-700">Invitee details</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Name</label>
                  <input 
                    type="text" 
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#006BFF] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#006BFF] focus:border-transparent transition-all"
                  />
                </div>
                <button className="text-[#006BFF] text-[14px] font-bold flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Add guests
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Contact questions</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#006BFF] focus:border-transparent transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={handleBookMeeting}
                disabled={loading}
                className="w-full py-3.5 bg-[#006BFF] text-white font-bold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Book meeting'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[22px] font-bold text-[#1a1a1a]">Select a time to book</h2>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                <CalendarIcon className="w-4 h-4" /> Override available times
              </button>
            </div>

            <div className="flex items-center gap-2 text-[#006BFF] text-[14px] font-medium mb-8">
              <Globe className="w-4 h-4" />
              <span>Time zone display: <span className="font-bold underline cursor-pointer">Eastern Time - US & Canada (10:41am)</span></span>
              <ChevronLeft className="w-4 h-4 rotate-270" />
            </div>

            <div className="flex gap-12">
              {/* Calendar */}
              <div className="w-[350px]">
                <div className="flex items-center justify-center gap-8 mb-6">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-[16px] font-bold text-gray-700">{format(currentMonth, 'MMMM yyyy')}</h3>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-[#eef5ff] text-[#006BFF] rounded-full">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {daysInMonth.map((day, idx) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isPast = day < new Date() && !isToday(day);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        disabled={!isCurrentMonth || isPast}
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-[14px] font-medium transition-all relative",
                          !isCurrentMonth && "text-transparent pointer-events-none",
                          isPast && isCurrentMonth && "text-gray-300 cursor-not-allowed",
                          isCurrentMonth && !isPast && !isSelected && "text-[#006BFF] hover:bg-[#eef5ff]",
                          isSelected && "bg-[#006BFF] text-white font-bold",
                          isToday(day) && !isSelected && "after:content-[''] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-gray-900 after:rounded-full"
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="flex-1">
                {selectedDate ? (
                  <div className="space-y-4">
                    <h4 className="text-[16px] font-bold text-gray-700 mb-6">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </h4>
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "w-full py-3 rounded-lg border text-[15px] font-bold transition-all",
                            selectedTime === time 
                              ? "bg-[#006BFF] border-[#006BFF] text-white" 
                              : "border-[#006BFF] text-[#006BFF] hover:bg-[#eef5ff]"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-[15px]">
                    Select a date to book
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Bubble Icon */}
        <div className="absolute bottom-6 right-6">
          <div className="w-12 h-12 bg-[#006BFF] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookMeetingModal;
