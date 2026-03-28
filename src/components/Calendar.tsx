import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval, isToday, isBefore, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  availableDays: string[];
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, availableDays }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const isDayAvailable = (day: Date) => {
    const dayName = format(day, 'EEEE');
    // Check if day is before today
    if (isBefore(day, startOfToday())) return false;
    return availableDays.includes(dayName);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[16px] font-bold text-[#1a1a1a]">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-[#F2F2F2] rounded-full transition-colors text-[#006BFF]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-[#F2F2F2] rounded-full transition-colors text-[#006BFF]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-400 py-2 tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const available = isDayAvailable(day);
          const selected = isSameDay(day, selectedDate);
          const currentMonthDay = isSameMonth(day, monthStart);

          return (
            <button
              key={i}
              disabled={!available}
              onClick={() => onDateSelect(day)}
              className={cn(
                "h-11 w-full flex items-center justify-center rounded-full text-[14px] font-bold transition-all relative",
                !currentMonthDay && "text-gray-300",
                available && currentMonthDay && !selected && "text-[#006BFF] bg-[#F2F8FF] hover:bg-[#E1EFFF]",
                selected && "bg-[#006BFF] text-white hover:bg-blue-700",
                !available && "text-gray-400 cursor-not-allowed",
                isToday(day) && !selected && "after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-[#006BFF] after:rounded-full"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
