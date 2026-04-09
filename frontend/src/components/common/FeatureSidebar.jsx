import { cloneElement, isValidElement } from 'react';
import { CircleHelp, LogOut } from 'lucide-react';
import { DEFAULT_FOOTER_ACTIONS } from './configs/defaults';

// const DEFAULT_FOOTER_ACTIONS = [
//   { key: 'support', label: 'Support', icon: CircleHelp },
//   { key: 'logout', label: 'Log Out', icon: LogOut },
// ];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function renderIcon(icon, className) {
  if (!icon) {
    return null;
  }

  if (isValidElement(icon)) {
    return cloneElement(icon, {
      className: cx(className, icon.props.className),
      'aria-hidden': true,
    });
  }

  if (typeof icon === 'function') {
    const Icon = icon;
    return <Icon className={className} aria-hidden />;
  }

  return null;
}

function SidebarLink({ item, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      disabled={item.disabled}
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        'flex min-h-11 w-full items-center gap-3 rounded-r-full px-6 py-3 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#166534] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f5f4] focus-visible:outline-none',
        isActive
          ? 'bg-white text-[#166534] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'
          : 'text-stone-600 hover:bg-stone-100',
        item.disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {renderIcon(item.icon, 'h-[18px] w-[18px] shrink-0')}
      <span className="truncate">{item.label}</span>
    </button>
  );
}

function FooterAction({ action, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(action)}
      disabled={action.disabled}
      className={cx(
        'flex h-9 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-normal text-stone-500 transition-colors hover:bg-stone-200 focus-visible:ring-2 focus-visible:ring-[#166534] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f5f4] focus-visible:outline-none',
        action.disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {renderIcon(action.icon, 'h-[18px] w-[18px] shrink-0')}
      <span>{action.label}</span>
    </button>
  );
}

export default function FeatureSidebar({
  brandTitle = 'KIDFEED',
  featureLabel = '',
  sections = [],
  items = [],
  activeItemKey,
  onItemSelect,
  onFooterAction,
  footerActions = DEFAULT_FOOTER_ACTIONS,
  primaryCta = null,
  className,
}) {
  const normalizedSections =
    sections.length > 0 ? sections : [{ key: 'main', items }];

  const visibleSections = normalizedSections
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => item?.visible !== false),
    }))
    .filter((section) => section.items.length > 0);

  const visibleFooterActions = (footerActions || []).filter(
    (action) => action?.visible !== false,
  );

  const handleItemSelect = (item) => {
    if (!item || item.disabled) {
      return;
    }

    if (typeof item.onClick === 'function') {
      item.onClick(item);
      return;
    }

    if (typeof onItemSelect === 'function') {
      onItemSelect(item);
    }
  };

  const handleFooterAction = (action) => {
    if (!action || action.disabled) {
      return;
    }

    if (typeof action.onClick === 'function') {
      action.onClick(action);
      return;
    }

    if (typeof onFooterAction === 'function') {
      onFooterAction(action);
    }
  };

  return (
    <aside
      className={cx(
        'sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#f5f5f4] py-6',
        className,
      )}
    >
      <div className="px-6 pb-6">
        <p className="text-xl leading-7 font-semibold text-stone-900">
          {brandTitle}
        </p>
        <p className="text-xs font-semibold tracking-[1.2px] text-stone-500 uppercase">
          {featureLabel}
        </p>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 pt-2"
        aria-label="Sidebar navigation"
      >
        {visibleSections.map((section, index) => (
          <div
            key={section.key || `section-${index}`}
            className={index > 0 ? 'mt-1' : ''}
          >
            {section.items.map((item) => (
              <SidebarLink
                key={item.key}
                item={item}
                isActive={item.key === activeItemKey}
                onSelect={handleItemSelect}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-[#e7e5e480] px-6 pt-6.25">
        {primaryCta?.visible !== false && primaryCta?.label ? (
          <button
            type="button"
            onClick={() => handleFooterAction(primaryCta)}
            disabled={primaryCta.disabled}
            className={cx(
              'mb-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#006117] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#005414] focus-visible:ring-2 focus-visible:ring-[#166534] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f5f4] focus-visible:outline-none',
              primaryCta.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {renderIcon(primaryCta.icon, 'h-4 w-4')}
            <span>{primaryCta.label}</span>
          </button>
        ) : null}

        {visibleFooterActions.map((action, index) => (
          <div
            key={action.key || `footer-${index}`}
            className={index > 0 ? 'mt-1' : ''}
          >
            <FooterAction action={action} onSelect={handleFooterAction} />
          </div>
        ))}
      </div>
    </aside>
  );
}
