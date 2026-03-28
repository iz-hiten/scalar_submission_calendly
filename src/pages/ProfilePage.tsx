import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { EventType } from '../types';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const ProfilePage: React.FC = () => {
  const { userId = 'default-user' } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'eventTypes'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventType));
      setEventTypes(types);
      setLoading(false);
    }, (error) => {
      console.warn('Error fetching profile event types:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div></div>;

  return (
    <div className="min-h-screen bg-[#f2f2f2] py-12 px-4 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden relative">
        {/* Powered by Calendly Badge */}
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-10">
          <div className="absolute top-4 right-[-30px] bg-gray-600 text-white text-[10px] font-bold py-1 px-10 transform rotate-45 shadow-sm">
            POWERED BY<br/>Calendly
          </div>
        </div>

        <div className="p-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mb-6 flex items-center justify-center text-2xl font-bold text-gray-500">
            H
          </div>
          <h1 className="text-[24px] font-bold text-[#1a1a1a] mb-2">Hiten Mehta</h1>
          <p className="text-gray-600 mb-12 text-center max-w-md">
            Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.
          </p>

          <div className="w-full space-y-4 border-t border-gray-100 pt-12">
            {eventTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => navigate(`/b/${type.slug}`)}
                className="w-full flex items-center justify-between p-6 rounded-xl border border-gray-200 hover:border-[#006BFF] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-8 h-8 rounded-full", type.color || 'bg-[#8247e5]')} />
                  <span className="text-[18px] font-bold text-[#1a1a1a] group-hover:text-[#006BFF] transition-colors">
                    {type.name}
                  </span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#006BFF] transition-colors" />
              </button>
            ))}
            {eventTypes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 italic">No public event types available.</p>
              </div>
            )}
          </div>

          <div className="mt-24 pt-8 border-t border-gray-100 w-full flex justify-start">
            <button className="text-[14px] font-bold text-[#006BFF] hover:underline">Cookie settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};
