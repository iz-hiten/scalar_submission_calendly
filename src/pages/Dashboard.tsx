import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db, handleFirestoreError, FirestoreOperationType } from '../firebase';
import { EventType, SingleUseLink, MeetingPoll } from '../types';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ExternalLink, 
  MoreVertical, 
  Copy, 
  Share2,
  Clock,
  Calendar,
  Link as LinkIcon,
  Trash2,
  Edit2,
  Settings,
  XCircle,
  Check,
  Power,
  X,
  CalendarPlus,
  MailPlus,
  Redo2,
  Link2,
  Code,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { HelpPage } from '../components/HelpSidebar';
import BookMeetingModal from '../components/BookMeetingModal';
import OfferTimeSlotsModal from '../components/OfferTimeSlotsModal';
import ShareAvailabilityModal from '../components/ShareAvailabilityModal';
import SingleUseLinkModal from '../components/SingleUseLinkModal';
import AddToWebsiteModal from '../components/AddToWebsiteModal';

interface EventTypeItemProps {
  type: EventType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onCopy: (slug: string, id: string) => void;
  onShare: (type: EventType) => void;
  onMenuToggle: (id: string) => void;
  isMenuOpen: boolean;
  onDelete: (id: string) => void;
  onClone: (type: EventType) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (type: EventType) => void;
  onBook: (type: EventType) => void;
  onOffer: (type: EventType) => void;
  onSingleUseLink: (type: EventType) => void;
  copiedId: string | null;
}

const EventTypeItem: React.FC<EventTypeItemProps> = ({ 
  type, 
  isSelected, 
  onSelect, 
  onCopy, 
  onShare, 
  onMenuToggle, 
  isMenuOpen, 
  onDelete,
  onClone,
  onToggleActive,
  onEdit,
  onBook,
  onOffer,
  onSingleUseLink,
  copiedId 
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border transition-all overflow-hidden flex group",
        isSelected ? "border-[#006BFF] ring-1 ring-[#006BFF]" : "border-gray-200 shadow-sm hover:shadow-md",
        !type.isActive && "opacity-60"
      )}
    >
      <div className={cn("w-[6px]", type.color || "bg-[#006BFF]")} />
      <div className="flex-1 p-5 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onSelect(type.id)}
            className="mt-1.5 w-4 h-4 rounded border-gray-300 text-[#006BFF] focus:ring-[#006BFF] cursor-pointer" 
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[18px] font-bold text-[#1a1a1a]">{type.name}</h3>
              {!type.isActive && <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Off</span>}
            </div>
            <p className="text-[14px] text-gray-500">
              {type.duration} min • {type.location || 'Google Meet'} • One-on-One
            </p>
            <p className="text-[14px] text-gray-500 mt-1">
              Weekdays, 9 am - 5 pm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
            <button 
              onClick={() => onBook(type)}
              title="Book meeting" 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CalendarPlus className="w-5 h-5" />
            </button>
            <button 
              title="Offer time slots" 
              onClick={() => onOffer(type)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MailPlus className="w-5 h-5" />
            </button>
            <button title="Share availability" onClick={() => onShare(type)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <Redo2 className="w-5 h-5" />
            </button>
            <button title="Create single use link" onClick={() => onSingleUseLink(type)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-0.5 transition-colors">
              <Link2 className="w-5 h-5" />
              <span className="text-[10px] font-bold">1x</span>
            </button>
          </div>

          <button
            onClick={() => onCopy(type.slug, type.id)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-[14px] font-semibold text-[#1a1a1a] hover:bg-gray-50 transition-colors"
          >
            {copiedId === type.id ? 'Copied' : <><Link2 className="w-4 h-4" /> Copy link</>}
          </button>
          
          <button 
            onClick={() => window.open(`${window.location.origin}/b/${type.slug}`, '_blank')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </button>

          <div className="relative">
            <button 
              onClick={() => onMenuToggle(type.id)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20"
                >
                  <button onClick={() => { onEdit(type); onMenuToggle(type.id); }} className="w-full px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => onClone(type)}
                    className="w-full px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Clone
                  </button>
                  <button 
                    onClick={() => onToggleActive(type.id, !type.isActive)}
                    className="w-full px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Power className="w-4 h-4" /> Turn {type.isActive ? 'off' : 'on'}
                  </button>
// Settings button in event card dropdown → same as Edit
                  <button onClick={() => { onEdit(type); onMenuToggle(type.id); }} className="w-full px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button 
                    onClick={() => onDelete(type.id)}
                    className="w-full px-4 py-2 text-left text-[14px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openHelp } = useOutletContext<{ openHelp: (page: HelpPage) => void }>();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [singleUseLinks, setSingleUseLinks] = useState<SingleUseLink[]>([]);
  const [meetingPolls, setMeetingPolls] = useState<MeetingPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<'event' | 'one-off' | 'poll' | 'book' | 'offer' | 'single-use' | 'edit' | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Event types');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<EventType | null>(null);
  const [showLandingMenu, setShowLandingMenu] = useState(false);
  const [showAddToWebsite, setShowAddToWebsite] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Mock user for "No Login Required" requirement
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta' };

  useEffect(() => {
    setLoading(true);
    
    // Event Types
    const qEventTypes = query(collection(db, 'eventTypes'), where('userId', '==', currentUser.uid));
    const unsubscribeEventTypes = onSnapshot(qEventTypes, (snapshot) => {
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventType))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (types.length === 0 && currentUser.uid === 'default-user') {
        setEventTypes([
          {
            id: 'sample-1',
            name: '30 Minute Meeting',
            duration: 30,
            slug: '30min',
            location: 'Google Meet',
            color: 'bg-[#8247e5]',
            userId: 'default-user',
            order: 0,
            isActive: true
          },
          {
            id: 'sample-2',
            name: 'Discovery Call',
            duration: 15,
            slug: 'discovery',
            location: 'Phone Call',
            color: 'bg-[#ff4e00]',
            userId: 'default-user',
            order: 1,
            isActive: true
          }
        ]);
      } else {
        setEventTypes(types);
      }
    }, (error) => {
      console.warn('Firestore error fetching event types:', error);
    });

    // Single Use Links
    const qLinks = query(collection(db, 'singleUseLinks'), where('userId', '==', currentUser.uid));
    const unsubscribeLinks = onSnapshot(qLinks, (snapshot) => {
      const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SingleUseLink));
      if (links.length === 0 && currentUser.uid === 'default-user') {
        setSingleUseLinks([
          {
            id: 'sul-1',
            name: 'One-off Discovery',
            duration: 30,
            slug: 'one-off-123',
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            isUsed: false,
            userId: 'default-user'
          }
        ]);
      } else {
        setSingleUseLinks(links);
      }
    }, (error) => {
      console.warn('Firestore error fetching single use links:', error);
    });

    // Meeting Polls
    const qPolls = query(collection(db, 'meetingPolls'), where('userId', '==', currentUser.uid));
    const unsubscribePolls = onSnapshot(qPolls, (snapshot) => {
      const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingPoll));
      if (polls.length === 0 && currentUser.uid === 'default-user') {
        setMeetingPolls([
          {
            id: 'poll-1',
            name: 'Team Sync Planning',
            duration: 60,
            options: [
              { date: '2026-03-30', startTime: '10:00', endTime: '11:00', votes: 3 },
              { date: '2026-03-31', startTime: '14:00', endTime: '15:00', votes: 1 }
            ],
            userId: 'default-user',
            status: 'open'
          }
        ]);
      } else {
        setMeetingPolls(polls);
      }
      setLoading(false);
    }, (error) => {
      console.warn('Firestore error fetching meeting polls:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeEventTypes();
      unsubscribeLinks();
      unsubscribePolls();
    };
  }, [currentUser.uid]);

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} event type(s)?`)) {
      setIsBulkActionLoading(true);
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => {
          if (!id.startsWith('sample-')) {
            batch.delete(doc(db, 'eventTypes', id));
          }
        });
        await batch.commit();
        setSelectedIds([]);
      } catch (error) {
        handleFirestoreError(error, FirestoreOperationType.DELETE, 'eventTypes/bulk');
      } finally {
        setIsBulkActionLoading(false);
      }
    }
  };

  const handleBulkToggleActive = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        if (!id.startsWith('sample-')) {
          batch.update(doc(db, 'eventTypes', id), { isActive: active });
        }
      });
      await batch.commit();
      setSelectedIds([]);
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.UPDATE, 'eventTypes/bulk');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleClone = async (type: EventType) => {
    try {
      const { id, ...rest } = type;
      await addDoc(collection(db, 'eventTypes'), {
        ...rest,
        name: `${type.name} (Clone)`,
        slug: `${type.slug}-clone-${Math.random().toString(36).substr(2, 4)}`,
        order: eventTypes.length,
        createdAt: new Date().toISOString()
      });
      setOpenMenuId(null);
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.CREATE, 'eventTypes/clone');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      if (!id.startsWith('sample-')) {
        await updateDoc(doc(db, 'eventTypes', id), { isActive: active });
      }
      setOpenMenuId(null);
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.UPDATE, `eventTypes/${id}`);
    }
  };

  const handleDelete = async (id: string, collectionName: string) => {
    if (window.confirm(`Are you sure you want to delete this ${collectionName.slice(0, -1)}?`)) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        setSelectedIds(prev => prev.filter(i => i !== id));
        setOpenMenuId(null);
      } catch (error) {
        handleFirestoreError(error, FirestoreOperationType.DELETE, `${collectionName}/${id}`);
      }
    }
  };

  const copyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/b/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-bold text-[#1a1a1a]">Scheduling</h1>
          <button 
            onClick={() => openHelp('scheduling')}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
          </button>
        </div>
        <div className="flex relative">
          <button 
            onClick={() => setIsModalOpen('event')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#006BFF] text-white font-bold rounded-l-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create
          </button>
          <div 
            onClick={() => setOpenMenuId(openMenuId === 'create-dropdown' ? null : 'create-dropdown')}
            className="flex items-center px-3 bg-[#006BFF] text-white border-l border-blue-400 rounded-r-full hover:bg-blue-700 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </div>
          <AnimatePresence>
            {openMenuId === 'create-dropdown' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30"
              >
                <button 
                  onClick={() => { setIsModalOpen('event'); setOpenMenuId(null); }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">Event type</div>
                    <div className="text-[12px] text-gray-500">Create a template for your regular meetings.</div>
                  </div>
                </button>
                <button 
                  onClick={() => { setIsModalOpen('one-off'); setOpenMenuId(null); }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">One-off meeting</div>
                    <div className="text-[12px] text-gray-500">Invite someone to a meeting without an event type.</div>
                  </div>
                </button>
                <button 
                  onClick={() => { setIsModalOpen('poll'); setOpenMenuId(null); }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">Meeting poll</div>
                    <div className="text-[12px] text-gray-500">Schedule a group meeting by offering times.</div>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200 mb-6">
        {['Event types', 'Single-use links', 'Meeting polls'].map((tab) => (
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

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${activeTab.toLowerCase()}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-[15px]"
        />
      </div>

      {/* User Info Row */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#f2f2f2] rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
            {currentUser.displayName?.[0] || 'H'}
          </div>
          <span className="text-[15px] font-semibold text-[#1a1a1a]">{currentUser.displayName}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.open(`${window.location.origin}/u/${currentUser.uid}`, '_blank')}
            className="flex items-center gap-1.5 text-[14px] font-semibold text-[#006BFF] hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            View landing page
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLandingMenu(!showLandingMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showLandingMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowLandingMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30"
                  >
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/u/${currentUser.uid}`);
                        setShowLandingMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Link2 className="w-4 h-4 text-gray-500" /> Copy Link
                    </button>
                    <button
                      onClick={() => { setShowAddToWebsite(true); setShowLandingMenu(false); }}
                      className="w-full px-4 py-3 text-left text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Code className="w-4 h-4 text-gray-500" /> Add to Website
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl border border-gray-200"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 pb-24">
          {activeTab === 'Event types' && (
            <div className="space-y-4">
              {eventTypes.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((type) => (
                <EventTypeItem
                  key={type.id}
                  type={type}
                  isSelected={selectedIds.includes(type.id)}
                  onSelect={handleSelect}
                  onCopy={copyLink}
                  onShare={(t) => setShowShareModal(t)}
                  onMenuToggle={(id) => setOpenMenuId(openMenuId === id ? null : id)}
                  isMenuOpen={openMenuId === type.id}
                  onDelete={(id) => handleDelete(id, 'eventTypes')}
                  onClone={handleClone}
                  onToggleActive={handleToggleActive}
                  onEdit={(t) => { setSelectedEventType(t); setIsModalOpen('edit'); }}
                  onBook={(type) => {
                    setSelectedEventType(type);
                    setIsModalOpen('book');
                  }}
                  onOffer={(type) => {
                    setSelectedEventType(type);
                    setIsModalOpen('offer');
                  }}
                  onSingleUseLink={(type) => {
                    setSelectedEventType(type);
                    setIsModalOpen('single-use');
                  }}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}

          {activeTab === 'Single-use links' && singleUseLinks.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1a1a1a]">{link.name}</h3>
                  <p className="text-[14px] text-gray-500">
                    {link.duration} min • Expires {new Date(link.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => copyLink(link.slug, link.id)}
                  className="px-4 py-2 border border-gray-300 rounded-full text-[14px] font-semibold text-[#1a1a1a] hover:bg-gray-50"
                >
                  {copiedId === link.id ? 'Copied' : 'Copy link'}
                </button>
                <button 
                  onClick={() => setShowShareModal({ id: link.id, name: link.name, duration: link.duration, slug: link.slug, color: 'bg-orange-500', userId: currentUser.uid })}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {openMenuId === link.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20"
                      >
                        <button 
                          onClick={() => handleDelete(link.id, 'singleUseLinks')}
                          className="w-full px-4 py-2 text-left text-[14px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}

          {activeTab === 'Meeting polls' && meetingPolls.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((poll) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1a1a1a]">{poll.name}</h3>
                  <p className="text-[14px] text-gray-500">
                    {poll.duration} min • {poll.options.length} time options • {poll.status === 'open' ? 'Voting open' : 'Closed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => copyLink(poll.id, poll.id)}
                  className="px-4 py-2 border border-gray-300 rounded-full text-[14px] font-semibold text-[#1a1a1a] hover:bg-gray-50"
                >
                  {copiedId === poll.id ? 'Copied' : 'Copy link'}
                </button>
                <button 
                  onClick={() => setShowShareModal({ id: poll.id, name: poll.name, duration: poll.duration, slug: poll.id, color: 'bg-purple-500', userId: currentUser.uid })}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === poll.id ? null : poll.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {openMenuId === poll.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20"
                      >
                        <button 
                          onClick={() => handleDelete(poll.id, 'meetingPolls')}
                          className="w-full px-4 py-2 text-left text-[14px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}

          {((activeTab === 'Event types' && eventTypes.length === 0) ||
            (activeTab === 'Single-use links' && singleUseLinks.length === 0) ||
            (activeTab === 'Meeting polls' && meetingPolls.length === 0)) && !loading && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No {activeTab.toLowerCase()} yet</h3>
              <p className="text-gray-500 mb-6">Create your first {activeTab.toLowerCase().slice(0, -1)} to get started.</p>
              <button 
                onClick={() => setIsModalOpen(activeTab === 'Event types' ? 'event' : activeTab === 'Single-use links' ? 'one-off' : 'poll')}
                className="px-6 py-2 bg-[#006BFF] text-white font-bold rounded-full hover:bg-blue-700"
              >
                Create {activeTab.toLowerCase().slice(0, -1)}
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white rounded-lg shadow-[0_4px_15px_rgb(0,0,0,0.08)] border border-gray-100 px-3 py-1.5 flex items-center gap-2 min-w-[320px]">
              <div className="flex items-center gap-1.5 pr-2.5 border-r border-gray-100">
                <span className="text-[13px] font-bold text-gray-900">{selectedIds.length}</span>
                <span className="text-[13px] text-gray-500">selected</span>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={handleBulkDelete}
                  disabled={isBulkActionLoading}
                  className="flex items-center gap-1 px-2.5 py-1 text-gray-700 text-[13px] font-bold hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === 'bulk-toggle' ? null : 'bulk-toggle')}
                    className="flex items-center gap-1 px-2.5 py-1 text-gray-700 text-[13px] font-bold hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                  >
                    <Power className="w-3 h-3" />
                    Toggle on/off
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {openMenuId === 'bulk-toggle' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: -5 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute bottom-full left-0 mb-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50"
                      >
                        <button 
                          onClick={() => { handleBulkToggleActive(true); setOpenMenuId(null); }}
                          className="w-full px-2.5 py-1 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 text-green-600" /> Turn on
                        </button>
                        <button 
                          onClick={() => { handleBulkToggleActive(false); setOpenMenuId(null); }}
                          className="w-full px-2.5 py-1 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                        >
                          <X className="w-3 h-3 text-red-600" /> Turn off
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  disabled
                  className="flex items-center gap-1 px-2.5 py-1 text-gray-400 text-[13px] font-bold bg-gray-50 rounded-md border border-gray-100 cursor-not-allowed"
                >
                  <Calendar className="w-3 h-3" />
                  Copy availability from
                </button>
              </div>

              <button 
                onClick={() => setSelectedIds([])}
                className="ml-auto p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {isModalOpen === 'event' && (
          <CreateEventTypeModal 
            onClose={() => setIsModalOpen(null)} 
            nextOrder={eventTypes.length}
          />
        )}
        {isModalOpen === 'one-off' && (
          <SingleUseLinkModal
            eventType={eventTypes[0] || { id: 'default', name: 'Meeting', duration: 30, slug: 'meeting', color: 'bg-[#006BFF]', userId: currentUser.uid }}
            onClose={() => setIsModalOpen(null)}
          />
        )}
        {isModalOpen === 'edit' && selectedEventType && (
          <EditEventTypeModal
            eventType={selectedEventType}
            onClose={() => { setIsModalOpen(null); setSelectedEventType(null); }}
          />
        )}
        {isModalOpen === 'poll' && (
          <CreateMeetingPollModal onClose={() => setIsModalOpen(null)} />
        )}
        {isModalOpen === 'book' && selectedEventType && (
          <BookMeetingModal 
            eventType={selectedEventType} 
            onClose={() => {
              setIsModalOpen(null);
              setSelectedEventType(null);
            }} 
          />
        )}
        {isModalOpen === 'offer' && selectedEventType && (
          <OfferTimeSlotsModal 
            eventType={selectedEventType} 
            onClose={() => {
              setIsModalOpen(null);
              setSelectedEventType(null);
            }} 
          />
        )}
        {isModalOpen === 'single-use' && selectedEventType && (          <SingleUseLinkModal
            eventType={selectedEventType}
            onClose={() => {
              setIsModalOpen(null);
              setSelectedEventType(null);
            }}
            onShare={(link) => setShowShareModal({ ...selectedEventType!, slug: link.slug })}
          />
        )}
        {showShareModal && (
          <ShareAvailabilityModal eventType={showShareModal} onClose={() => setShowShareModal(null)} />
        )}
        {showAddToWebsite && (
          <AddToWebsiteModal
            profileUrl={`/u/${currentUser.uid}`}
            displayName={currentUser.displayName || 'Hiten Mehta'}
            onClose={() => setShowAddToWebsite(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateOneOffMeetingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    duration: 30,
    slug: `one-off-${Math.random().toString(36).substr(2, 9)}`,
    expiresAt: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser || { uid: 'default-user' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'singleUseLinks'), {
        ...formData,
        expiresAt: new Date(formData.expiresAt).toISOString(),
        isUsed: false,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.CREATE, 'singleUseLinks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New One-off Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Plus className="w-6 h-6 rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Quick Sync" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
              <select value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={60}>60 mins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires On</label>
              <input type="date" value={formData.expiresAt} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button disabled={loading} type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{loading ? 'Creating...' : 'Create Link'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CreateMeetingPollModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    duration: 30,
    options: [{ date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00', votes: 0 }]
  });
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser || { uid: 'default-user' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'meetingPolls'), {
        ...formData,
        userId: currentUser.uid,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.CREATE, 'meetingPolls');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Meeting Poll</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Plus className="w-6 h-6 rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poll Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Project Kickoff" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
            <select value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value={15}>15 mins</option>
              <option value={30}>30 mins</option>
              <option value={60}>60 mins</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button disabled={loading} type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{loading ? 'Creating...' : 'Create Poll'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ShareModal: React.FC<{ data: { id: string, slug: string, type: string }, onClose: () => void }> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/b/${data.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Share your link</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Share a link</h4>
                  <p className="text-sm text-gray-500">Copy and paste your scheduling link into an email, text, or social post.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Add to email</h4>
                  <p className="text-sm text-gray-500">Embed your available times directly into an email to reduce back-and-forth.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4">Link settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Single-use link</span>
                  <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Hide event type</span>
                  <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2 text-gray-700 font-bold hover:bg-gray-50 rounded-full">
              Close
            </button>
            <button onClick={handleCopy} className="px-6 py-2 bg-[#006BFF] text-white font-bold rounded-full hover:bg-blue-700">
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CreateEventTypeModal: React.FC<{ onClose: () => void; nextOrder: number }> = ({ onClose, nextOrder }) => {
  const [formData, setFormData] = useState({
    name: '',
    duration: 30,
    slug: '',
    description: '',
    location: 'Google Meet',
    color: 'bg-blue-600'
  });
  const [loading, setLoading] = useState(false);

  // Mock user for "No Login Required" requirement
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'eventTypes'), {
        ...formData,
        userId: currentUser.uid,
        order: nextOrder,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.CREATE, 'eventTypes');
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-red-600', 'bg-orange-600', 'bg-green-600', 'bg-teal-600'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Event Type</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="e.g. 30 Minute Meeting"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
              <select
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color,
                    formData.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event Type'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const EditEventTypeModal: React.FC<{ eventType: EventType; onClose: () => void }> = ({ eventType, onClose }) => {
  const [formData, setFormData] = useState({
    name: eventType.name,
    duration: eventType.duration,
    slug: eventType.slug,
    description: eventType.description || '',
    location: eventType.location || 'Google Meet',
    color: eventType.color || 'bg-blue-600',
  });
  const [loading, setLoading] = useState(false);

  const colors = ['bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-red-600', 'bg-orange-600', 'bg-green-600', 'bg-teal-600'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventType.id.startsWith('sample-')) { onClose(); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'eventTypes', eventType.id), { ...formData });
      onClose();
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.UPDATE, `eventTypes/${eventType.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Event Type</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Plus className="w-6 h-6 rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input required type="text" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
              <select value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} mins</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <input required type="text" value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button key={color} type="button" onClick={() => setFormData({ ...formData, color })}
                  className={cn("w-8 h-8 rounded-full transition-all", color,
                    formData.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105")} />
              ))}
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button disabled={loading} type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
