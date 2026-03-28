import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, FirestoreOperationType } from '../firebase';
import { EventType, Availability, Meeting } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Globe, 
  CheckCircle, 
  ChevronLeft, 
  ArrowRight,
  Video,
  ChevronRight,
  ChevronDown,
  Settings
} from 'lucide-react';
import { format, addMinutes, parse, isSameDay, parseISO, isBefore, startOfToday } from 'date-fns';
import { Calendar } from '../components/Calendar';
import { cn } from '../lib/utils';

const DEFAULT_AVAILABILITY: Availability = {
  userId: 'default-user',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].reduce((acc, day) => ({
    ...acc,
    [day]: {
      enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
      slots: [{ start: '09:00', end: '17:00' }]
    }
  }), {})
};

export const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'date' | 'form' | 'success'>('date');
  const [formData, setFormData] = useState({ name: '', email: '', notes: '', guests: '' });
  const [showGuests, setShowGuests] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  // Fetch already-booked slots for the selected date whenever it changes
  useEffect(() => {
    if (!eventType) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const q = query(
      collection(db, 'meetings'),
      where('userId', '==', eventType.userId),
      where('date', '==', dateStr)
    );
    getDocs(q).then(snap => {
      const taken = new Set<string>();
      snap.docs.forEach(d => {
        if (d.data().status !== 'cancelled') {
          taken.add(d.data().startTime as string);
        }
      });
      setBookedSlots(taken);
    }).catch(() => {});
  }, [selectedDate, eventType]);

  useEffect(() => {
    const q = query(collection(db, 'eventTypes'), where('slug', '==', slug));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const et = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EventType;
        setEventType(et);

        // Fetch availability for the user
        const avDoc = doc(db, 'availability', et.userId);
        getDoc(avDoc).then(avSnap => {
          if (avSnap.exists()) {
            setAvailability(avSnap.data() as Availability);
          } else {
            setAvailability({ ...DEFAULT_AVAILABILITY, userId: et.userId });
          }
          setLoading(false);
        });
      } else {
        // Sample data for demo if not found
        if (slug === '30min' || slug === '30-minute-meeting') {
          setEventType({
            id: 'sample-1',
            name: '30 Minute Meeting',
            duration: 30,
            slug: slug,
            location: 'Google Meet',
            color: 'bg-[#8247e5]',
            userId: 'default-user',
            description: 'A quick 30-minute sync to discuss the project status and next steps.'
          });
          setAvailability({ ...DEFAULT_AVAILABILITY, userId: 'default-user' });
        }
        setLoading(false);
      }
    }, (error) => {
      console.warn('Firestore error fetching booking page:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [slug]);

  const generateTimeSlots = () => {
    if (!availability || !eventType) return [];
    const dayName = format(selectedDate, 'EEEE');
    const dayData = availability.days[dayName];
    if (!dayData || !dayData.enabled) return [];

    const slots: string[] = [];
    const now = new Date();

    dayData.slots.forEach(interval => {
      let current = parse(interval.start, 'HH:mm', selectedDate);
      const end = parse(interval.end, 'HH:mm', selectedDate);

      while (isBefore(current, end)) {
        // Only show future slots if today, and exclude already-booked slots
        if ((!isSameDay(selectedDate, now) || isBefore(now, current)) && !bookedSlots.has(format(current, 'HH:mm'))) {
          slots.push(format(current, 'HH:mm'));
        }
        current = addMinutes(current, eventType.duration);
      }
    });

    return slots;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType || !confirmedTime) return;
    setBookingLoading(true);

    try {
      const startTime = confirmedTime;
      const endTime = format(addMinutes(parse(startTime, 'HH:mm', selectedDate), eventType.duration), 'HH:mm');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // ── Double-booking prevention ──────────────────────────────
      const conflictQuery = query(
        collection(db, 'meetings'),
        where('userId', '==', eventType.userId),
        where('date', '==', dateStr),
        where('startTime', '==', startTime)
      );
      const conflictSnap = await getDocs(conflictQuery);
      const hasConflict = conflictSnap.docs.some(d => d.data().status !== 'cancelled');
      if (hasConflict) {
        alert('Sorry, this time slot was just booked by someone else. Please choose a different time.');
        setBookingLoading(false);
        setStep('date');
        setSelectedTime(null);
        setConfirmedTime(null);
        return;
      }
      // ──────────────────────────────────────────────────────────

      await addDoc(collection(db, 'meetings'), {
        eventTypeId: eventType.id,
        userId: eventType.userId,
        date: dateStr,
        startTime,
        endTime,
        inviteeName: formData.name,
        inviteeEmail: formData.email,
        notes: formData.notes,
        guests: formData.guests,
        status: 'upcoming',
        createdAt: new Date().toISOString()
      });

      setStep('success');
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.CREATE, 'meetings');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div></div>;
  if (!eventType) return <div className="flex items-center justify-center min-h-screen text-xl font-bold">Event type not found</div>;

  return (
    <div className="min-h-screen bg-[#f2f2f2] py-12 px-4 flex items-center justify-center">
      <div className={cn(
        "bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row transition-all duration-500 relative",
        step === 'success' ? "max-w-2xl w-full" : "max-w-5xl w-full"
      )}>
        {/* Powered by Calendly Badge */}
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-10">
          <div className="absolute top-4 right-[-30px] bg-gray-600 text-white text-[10px] font-bold py-1 px-10 transform rotate-45 shadow-sm">
            POWERED BY<br/>Calendly
          </div>
        </div>

        {/* Left Side: Event Details */}
        <div className={cn(
          "md:w-[360px] p-8 border-b md:border-b-0 md:border-r border-gray-200 bg-white",
          step === 'success' && "hidden"
        )}>
          <div className="flex flex-col items-start h-full">
            <button 
              onClick={() => step === 'form' ? setStep('date') : navigate(-1)} 
              className="mb-6 p-2 -ml-2 hover:bg-gray-100 rounded-full text-[#006BFF] border border-gray-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <p className="text-[16px] font-bold text-gray-500 mb-1">Hiten Mehta</p>
            <h2 className="text-[28px] font-bold text-[#1a1a1a] mb-6 leading-tight">{eventType.name}</h2>
            
            <div className="space-y-4 text-gray-600 mb-8 w-full">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-[15px] font-bold">{eventType.duration} min</span>
              </div>
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-gray-400" />
                <span className="text-[15px] font-bold">Web conferencing details provided upon confirmation.</span>
              </div>
              
              {confirmedTime && (
                <div className="flex items-start gap-3 text-gray-600">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-[15px] font-bold">
                    {confirmedTime} - {format(addMinutes(parse(confirmedTime, 'HH:mm', selectedDate), eventType.duration), 'HH:mm')}, {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-[15px] font-bold">{availability?.timezone || 'India Standard Time'}</span>
              </div>
            </div>

            {eventType.description && (
              <p className="text-[14px] text-gray-600 leading-relaxed mb-8">
                {eventType.description}
              </p>
            )}

            <div className="mt-auto pt-8 flex gap-4 text-[13px] font-bold text-[#006BFF]">
              <button className="hover:underline">Cookie settings</button>
              <button className="hover:underline">Privacy Policy</button>
            </div>
          </div>
        </div>

        {/* Right Side: Booking Content */}
        <div className="flex-1 bg-white">
          {step === 'date' && (
            <div className="p-8 flex flex-col lg:flex-row gap-8 min-h-[500px]">
              <div className="flex-1">
                <h3 className="text-[22px] font-bold text-[#1a1a1a] mb-8">Select a Date & Time</h3>
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  availableDays={Object.keys(availability?.days || {}).filter(d => availability?.days[d].enabled)}
                />
                <div className="mt-12">
                  <p className="text-[14px] font-bold text-[#1a1a1a] mb-2">Time zone</p>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-[#1a1a1a] cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-lg inline-flex">
                    <Globe className="w-4 h-4 text-[#006BFF]" />
                    {availability?.timezone || 'India Standard Time'} ({format(new Date(), 'h:mma').toLowerCase()})
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="mt-8">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-[14px] font-bold text-[#1a1a1a] hover:bg-gray-50">
                    <Settings className="w-4 h-4" />
                    Troubleshoot
                  </button>
                </div>
              </div>

              {selectedDate && (
                <div className="w-full lg:w-[300px] animate-in slide-in-from-right-4 duration-300">
                  <h4 className="text-[16px] font-bold text-gray-600 mb-6 text-center lg:text-left">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </h4>
                  <div className="max-h-[450px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                    {generateTimeSlots().map(time => (
                      <div key={time} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "flex-1 py-4 px-4 font-bold border rounded-lg transition-all text-[16px]",
                              selectedTime === time 
                                ? "bg-gray-600 text-white border-gray-600" 
                                : "text-[#006BFF] border-[#006BFF] hover:bg-[#E1EFFF] hover:border-[#006BFF]"
                            )}
                          >
                            {time}
                          </button>
                          {selectedTime === time && (
                            <button
                              onClick={() => {
                                setConfirmedTime(time);
                                setStep('form');
                              }}
                              className="px-8 bg-[#006BFF] text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-[16px] shadow-md"
                            >
                              Next
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {generateTimeSlots().length === 0 && (
                      <p className="text-gray-400 text-[14px] italic py-8 text-center">No slots available for this day</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'form' && (
            <div className="p-8 max-w-2xl mx-auto">
              <h3 className="text-[22px] font-bold text-[#1a1a1a] mb-8">Enter Details</h3>
              <form onSubmit={handleBooking} className="space-y-6">
                <div>
                  <label className="block text-[14px] font-bold text-[#1a1a1a] mb-2">Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006BFF] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#1a1a1a] mb-2">Email *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006BFF] focus:border-transparent outline-none transition-all"
                  />
                </div>

                {!showGuests ? (
                  <button 
                    type="button"
                    onClick={() => setShowGuests(true)}
                    className="px-4 py-2 border border-[#006BFF] text-[#006BFF] font-bold rounded-full text-[14px] hover:bg-[#F2F8FF]"
                  >
                    Add Guests
                  </button>
                ) : (
                  <div>
                    <label className="block text-[14px] font-bold text-[#1a1a1a] mb-2">Guest Emails</label>
                    <textarea
                      placeholder="Enter guest emails separated by commas"
                      value={formData.guests}
                      onChange={e => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006BFF] focus:border-transparent outline-none transition-all min-h-[80px]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[14px] font-bold text-[#1a1a1a] mb-2">Please share anything that will help prepare for our meeting.</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006BFF] focus:border-transparent outline-none transition-all min-h-[120px]"
                  />
                </div>

                <p className="text-[13px] text-gray-600 leading-relaxed">
                  By proceeding, you confirm that you have read and agree to <button type="button" className="text-[#006BFF] hover:underline">Calendly's Terms of Use</button> and <button type="button" className="text-[#006BFF] hover:underline">Privacy Notice</button>.
                </p>

                <div className="pt-4">
                  <button
                    disabled={bookingLoading}
                    type="submit"
                    className="px-8 py-3 bg-[#006BFF] text-white font-bold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
                  >
                    {bookingLoading ? 'Scheduling...' : 'Schedule Event'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="p-12 flex flex-col items-center text-center bg-white min-h-[600px] justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <CheckCircle className="text-green-500 w-10 h-10" />
              </div>
              <h3 className="text-[28px] font-bold text-[#1a1a1a] mb-2">Confirmed</h3>
              <p className="text-gray-600 mb-12 text-[16px]">You are scheduled with Hiten Mehta.</p>
              
              <div className="w-full max-w-md space-y-6 text-left border border-gray-100 rounded-xl p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={cn("w-5 h-5 rounded-full mt-1 shrink-0", eventType.color)} />
                  <p className="text-[18px] font-bold text-[#1a1a1a]">{eventType.name}</p>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <CalendarIcon className="w-6 h-6 text-gray-400 shrink-0" />
                  <span className="text-[16px] font-bold">
                    {confirmedTime} - {format(addMinutes(parse(confirmedTime || '00:00', 'HH:mm', selectedDate), eventType.duration), 'HH:mm')}, {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <Globe className="w-6 h-6 text-gray-400 shrink-0" />
                  <span className="text-[16px] font-bold">{availability?.timezone || 'India Standard Time'}</span>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <Video className="w-6 h-6 text-gray-400 shrink-0" />
                  <span className="text-[16px] font-bold">{eventType.location || 'Google Meet'}</span>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 w-full max-w-md">
                <p className="text-[15px] text-gray-600">
                  A calendar invitation has been sent to your email address.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
