// src/components/layout/Sidebar.tsx
'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus,
  Search,
  MessageSquare,
  FolderClosed,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ALL_CONVERSATIONS } from '@/data/conversations';
import { TOPICS } from '@/data/topics';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

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

// --- Artifacts icon ---
function ArtifactsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="14" cy="6" r="2.5" />
      <circle cx="6" cy="14" r="2.5" />
      <circle cx="14" cy="14" r="2.5" />
      <line x1="8.5" y1="6" x2="11.5" y2="6" />
      <line x1="6" y1="8.5" x2="6" y2="11.5" />
    </svg>
  );
}

// --- Code icon (</> style) ---
function CodeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 6 2 10 6 14" />
      <polyline points="14 6 18 10 14 14" />
      <line x1="11" y1="4" x2="9" y2="16" />
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
          : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]'
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

// --- Pinned conversation item ---
// Badge-friendly overrides for topic colors that are too dark on solid backgrounds
const BADGE_COLOR_OVERRIDES: Record<string, string> = {
  '#805C1F': '#B8860B', // Planning: dark brown → brighter amber
};

function PinnedItem({
  title,
  color,
  topicName,
  active = false,
  onClick,
}: {
  title: string;
  color: string;
  topicName: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const badgeColor = BADGE_COLOR_OVERRIDES[color] ?? color;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex flex-col gap-0.5 px-3 py-1 rounded-lg text-left transition-colors group',
        active
          ? 'bg-[var(--sidebar-button-active-bg)]'
          : 'hover:bg-[var(--surface-hover)]'
      )}
    >
      <span
        className="self-start rounded-[4px] text-[10px] font-medium leading-tight"
        style={{
          color: '#FFFFFF',
          backgroundColor: badgeColor,
          padding: '1px 6px',
        }}
      >
        {topicName}
      </span>
      <span className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
        {title}
      </span>
    </button>
  );
}

// --- Section label ---
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
      {children}
    </p>
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
  const router = useRouter();
  const pathname = usePathname();
  const isNewChatActive = pathname === '/conversation/demo';
  const isChatsActive = !isNewChatActive && (pathname === '/' || pathname.startsWith('/conversation/') || pathname.startsWith('/topic/'));
  const pinnedConversations = useMemo(
    () => ALL_CONVERSATIONS.filter((c) => c.pinned),
    []
  );

  const handleClick = (callback?: () => void) => {
    onNavigate?.();
    callback?.();
  };

  return (
    <>
      {/* Nav */}
      <nav className="flex flex-col gap-0.5 shrink-0">
        <NavItem
          icon={<Plus size={20} strokeWidth={1.5} />}
          label="New chat"
          active={isNewChatActive}
          onClick={() => handleClick(() => router.push('/conversation/demo'))}
        />
        <NavItem
          icon={<Search size={20} strokeWidth={1.5} />}
          label="Search"
          onClick={() => handleClick(onSearchClick)}
        />
        <NavItem
          icon={<MessageSquare size={20} strokeWidth={1.5} />}
          label="Chats"
          active={isChatsActive}
          onClick={() => handleClick(() => router.push('/'))}
        />
        <NavItem
          icon={<FolderClosed size={20} strokeWidth={1.5} />}
          label="Projects"
          onClick={() => handleClick()}
        />
        <NavItem
          icon={<ArtifactsIcon size={20} />}
          label="Artifacts"
          onClick={() => handleClick()}
        />
        <NavItem
          icon={<CodeIcon size={20} />}
          label="Code"
          onClick={() => handleClick()}
        />
      </nav>

      {/* Pinned conversations */}
      {pinnedConversations.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <SectionLabel>Pinned</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {pinnedConversations.map((conv) => {
              const topic = TOPICS.find((t) => t.id === conv.topicId);
              return (
                <PinnedItem
                  key={conv.id}
                  title={conv.title}
                  color={conv.color}
                  topicName={topic?.name ?? ''}
                  active={conv.id === activeConversationId}
                  onClick={() => {
                    onConversationClick?.(conv.id);
                    onNavigate?.();
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="flex flex-col gap-0.5 shrink-0 mt-auto pt-2">
        <ThemeToggle />
        <NavItem
          icon={<Settings size={20} strokeWidth={1.5} />}
          label="Settings"
          onClick={() => handleClick()}
        />
        <div className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
          <div className="w-7 h-7 rounded-full bg-[var(--accent-avatar)] shrink-0 flex items-center justify-center text-[12px] font-semibold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[14px] font-medium text-[var(--text-secondary)] truncate block">
              Amir
            </span>
            <span className="text-[11px] text-[var(--text-ghost)] truncate block">
              Max plan
            </span>
          </div>
        </div>
      </div>
    </>
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
  const isNewChatActive = pathname === '/conversation/demo';
  const isChatsActive = !isNewChatActive && (pathname === '/' || pathname.startsWith('/conversation/') || pathname.startsWith('/topic/'));
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

      {/* Nav icons */}
      <nav className="flex flex-col gap-1 mb-auto">
        <NavItemCollapsed
          icon={<Plus size={20} strokeWidth={1.5} />}
          label="New chat"
          active={isNewChatActive}
          onClick={() => router.push('/conversation/demo')}
        />
        <NavItemCollapsed
          icon={<Search size={20} strokeWidth={1.5} />}
          label="Search"
          onClick={onSearchClick}
        />
        <NavItemCollapsed
          icon={<MessageSquare size={20} strokeWidth={1.5} />}
          label="Chats"
          active={isChatsActive}
          onClick={() => router.push('/')}
        />
        <NavItemCollapsed
          icon={<FolderClosed size={20} strokeWidth={1.5} />}
          label="Projects"
        />
        <NavItemCollapsed
          icon={<ArtifactsIcon size={20} />}
          label="Artifacts"
        />
        <NavItemCollapsed
          icon={<CodeIcon size={20} />}
          label="Code"
        />
      </nav>

      {/* Bottom avatar */}
      <div
        className="w-7 h-7 rounded-full bg-[var(--accent-avatar)] shrink-0 cursor-pointer flex items-center justify-center text-[12px] font-semibold text-white"
        role="button"
        aria-label="User profile"
      >
        A
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

  return (
    <>
      {/* ===== DESKTOP (≥1024px) ===== */}
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.aside
            key="expanded"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex h-full bg-[var(--surface-sidebar)] border-r-[0.5px] border-[var(--border-secondary)] flex-col shrink-0 z-20 overflow-hidden"
          >
            <div className="w-[260px] flex flex-col h-full py-3 px-3">
              {/* Header: Claude wordmark + toggle */}
              <div className="flex items-center justify-between px-3 pb-3">
                <span
                  className="text-[18px] font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Claude
                </span>
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
            </div>
          </motion.aside>
        ) : (
          <motion.aside
            key="collapsed"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 52, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex h-full bg-[var(--surface-sidebar)] border-r-[0.5px] border-[var(--border-secondary)] flex-col items-center py-3 shrink-0 z-20 overflow-hidden"
          >
            <CollapsedContent
              onSearchClick={onSearchClick}
              onToggle={onToggle}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ===== MOBILE / TABLET (<1024px) ===== */}

      {/* Toggle button (only visible on mobile when sidebar is closed) */}
      {!isOpen && (
        <button
          aria-label="Open sidebar"
          onClick={onToggle}
          className="fixed top-3 left-3 z-30 w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors lg:hidden"
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
              className="fixed top-0 left-0 h-full w-[260px] bg-[var(--surface-sidebar)] border-r-[0.5px] border-[var(--border-secondary)] flex flex-col py-3 px-3 z-40 lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 pb-3">
                <span
                  className="text-[18px] font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Claude
                </span>
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