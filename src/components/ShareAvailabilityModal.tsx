import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, AlertTriangle, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Undo2, Redo2 } from 'lucide-react';
import { motion } from 'motion/react';
import { EventType } from '../types';
import { auth } from '../firebase';
import { cn } from '../lib/utils';

interface ShareAvailabilityModalProps {
  eventType: EventType;
  onClose: () => void;
}

const REMINDER_OPTIONS = ['1 day', '2 days', '3 days', '5 days', '7 days'];

const ShareAvailabilityModal: React.FC<ShareAvailabilityModalProps> = ({ eventType, onClose }) => {
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta', email: 'hiten.cuchd@gmail.com' };
  const displayName = currentUser.displayName || 'Hiten Mehta';
  const bookingUrl = `${window.location.origin}/b/${eventType.slug}`;

  const [toEmails, setToEmails] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [bccEmails, setBccEmails] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(`Schedule ${eventType.name}`);
  const [sendReminder, setSendReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState('3 days');
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const reminderRef = useRef<HTMLDivElement>(null);

  // Set initial body content
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = `Hello,<br><br>I look forward to connecting. Feel free to share some times you're available, or choose a time that works best for you on <a href="${bookingUrl}" style="color:#006BFF;text-decoration:underline">my booking page</a>.<br><br>Thanks,<br>${displayName}`;
    }
  }, []);

  // Close reminder dropdown on outside click
  useEffect(() => {
    if (!showReminderDropdown) return;
    const handler = (e: MouseEvent) => {
      if (reminderRef.current && !reminderRef.current.contains(e.target as Node)) {
        setShowReminderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showReminderDropdown]);

  const execFormat = (cmd: string, value?: string) => {
    bodyRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const handleSend = async () => {
    if (!toEmails.trim()) return;
    setSending(true);
    // Simulate send (no real email integration — would need backend/SendGrid etc.)
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    setSent(true);
    setTimeout(() => onClose(), 1500);
  };

  // Extract color class for the dot
  const dotColor = eventType.color || 'bg-[#8247e5]';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-[22px] font-bold text-[#0f1f3d]">Sharing: {eventType.name}</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors mt-0.5">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', dotColor)} />
            <span className="text-[14px] text-gray-600 font-medium">{eventType.name}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[75vh] space-y-4">
          {/* Share via email row */}
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#0f1f3d]">Share via email</span>
            <button className="flex items-center gap-1 text-[13px] text-[#006BFF] font-semibold hover:underline">
              From: Connect your email <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Warning banner */}
          <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-[13px] text-orange-800 font-medium">Connect your email account to send available times.</span>
          </div>

          {/* Email composer card */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* To field */}
            <div className="flex items-center border-b border-gray-100 px-4 py-2.5">
              <span className="text-[13px] text-gray-400 font-medium w-10 shrink-0">To:</span>
              <input
                type="text"
                value={toEmails}
                onChange={e => setToEmails(e.target.value)}
                placeholder="add contact or email address"
                className="flex-1 text-[14px] text-gray-700 outline-none placeholder-gray-400 bg-transparent"
              />
              <div className="flex items-center gap-3 ml-2">
                <button
                  onClick={() => setShowCc(!showCc)}
                  className={cn("text-[13px] font-bold transition-colors", showCc ? "text-[#006BFF]" : "text-gray-500 hover:text-gray-700")}
                >
                  Cc
                </button>
                <button
                  onClick={() => setShowBcc(!showBcc)}
                  className={cn("text-[13px] font-bold transition-colors", showBcc ? "text-[#006BFF]" : "text-gray-500 hover:text-gray-700")}
                >
                  Bcc
                </button>
              </div>
            </div>

            {/* Cc field */}
            {showCc && (
              <div className="flex items-center border-b border-gray-100 px-4 py-2.5">
                <span className="text-[13px] text-gray-400 font-medium w-10 shrink-0">Cc:</span>
                <input
                  type="text"
                  value={ccEmails}
                  onChange={e => setCcEmails(e.target.value)}
                  placeholder="add email address"
                  className="flex-1 text-[14px] text-gray-700 outline-none placeholder-gray-400 bg-transparent"
                />
              </div>
            )}

            {/* Bcc field */}
            {showBcc && (
              <div className="flex items-center border-b border-gray-100 px-4 py-2.5">
                <span className="text-[13px] text-gray-400 font-medium w-10 shrink-0">Bcc:</span>
                <input
                  type="text"
                  value={bccEmails}
                  onChange={e => setBccEmails(e.target.value)}
                  placeholder="add email address"
                  className="flex-1 text-[14px] text-gray-700 outline-none placeholder-gray-400 bg-transparent"
                />
              </div>
            )}

            {/* Subject field */}
            <div className="flex items-center border-b border-gray-100 px-4 py-2.5">
              <span className="text-[13px] text-gray-400 font-medium w-16 shrink-0">Subject:</span>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="flex-1 text-[14px] text-gray-700 outline-none bg-transparent"
              />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
              {[
                { icon: Bold, cmd: 'bold', title: 'Bold' },
                { icon: Italic, cmd: 'italic', title: 'Italic' },
                { icon: Underline, cmd: 'underline', title: 'Underline' },
              ].map(({ icon: Icon, cmd, title }) => (
                <button
                  key={cmd}
                  onMouseDown={e => { e.preventDefault(); execFormat(cmd); }}
                  title={title}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
              <div className="w-px h-4 bg-gray-200 mx-1" />
              {[
                { icon: List, cmd: 'insertUnorderedList', title: 'Bullet list' },
                { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered list' },
              ].map(({ icon: Icon, cmd, title }) => (
                <button
                  key={cmd}
                  onMouseDown={e => { e.preventDefault(); execFormat(cmd); }}
                  title={title}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button
                onMouseDown={e => {
                  e.preventDefault();
                  const url = prompt('Enter URL:');
                  if (url) execFormat('createLink', url);
                }}
                title="Insert link"
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button
                onMouseDown={e => { e.preventDefault(); execFormat('undo'); }}
                title="Undo"
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); execFormat('redo'); }}
                title="Redo"
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[180px] px-4 py-3 text-[14px] text-gray-800 leading-relaxed outline-none"
              style={{ wordBreak: 'break-word' }}
            />
          </div>

          {/* Reminder checkbox */}
          <div className="flex items-center gap-2" ref={reminderRef}>
            <input
              type="checkbox"
              id="reminder"
              checked={sendReminder}
              onChange={e => setSendReminder(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#006BFF] focus:ring-[#006BFF] cursor-pointer"
            />
            <label htmlFor="reminder" className="text-[13px] text-gray-700 cursor-pointer select-none">
              Send reminder to schedule if recipients haven't scheduled in
            </label>
            <div className="relative">
              <button
                onClick={() => sendReminder && setShowReminderDropdown(!showReminderDropdown)}
                className={cn(
                  "flex items-center gap-1 text-[13px] font-semibold transition-colors",
                  sendReminder ? "text-[#006BFF] hover:underline cursor-pointer" : "text-gray-400 cursor-default"
                )}
              >
                {reminderDays} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showReminderDropdown && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-10 w-28">
                  {REMINDER_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setReminderDays(opt); setShowReminderDropdown(false); }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 transition-colors",
                        reminderDays === opt ? "text-[#006BFF] font-bold" : "text-gray-700"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-[14px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!toEmails.trim() || sending || sent}
            className={cn(
              "px-8 py-2.5 rounded-full text-[14px] font-bold transition-all",
              toEmails.trim() && !sent
                ? "bg-[#006BFF] text-white hover:bg-blue-700"
                : sent
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ShareAvailabilityModal;
