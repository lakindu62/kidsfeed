import { ChevronRight } from 'lucide-react';

/**
 * @param {{ items: Array<{ label: string, href?: string }> }} props
 * items — ordered list of crumbs; the last one is treated as the active page.
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center">
            {isLast ? (
              <span
                aria-current="page"
                className="text-xs font-medium text-[#19e65e]"
              >
                {item.label}
              </span>
            ) : (
              <a
                href={item.href ?? '#'}
                className="text-xs font-medium text-[#64748b] transition-colors hover:text-[#475569]"
              >
                {item.label}
              </a>
            )}

            {!isLast && (
              <ChevronRight className="mx-1 h-3 w-3 text-[#64748b]" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
