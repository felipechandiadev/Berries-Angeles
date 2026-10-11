'use client'
import React, { useState, useContext } from 'react';
import Image from 'next/image';
import { Menu, ImageOff, Image as ImageIcon } from 'lucide-react';
import SideBar, { SideBarMenuItem } from './SideBar';
import UserProfileDropdown from '@/app/home/users/ui/UserProfileDropdown';
import PrinterSetupButton from './PrinterSetupButton';

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
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const open = () => setShowSidebar(true);
  const close = () => setShowSidebar(false);

  return (
    <SideBarContext.Provider value={{ open, close, isOpen: showSidebar }}>
        <div data-test-id="top-bar-root">
      <header className={`fixed top-0 z-30 w-full flex items-center justify-between px-page py-2 pb-3 bg-background border-b-[2px] border-primary ${className}`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={open}
              className="rounded-full transition-colors text-foreground hover:text-secondary focus:outline-none"
              data-test-id="top-bar-menu-button"
              aria-label="Abrir menú"
            >
              <Menu size={36} className="cursor-pointer" aria-hidden />
            </button>
          </div>

          {/* Right side: printer, user, logo */}
          <div className="flex items-center gap-2">
            <PrinterSetupButton />

            {showUserButton && (
              <UserProfileDropdown />
            )}

            {logoSrc ? (
              <>
                {(!logoLoaded || logoError) && (
                  <div className="h-10 w-10 bg-neutral-300 rounded-lg flex items-center justify-center" data-test-id="top-bar-logo-skeleton">
                    {logoError && (
                      <ImageOff size={20} className="text-neutral-400" aria-hidden />
                    )}
                  </div>
                )}
                {!logoError && (
                  <Image
                    src={logoSrc}
                    alt="Logo"
                    width={40}
                    height={40}
                    className={`h-10 w-10 object-contain transition-opacity duration-300 ${!logoLoaded ? 'opacity-0 absolute' : 'opacity-100'}`}
                    data-test-id="top-bar-logo"
                    onLoadingComplete={() => setLogoLoaded(true)}
                    onError={() => setLogoError(true)}
                  />
                )}
              </>
            ) : (
              <div className="h-10 w-10 bg-neutral-300 rounded-lg flex items-center justify-center" data-test-id="top-bar-logo-placeholder">
                <ImageIcon size={20} className="text-neutral-400" aria-hidden />
              </div>
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
