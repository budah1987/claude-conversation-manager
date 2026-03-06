// src/components/layout/Sidebar.tsx
'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus,
  Bookmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ALL_CONVERSATIONS } from '@/data/conversations';
import { useDemoSession } from '@/context/DemoSessionContext';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

// --- Sidebar toggle icon (from Figma export, stroke inherits theme via currentColor) ---
function SidebarToggleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 16"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="6.5" y1="0" x2="6.5" y2="16" />
      <rect x="0.5" y="0.5" width="20" height="15" rx="1.5" />
    </svg>
  );
}

// --- Claude.ai Search icon ---
function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 16×16 icon centered in 20×20 frame (2px inset each side) */}
      <g transform="translate(2, 2)">
        <path
          fillRule="nonzero"
          fill="currentColor"
          d="M 6.5 0 C 10.09 0 13 2.91 13 6.5 C 13 8.115 12.409 9.591 11.435 10.728 L 15.854 15.146 L 15.918 15.225 C 16.046 15.419 16.024 15.683 15.854 15.854 C 15.683 16.024 15.419 16.046 15.225 15.918 L 15.146 15.854 L 10.728 11.435 C 9.591 12.409 8.115 13 6.5 13 C 2.91 13 0 10.09 0 6.5 C 0 2.91 2.91 0 6.5 0 Z M 6.5 1 C 3.462 1 1 3.462 1 6.5 C 1 9.538 3.462 12 6.5 12 C 9.538 12 12 9.538 12 6.5 C 12 3.462 9.538 1 6.5 1 Z"
        />
      </g>
    </svg>
  );
}

// --- Claude.ai Chats icon ---
function ChatsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(2, 2)">
        <path
          fillRule="evenodd"
          fill="currentColor"
          d="M 7 0 C 10.313 0 13 2.686 13 6 C 13 9.314 10.313 12 7 12 L 0.5 12 C 0.301 12 0.121 11.882 0.042 11.7 C -0.038 11.518 -0.002 11.306 0.133 11.16 L 1.935 9.218 C 1.343 8.288 1 7.183 1 6 C 1 2.686 3.686 0 7 0 Z M 7 1 C 4.238 1 2 3.239 2 6 C 2 7.112 2.363 8.139 2.976 8.969 C 3.119 9.162 3.103 9.429 2.94 9.605 L 1.645 11 L 7 11 C 9.761 11 12 8.761 12 6 C 12 3.239 9.761 1 7 1 Z"
        />
        <path
          fill="currentColor"
          d="M 13.943 7.534 C 14.168 7.447 14.418 7.533 14.544 7.728 L 14.684 8.074 C 14.889 8.679 15 9.327 15 10 C 15 11.184 14.655 12.288 14.063 13.218 L 15.867 15.16 C 16.002 15.306 16.038 15.518 15.959 15.7 C 15.879 15.882 15.699 16 15.5 16 L 9 16 C 7.254 16 5.68 15.253 4.585 14.063 L 4.316 13.734 C 4.207 13.529 4.253 13.268 4.439 13.114 C 4.625 12.961 4.89 12.965 5.071 13.11 L 5.321 13.385 C 6.235 14.378 7.545 15 9 15 L 14.353 15 L 13.059 13.606 C 12.896 13.43 12.881 13.162 13.024 12.969 C 13.638 12.139 14 11.112 14 10 C 14 9.438 13.907 8.899 13.737 8.396 L 13.632 8.084 C 13.593 7.855 13.718 7.622 13.943 7.534 Z"
        />
      </g>
    </svg>
  );
}

// --- Claude.ai Projects icon ---
function ProjectsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 14×14 icon, offset to center in 20×20: x=3, y=3 */}
      <g transform="translate(2.68, 3)">
        <path
          fillRule="evenodd"
          fill="currentColor"
          d="M 13.139 4 C 14.008 4 14.682 4.732 14.637 5.576 L 14.618 5.747 L 13.452 12.747 C 13.332 13.47 12.706 14 11.973 14 L 2.666 14 C 1.933 14 1.308 13.47 1.187 12.747 L 0.021 5.747 C -0.132 4.833 0.573 4 1.5 4 L 13.139 4 Z M 1.5 5 C 1.191 5 0.956 5.277 1.007 5.582 L 2.173 12.582 C 2.213 12.823 2.422 13 2.666 13 L 11.973 13 C 12.217 13 12.426 12.823 12.466 12.582 L 13.632 5.582 L 13.638 5.47 C 13.623 5.213 13.409 5 13.139 5 L 1.5 5 Z"
        />
        <path
          fillRule="nonzero"
          fill="currentColor"
          d="M 12.82 2 C 13.095 2 13.32 2.224 13.32 2.5 C 13.32 2.776 13.095 3 12.82 3 L 1.82 3 C 1.543 3 1.32 2.776 1.32 2.5 C 1.32 2.224 1.543 2 1.82 2 L 12.82 2 Z"
        />
        <path
          fillRule="nonzero"
          fill="currentColor"
          d="M 11.32 0 C 11.595 0 11.82 0.224 11.82 0.5 C 11.82 0.776 11.595 1 11.32 1 L 3.32 1 C 3.043 1 2.82 0.776 2.82 0.5 C 2.82 0.224 3.043 0 3.32 0 L 11.32 0 Z"
        />
      </g>
    </svg>
  );
}

// --- Claude.ai Artifacts icon ---
// 2×2 grid: diamond (top-left), hourglass (top-right), 6-pt star (bottom-left), circle (bottom-right)
// Geometry from Figma node 185:157 (24px canvas, content inset ~2px)
function ArtifactsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top-left: diamond — square rotated 45°, center (7.5, 6.25), half-width ~3.2 */}
      <path fill="currentColor" d="M 7.5 2.75 L 10.7 5.95 L 7.5 9.15 L 4.3 5.95 Z M 7.5 4.15 L 5.7 5.95 L 7.5 7.75 L 9.3 5.95 Z" />
      {/* Top-right: hourglass — pos (14.5,2.75) size (6.95×7), centered x~18 y~6.25 */}
      <path fill="currentColor" d="M 14.5 2.75 L 21.45 2.75 L 18.975 6.25 L 21.45 9.75 L 14.5 9.75 L 16.975 6.25 Z M 16.05 3.75 L 17.975 6.25 L 16.05 8.75 L 19.9 8.75 L 18.025 6.25 L 19.9 3.75 Z" />
      {/* Bottom-left: 6-pointed star — center (6.75, 17.75), r_outer=3.5, r_inner=1.75 */}
      <path fill="currentColor" d="M 6.75 14.25 L 7.87 16.19 L 10.1 16.19 L 8.98 18.12 L 10.1 20.06 L 7.87 20.06 L 6.75 22 L 5.63 20.06 L 3.4 20.06 L 4.52 18.12 L 3.4 16.19 L 5.63 16.19 Z M 6.75 15.83 L 5.97 17.19 L 4.42 17.19 L 5.19 18.56 L 4.42 19.92 L 5.97 19.92 L 6.75 21.28 L 7.53 19.92 L 9.08 19.92 L 8.31 18.56 L 9.08 17.19 L 7.53 17.19 Z" />
      {/* Bottom-right: circle outline — center (17.75, 17.75) r=3.5 */}
      <path fill="currentColor" d="M 17.75 14.25 C 19.683 14.25 21.25 15.817 21.25 17.75 C 21.25 19.683 19.683 21.25 17.75 21.25 C 15.817 21.25 14.25 19.683 14.25 17.75 C 14.25 15.817 15.817 14.25 17.75 14.25 Z M 17.75 15.25 C 16.369 15.25 15.25 16.369 15.25 17.75 C 15.25 19.131 16.369 20.25 17.75 20.25 C 19.131 20.25 20.25 19.131 20.25 17.75 C 20.25 16.369 19.131 15.25 17.75 15.25 Z" />
      {/* Bottom-right: circle outline — center (17.75, 17.75) r=3.5 */}
      <path fill="currentColor" d="M 17.75 14.25 C 19.821 14.25 21.5 15.929 21.5 17.75 C 21.5 19.571 19.821 21.25 17.75 21.25 C 15.679 21.25 14 19.571 14 17.75 C 14 15.929 15.679 14.25 17.75 14.25 Z M 17.75 15.25 C 16.231 15.25 15 16.481 15 17.75 C 15 19.019 16.231 20.25 17.75 20.25 C 19.269 20.25 20.5 19.019 20.5 17.75 C 20.5 16.481 19.269 15.25 17.75 15.25 Z" />
    </svg>
  );
}


// --- Nav item (expanded) ---
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors',
        active
          ? 'bg-[var(--sidebar-button-active-bg)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

// --- Nav item (collapsed, icon only) ---
function NavItemCollapsed({
  icon,
  label,
  active = false,
  onClick,
}: NavItemProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      title={label}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-[var(--sidebar-button-active-bg)] text-[var(--text-primary)]'
          : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]'
      )}
    >
      {icon}
    </button>
  );
}

// --- Conversation list item (used for Starred and Recents) ---
function ConversationItem({
  title,
  active = false,
  onClick,
}: {
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-1 rounded-lg text-left transition-colors group',
        active
          ? 'bg-[var(--sidebar-button-active-bg)]'
          : 'hover:bg-[var(--surface-hover)]'
      )}
    >
      <span className="text-[14px] text-[var(--text-secondary)] transition-colors truncate block">
        {title}
      </span>
    </button>
  );
}

// --- Section label ---
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[12px] font-medium text-[var(--text-tertiary)]">
      {children}
    </p>
  );
}

// --- Profile row with inline theme toggle ---
function ProfileRow() {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-3 -mx-3 px-3 pt-2 pb-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
      {/* Avatar — larger, neutral dark circle */}
      <div className="w-10 h-10 rounded-full bg-[#4A4845] shrink-0 flex items-center justify-center text-[15px] font-semibold text-white">
        A
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate block">
          Amir
        </span>
        <span className="text-[12px] text-[var(--text-tertiary)] truncate block">
          Max plan
        </span>
      </div>
      {/* Theme toggle — bordered pill button */}
      <button
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
      >
        {mounted ? (
          <AnimatePresence mode="popLayout" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex items-center justify-center"
              >
                <Moon size={18} strokeWidth={1.5} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex items-center justify-center"
              >
                <Sun size={18} strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <span className="w-[18px] h-[18px]" />
        )}
      </button>
    </div>
  );
}

// --- Expanded sidebar content ---
interface SidebarContentProps {
  onSearchClick?: () => void;
  onNavigate?: () => void;
  onConversationClick?: (id: string) => void;
  activeConversationId?: string;
}

function ExpandedContent({
  onSearchClick,
  onNavigate,
  onConversationClick,
  activeConversationId,
}: SidebarContentProps) {
  const { demoConversation } = useDemoSession();
  const router = useRouter();
  const pathname = usePathname();
  const isNewChatActive = false; // Demo route temporarily disabled
  const isChatsActive = pathname === '/chats';

  // Starred conversations (pinned -> starred migration)
  const starredConversations = useMemo(
    () => ALL_CONVERSATIONS.filter((c) => c.starred || c.pinned),
    []
  );

  // Recent conversations (8 most recent non-starred)
  const recentConversations = useMemo(
    () => ALL_CONVERSATIONS
      .filter((c) => !c.starred && !c.pinned)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8),
    []
  );

  // Prepend demo conversation if active, keep total at 8
  const displayedRecents = useMemo(() => {
    if (!demoConversation) return recentConversations;
    const demoEntry = {
      id: demoConversation.id,
      title: demoConversation.title,
      preview: '',
      timestamp: new Date().toISOString(),
    };
    return [demoEntry, ...recentConversations.slice(0, 7)];
  }, [demoConversation, recentConversations]);

  const handleClick = (callback?: () => void) => {
    onNavigate?.();
    callback?.();
  };

  return (
    <>
      {/* Scrollable area: nav + starred + recents */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Nav — primary group */}
        <nav className="flex flex-col gap-0.5">
          <NavItem
            icon={
              <span className="w-[22px] h-[22px] rounded-full bg-[var(--sidebar-button-active-bg)] flex items-center justify-center shrink-0">
                <Plus size={14} strokeWidth={2.5} />
              </span>
            }
            label="New chat"
            active={isNewChatActive}
            onClick={() => handleClick(() => router.push('/'))}
          />
          <NavItem
            icon={<SearchIcon size={20} />}
            label="Search"
            onClick={() => handleClick(onSearchClick)}
          />
          <NavItem
            icon={<Bookmark size={20} strokeWidth={1.5} />}
            label="Saved"
            active={pathname === '/saved'}
            onClick={() => handleClick(() => router.push('/saved'))}
          />
        </nav>

        {/* Nav — secondary group */}
        <nav className="flex flex-col gap-0.5 mt-3">
          <NavItem
            icon={<ChatsIcon size={20} />}
            label="Chats"
            active={isChatsActive}
            onClick={() => handleClick(() => router.push('/chats'))}
          />
          <NavItem
            icon={<ProjectsIcon size={20} />}
            label="Projects"
            onClick={() => handleClick()}
          />
          <NavItem
            icon={<ArtifactsIcon size={20} />}
            label="Artifacts"
            onClick={() => handleClick()}
          />
        </nav>

        {/* Starred conversations */}
        {starredConversations.length > 0 && (
          <div className="flex-shrink-0">
            <SectionLabel>Starred</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {starredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  title={conv.title}
                  active={conv.id === activeConversationId}
                  onClick={() => {
                    onConversationClick?.(conv.id);
                    onNavigate?.();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent conversations */}
        {displayedRecents.length > 0 && (
          <div className="flex-shrink-0">
            <SectionLabel>Recents</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {displayedRecents.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  title={conv.title}
                  active={conv.id === activeConversationId}
                  onClick={() => {
                    onConversationClick?.(conv.id);
                    onNavigate?.();
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom — pinned */}
      <div className="flex flex-col gap-0.5 shrink-0 pt-2">
        <ProfileRow />
      </div>
    </>
  );
}

// --- Collapsed theme toggle (icon only) ---
function CollapsedThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <span className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors"
    >
      <span className="w-5 h-5 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute flex items-center justify-center"
            >
              <Moon size={20} strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute flex items-center justify-center"
            >
              <Sun size={20} strokeWidth={1.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

// --- Collapsed sidebar content (icon rail) ---
function CollapsedContent({
  onSearchClick,
  onToggle,
}: {
  onSearchClick?: () => void;
  onToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isNewChatActive = false; // Demo route temporarily disabled
  const isChatsActive = pathname === '/chats';
  const isSavedActive = pathname === '/saved';
  return (
    <>
      {/* Toggle at top */}
      <button
        aria-label="Expand sidebar"
        onClick={onToggle}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors mb-1"
      >
        <SidebarToggleIcon size={18} />
      </button>

      {/* Nav icons — primary group */}
      <nav className="flex flex-col gap-1">
        <NavItemCollapsed
          icon={
            <span className="w-[22px] h-[22px] rounded-full bg-[var(--sidebar-button-active-bg)] flex items-center justify-center shrink-0">
              <Plus size={14} strokeWidth={2.5} />
            </span>
          }
          label="New chat"
          active={isNewChatActive}
          onClick={() => router.push('/')}
        />
        <NavItemCollapsed
          icon={<SearchIcon size={20} />}
          label="Search"
          onClick={onSearchClick}
        />
        <NavItemCollapsed
          icon={<Bookmark size={20} strokeWidth={1.5} />}
          label="Saved"
          active={isSavedActive}
          onClick={() => router.push('/saved')}
        />
      </nav>

      {/* Nav icons — secondary group */}
      <nav className="flex flex-col gap-1 mt-3 mb-auto">
        <NavItemCollapsed
          icon={<ChatsIcon size={20} />}
          label="Chats"
          active={isChatsActive}
          onClick={() => router.push('/chats')}
        />
        <NavItemCollapsed
          icon={<ProjectsIcon size={20} />}
          label="Projects"
        />
        <NavItemCollapsed
          icon={<ArtifactsIcon size={20} />}
          label="Artifacts"
        />
      </nav>

      {/* Bottom: theme toggle + avatar */}
      <div className="flex flex-col gap-1 items-center mt-auto">
        <CollapsedThemeToggle />
        <div
          className="w-8 h-8 rounded-full bg-[var(--accent-avatar)] shrink-0 cursor-pointer flex items-center justify-center text-[13px] font-semibold text-white"
          role="button"
          aria-label="User profile"
        >
          A
        </div>
      </div>
    </>
  );
}

// --- Main Sidebar Export ---
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSearchClick?: () => void;
  onConversationClick?: (id: string) => void;
  activeConversationId?: string;
}

export function Sidebar({
  isOpen,
  onToggle,
  onClose,
  onSearchClick,
  onConversationClick,
  activeConversationId,
}: SidebarProps) {
  const handleMobileNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleSidebarDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [role="button"]')) return;
    onToggle();
  };

  return (
    <>
      {/* ===== DESKTOP (≥1024px) ===== */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 52 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex h-full bg-[var(--surface-sidebar)] border-r-[0.5px] border-[var(--border-secondary)] flex-col shrink-0 z-20 overflow-hidden"
        onDoubleClick={handleSidebarDoubleClick}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-[260px] flex flex-col h-full pt-3 pb-0 px-3"
            >
              {/* Header: Claude wordmark + toggle */}
              <div className="flex items-center justify-between px-3 pb-3">
                <button
                  onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                  className="text-[18px] font-semibold text-[var(--text-primary)] hover:opacity-70 transition-opacity cursor-pointer"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Claude
                </button>
                <button
                  aria-label="Collapse sidebar"
                  onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <SidebarToggleIcon size={18} />
                </button>
              </div>

              <ExpandedContent
                onSearchClick={onSearchClick}
                onNavigate={handleMobileNavigate}
                onConversationClick={onConversationClick}
                activeConversationId={activeConversationId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center h-full py-3"
            >
              <CollapsedContent
                onSearchClick={onSearchClick}
                onToggle={onToggle}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ===== MOBILE / TABLET (<1024px) ===== */}

      {/* Toggle button (only visible on mobile when sidebar is closed) */}
      {!isOpen && (
        <button
          aria-label="Open sidebar"
          onClick={onToggle}
          className="fixed top-3 left-3 z-30 w-11 h-11 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors lg:hidden"
        >
          <SidebarToggleIcon size={18} />
        </button>
      )}

      {/* Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/25 z-30 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 h-full w-[260px] bg-[var(--surface-sidebar)] border-r-[0.5px] border-[var(--border-secondary)] flex flex-col px-3 z-40 lg:hidden"
              style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 0px))', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 pb-3">
                <button
                  onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                  className="text-[18px] font-semibold text-[var(--text-primary)] hover:opacity-70 transition-opacity cursor-pointer"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Claude
                </button>
                <button
                  aria-label="Close sidebar"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <SidebarToggleIcon size={18} />
                </button>
              </div>

              <ExpandedContent
                onSearchClick={onSearchClick}
                onNavigate={handleMobileNavigate}
                onConversationClick={onConversationClick}
                activeConversationId={activeConversationId}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}