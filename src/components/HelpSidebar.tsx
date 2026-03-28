import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export type HelpPage = 'scheduling' | 'meetings' | 'availability' | 'contacts';

interface HelpSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  page: HelpPage;
}

export const HelpSidebar: React.FC<HelpSidebarProps> = ({ isOpen, onClose, page }) => {
  const [activeTab, setActiveTab] = React.useState('Event types');

  const tabs = {
    scheduling: ['Event types', 'Single-use links', 'Meeting polls'],
    meetings: ['Upcoming', 'Pending', 'Past'],
    availability: [],
    contacts: []
  };

  const currentTabs = tabs[page] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-[70] flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#1a1a1a]">
                {page === 'scheduling' ? 'About scheduling' : page === 'meetings' ? 'About meetings' : 'Help'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {currentTabs.length > 0 && (
              <div className="flex px-6 border-b border-gray-100">
                {currentTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "py-4 px-4 text-[14px] font-semibold transition-all relative",
                      activeTab === tab
                        ? "text-[#006BFF] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#006BFF]"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-8">
                <h3 className="text-[14px] font-bold text-gray-500 uppercase tracking-wider mb-4">See Help Articles</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                    <span className="text-[15px] font-medium text-gray-700 group-hover:text-blue-600">
                      {activeTab} overview
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                  </button>
                </div>
              </div>

              <a
                href="#"
                className="flex items-center gap-2 text-[15px] font-semibold text-[#006BFF] hover:underline"
              >
                See all articles in the help center
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-600 rounded-full" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Need more help?</p>
                  <p className="text-[13px] text-gray-500">Our support team is here to help you.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
