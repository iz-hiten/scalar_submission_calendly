import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, FirestoreOperationType } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import { 
  UserPlus, 
  ChevronDown, 
  User, 
  Settings, 
  CreditCard, 
  LogOut,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Mock user for "No Login Required" requirement
  const currentUser = auth.currentUser || { uid: 'default-user', displayName: 'Hiten Mehta', email: 'hiten.cuchd@gmail.com' };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteStatus('sending');
    try {
      await addDoc(collection(db, 'invites'), {
        email: inviteEmail,
        invitedBy: currentUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setInviteStatus('success');
      setInviteEmail('');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteStatus('idle');
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'invites');
      setInviteStatus('error');
    }
  };

  return (
    <header className="flex items-center justify-end gap-4 mb-8">
      <button 
        onClick={() => setIsInviteModalOpen(true)}
        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        <UserPlus className="w-6 h-6" />
      </button>
      
      {/* User Profile Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 bg-[#f2f8ff] text-[#006BFF] font-bold rounded-full flex items-center justify-center border border-blue-100">
            {currentUser?.displayName?.[0] || 'H'}
          </div>
          <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isProfileDropdownOpen && "rotate-180")} />
        </button>
        
        <AnimatePresence>
          {isProfileDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsProfileDropdownOpen(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-40"
              >
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-[14px] font-bold text-[#1a1a1a] truncate">{currentUser?.displayName || 'Hiten Mehta'}</p>
                  <p className="text-[12px] text-gray-500 truncate">{currentUser?.email || 'hiten.cuchd@gmail.com'}</p>
                </div>
                
                <button onClick={() => { navigate('/settings'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => { navigate('/settings'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button onClick={() => { alert('Billing is not available in this demo.'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                  <CreditCard className="w-4 h-4" /> Billing
                </button>
                
                <div className="h-px bg-gray-100 my-1" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Invite User Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Invite User</h3>
                  <button 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                {inviteStatus === 'success' ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Invitation Sent!</h4>
                    <p className="text-gray-500">We've sent an invite to {inviteEmail}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={inviteStatus === 'sending'}
                      className="w-full py-3 bg-[#006BFF] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {inviteStatus === 'sending' ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
