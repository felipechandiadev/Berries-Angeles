import React, { useEffect, useState, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
// Logo removed from sidebar per request
import { Button } from '../Button/Button';

/** Fondo primary con transparencia (CSS vars no soportan bien bg-primary/15 en TW). */
const MENU_ITEM_BASE =
  'w-full text-left px-4 py-2 rounded-lg text-foreground font-medium cursor-pointer text-sm transition-colors duration-200 focus-visible:outline-none';
/** Hover/focus más suave; distinto del active de ruta. */
const MENU_ITEM_INTERACTIVE =
  'hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] focus-visible:outline-none active:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]';
/** Ruta actual: secondary (verde) con transparencia. */
const MENU_ITEM_ACTIVE =
  'bg-[color-mix(in_srgb,var(--color-secondary)_28%,transparent)]';
/** Active + hover: secondary un poco más intenso. */
const MENU_ITEM_ACTIVE_HOVER =
  'hover:bg-[color-mix(in_srgb,var(--color-secondary)_38%,transparent)]';

function pathMatches(pathname: string, url?: string) {
  if (!url) return false;
  if (url === '/home') return pathname === '/home';
  return pathname === url || pathname.startsWith(`${url}/`);
}

export interface SideBarMenuItem {
  id?: string;
  label: string;
  url?: string;
  children?: SideBarMenuItem[];
}

interface SideBarProps {
  menuItems: SideBarMenuItem[];
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  logoUrl?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  operator: 'Operador',
  inspector: 'Inspector',
  director: 'Director',
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'App';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';

const SideBar: React.FC<SideBarProps> = ({ menuItems, className, style, onClose, logoUrl }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [isPending, startTransition] = useTransition();

  // Track which parent items are open using their id or label
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const isItemActive = (url?: string) => pathMatches(pathname, url);

  useEffect(() => {
    setOpenIds((prev) => {
      const next = { ...prev };
      let changed = false;
      menuItems.forEach((item, idx) => {
        if (!item.children?.length) return;
        const id = item.id ?? `${item.label}-${idx}`;
        if (item.children.some((child) => pathMatches(pathname, child.url)) && !next[id]) {
          next[id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // menuItems is stable enough for open-on-route; avoid depending on new array identity each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const menuItemClassName = (url?: string) => {
    const active = isItemActive(url);
    return [
      MENU_ITEM_BASE,
      active ? MENU_ITEM_ACTIVE : '',
      active ? MENU_ITEM_ACTIVE_HOVER : MENU_ITEM_INTERACTIVE,
    ]
      .filter(Boolean)
      .join(' ');
  };

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavigate = (url?: string) => {
    if (!url) return;
    // Close sidebar BEFORE navigating for faster perceived response
    if (typeof onClose === 'function') onClose();
    // Navigate with startTransition to avoid blocking the UI
    startTransition(() => {
      router.push(url);
    });
  };

  const renderMenuItem = (item: SideBarMenuItem, idx: number) => {
    const id = item.id ?? `${item.label}-${idx}`;
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;

    if (hasChildren) {
      const isOpen = !!openIds[id];
      const childActive = item.children!.some((child) => isItemActive(child.url));
      return (
        <li key={id}>
          <button
            className={`${MENU_ITEM_BASE} ${childActive ? `${MENU_ITEM_ACTIVE} ${MENU_ITEM_ACTIVE_HOVER}` : MENU_ITEM_INTERACTIVE} flex items-center justify-between`}
            onClick={() => toggleOpen(id)}
            aria-expanded={isOpen}
            data-test-id={`side-bar-parent-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span>{item.label}</span>
            <svg
              className={`h-4 w-4 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <ul className={`pl-6 space-y-1 mt-1 ${isOpen ? '' : 'hidden'}`}>
            {item.children!.map((child, cIdx) => (
              <li key={(child.id ?? `${child.label}-${cIdx}`)}>
                <button
                  className={menuItemClassName(child.url)}
                  onClick={() => handleNavigate(child.url)}
                  data-test-id={`side-bar-child-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                  aria-current={isItemActive(child.url) ? 'page' : undefined}
                >
                  {child.label}
                </button>
              </li>
            ))}
          </ul>
        </li>
      );
    }

    return (
      <li key={id}>
        <button
          className={menuItemClassName(item.url)}
          onClick={() => handleNavigate(item.url)}
          data-test-id={`side-bar-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          aria-current={isItemActive(item.url) ? 'page' : undefined}
        >
          {item.label}
        </button>
      </li>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 w-64 h-full bg-white/60 backdrop-blur backdrop-saturate-150 text-black flex flex-col items-center py-6 shadow-xl border border-white/20 ${className ? className : ''}`}
      style={style}
      data-test-id="side-bar-root"
    >
      <div className="mb-6 text-center">
        {logoUrl ? (
          <div className="">
            {(!logoLoaded || logoError) && (
              <div className="h-20 w-20 bg-neutral-300 rounded-lg flex items-center justify-center mx-auto mb-2" data-test-id="side-bar-logo-skeleton">
                {logoError && (
                  <span className="text-neutral-400 text-sm">Sin logo</span>
                )}
              </div>
            )}
            {!logoError && (
              <img
                src={logoUrl}
                alt={`${APP_NAME} Logo`}
                className={`h-20 w-auto mx-auto object-contain transition-opacity duration-300 ${!logoLoaded ? 'opacity-0 absolute' : 'opacity-100'}`}
                data-test-id="side-bar-logo"
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoError(true)}
              />
            )}
          </div>
        ) : null}
        {/* <div className="text-xl font-bold" data-test-id="side-bar-app-name">{APP_NAME}</div> */}
        {/* <div className="text-sm opacity-70" data-test-id="side-bar-app-version">{'1.2.12'}</div> */}
      </div>
{/* 
      {user && (() => {
        const u = user as unknown as { userName?: string; role?: string };
        return (
          <div className="w-full px-page mb-6">
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 gap-3" style={{ background: 'transparent', borderWidth: '0.3px' }}>
              <span className="material-symbols-outlined text-black text-3xl">person</span>
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold truncate">{u.userName}</span>
                <span className="text-xs opacity-60 capitalize truncate">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}</span>
              </div>
            </div>
          </div>
        );
      })()} */}

      <nav className="w-full px-4 flex-1 mt-2 overflow-y-auto">
        <ul className="flex flex-col gap-2 w-full">
          {menuItems.map((item, idx) => renderMenuItem(item, idx))}
        </ul>
      </nav>

      <div className="w-full mt-auto px-page pb-2">
        <Button
          variant="outlined"
          className="w-full"
          onClick={() => signOut({ callbackUrl: '/' })}
          data-test-id="side-bar-logout-btn"
        >
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
};

export default SideBar;
