import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Link as LinkIcon, 
  Calendar, 
  Clock, 
  Users, 
  Zap, 
  Grid, 
  GitBranch, 
  BarChart3, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: 'Scheduling', icon: LinkIcon, path: '/' },
  { name: 'Meetings', icon: Calendar, path: '/meetings' },
  { name: 'Availability', icon: Clock, path: '/availability' },
  { name: 'Contacts', icon: Users, path: '/contacts' },
  { name: 'Workflows', icon: Zap, path: '/workflows' },
  { name: 'Integrations & apps', icon: Grid, path: '/integrations' },
  { name: 'Routing', icon: GitBranch, path: '/routing' },
];

const bottomItems = [
  { name: 'Analytics', icon: BarChart3, path: '/analytics' },
  { name: 'Admin center', icon: ShieldCheck, path: '/admin' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-20 transition-all duration-300",
      isCollapsed ? "w-[80px]" : "w-[260px]"
    )}>
      <div className={cn("p-4 flex items-center mb-2", isCollapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-1">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#006BFF"/>
            <path d="M21.3333 10.6667C21.3333 10.6667 18.6667 8 14.6667 8C10.6667 8 8 10.6667 8 16C8 21.3333 10.6667 24 14.6667 24C18.6667 24 21.3333 21.3333 21.3333 21.3333" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <path d="M14.6667 13.3333C14.6667 13.3333 13.3333 12 12 12C10.6667 12 9.33333 13.3333 9.33333 16C9.33333 18.6667 10.6667 20 12 20C13.3333 20 14.6667 18.6667 14.6667 18.6667" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span className="text-[22px] font-bold text-[#006BFF] tracking-tight ml-1">Calendly</span>}
        </div>
        <button 
          onClick={onToggle}
          className={cn(
            "text-gray-400 hover:text-gray-600 p-1.5 rounded-full border border-gray-200 shadow-sm bg-white transition-all",
            isCollapsed ? "absolute -right-4 top-4 z-30" : "hover:bg-gray-50"
          )}
          title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-4 mb-6">
        <button className={cn(
          "flex items-center justify-center gap-2 border border-[#006BFF] text-[#006BFF] font-semibold transition-colors",
          isCollapsed ? "w-12 h-12 rounded-full mx-auto" : "w-full py-2.5 rounded-full hover:bg-blue-50"
        )}>
          <Plus className="w-5 h-5" />
          {!isCollapsed && "Create"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg transition-colors",
                isCollapsed ? "flex-col py-3 px-1 text-center" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-[#f2f8ff] text-[#006BFF]"
                  : "text-[#1a1a1a] hover:bg-gray-100"
              )
            }
          >
            <item.icon className={cn("w-5 h-5", item.name === 'Scheduling' ? "text-[#006BFF]" : "text-[#1a1a1a]")} />
            <span className={cn(
              "font-semibold",
              isCollapsed ? "text-[10px] mt-1" : "text-[15px]"
            )}>
              {item.name}
            </span>
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <NavLink
            to="/upgrade"
            className={cn(
              "flex items-center text-[#1a1a1a] bg-[#f2f8ff] rounded-lg mb-2",
              isCollapsed ? "flex-col py-3 px-1 text-center" : "gap-3 px-3 py-2.5"
            )}
          >
            <div className="w-5 h-5 flex items-center justify-center text-[#006BFF] font-bold">$</div>
            <span className={cn(
              "font-semibold",
              isCollapsed ? "text-[10px] mt-1" : "text-[15px]"
            )}>
              Upgrade plan
            </span>
          </NavLink>
          
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center text-[#1a1a1a] rounded-lg hover:bg-gray-100 transition-colors",
                isCollapsed ? "flex-col py-3 px-1 text-center" : "gap-3 px-3 py-2.5"
              )}
            >
              <item.icon className="w-5 h-5 text-[#1a1a1a]" />
              <span className={cn(
                "font-semibold",
                isCollapsed ? "text-[10px] mt-1" : "text-[15px]"
              )}>
                {item.name}
              </span>
            </NavLink>
          ))}

          <button className={cn(
            "flex items-center text-[#1a1a1a] rounded-lg hover:bg-gray-100 transition-colors w-full",
            isCollapsed ? "flex-col py-3 px-1 text-center" : "justify-between px-3 py-2.5"
          )}>
            <div className={cn("flex items-center", isCollapsed ? "flex-col" : "gap-3")}>
              <HelpCircle className="w-5 h-5 text-[#1a1a1a]" />
              <span className={cn(
                "font-semibold",
                isCollapsed ? "text-[10px] mt-1" : "text-[15px]"
              )}>
                Help
              </span>
            </div>
            {!isCollapsed && <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </nav>
    </aside>
  );
};
