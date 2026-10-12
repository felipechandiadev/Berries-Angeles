'use client'
import React, { useState, useContext, useEffect } from 'react';
import Image from 'next/image';
import { Menu, ImageOff } from 'lucide-react';
import SideBar, { SideBarMenuItem } from './SideBar';
import UserProfileDropdown from '@/app/home/users/ui/UserProfileDropdown';
import PrinterSetupButton from './PrinterSetupButton';
import { TopBarLogoSkeleton } from './TopBarIconSkeleton';

interface TopBarProps {
  logoSrc?: string;
  className?: string;
  onMenuClick?: () => void;
  SideBarComponent?: React.ComponentType<{ onClose: () => void }>;
  menuItems?: SideBarMenuItem[]; // if provided, TopBar will render SideBar internally
  // New props for user profile
  showUserButton?: boolean;
}

interface SideBarControl {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const SideBarContext = React.createContext<SideBarControl>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export function useSideBar() {
  return useContext(SideBarContext);
}

const TopBar: React.FC<TopBarProps> = ({
  logoSrc,
  className,
  SideBarComponent,
  menuItems = [],
  showUserButton = false,
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Defer Image mount so the brand-mark skeleton paints at least one frame
  // (cached Next/Image often completes before first paint).
  useEffect(() => {
    setLogoReady(true);
  }, []);

  const open = () => setShowSidebar(true);
  const close = () => setShowSidebar(false);
  const showLogoSkeleton = !logoReady || !logoLoaded || logoError;

  return (
    <SideBarContext.Provider value={{ open, close, isOpen: showSidebar }}>
        <div data-test-id="top-bar-root">
      <header className={`fixed top-0 z-30 w-full flex items-center justify-between px-page py-1.5 bg-background border-b border-border ${className}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={open}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors text-foreground hover:text-secondary focus:outline-none"
              data-test-id="top-bar-menu-button"
              aria-label="Abrir menú"
            >
              <Menu size={24} strokeWidth={2.5} className="cursor-pointer" aria-hidden />
            </button>
          </div>

          {/* Right side: printer, user, logo */}
          <div className="flex items-center gap-1.5">
            <PrinterSetupButton />

            {showUserButton && (
              <UserProfileDropdown />
            )}

            {logoSrc ? (
              <div className="relative h-8 w-8 shrink-0" data-test-id="top-bar-logo-box">
                {showLogoSkeleton ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {logoError ? (
                      <ImageOff size={16} className="text-neutral-400" aria-hidden />
                    ) : (
                      <TopBarLogoSkeleton />
                    )}
                  </div>
                ) : null}
                {logoReady && !logoError ? (
                  <Image
                    src={logoSrc}
                    alt="Logo"
                    width={32}
                    height={32}
                    className={`h-8 w-8 object-contain transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                    data-test-id="top-bar-logo"
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoError(true)}
                  />
                ) : null}
              </div>
            ) : (
              <TopBarLogoSkeleton />
            )}
          </div>
        </header>
        {/* Renderizar SideBar como modal, solo si showSidebar está activo */}
        {showSidebar && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/10"
              onClick={close}
              aria-label="Cerrar menú lateral"
              data-test-id="sidebar-overlay"
            />
            <SideBar menuItems={menuItems} onClose={close} logoUrl={logoSrc} />
          </>
        )}
        {/* Children se renderizan fuera de TopBar, en el layout */}
      </div>
    </SideBarContext.Provider>
  );
};

export default TopBar;
