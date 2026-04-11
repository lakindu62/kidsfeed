import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

import {
  formatPackageSummary,
  formatQuantity,
  getExpiryStatusIcon,
  getExpiryStatusLabel,
  getExpiryStatusTone,
  getCategoryLabel,
  getItemId,
  getStatusIcon,
  getStatusLabel,
  getStatusTone,
} from '../lib';

function InventoryRowMedia({ item }) {
  if (item?.imageUrl) {
    return (
      <Avatar size="sm" className="h-14 w-14 ring-1 ring-[#e7ece4]">
        <AvatarImage src={item.imageUrl} alt={item?.name || 'Inventory item'} />
        <AvatarFallback className="bg-[linear-gradient(135deg,#ecf3ea_0%,#e0e8de_100%)] text-[#5f665f]">
          <Package className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar size="sm" className="h-14 w-14 ring-1 ring-[#e7ece4]">
      <AvatarFallback className="bg-[linear-gradient(135deg,#ecf3ea_0%,#e0e8de_100%)] text-[#5f665f]">
        <Package className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  );
}

export default function InventoryListRow({ item, onOpen }) {
  const itemId = getItemId(item);
  const categoryLabel = getCategoryLabel(item?.category);
  const statusLabel = getStatusLabel(item?.status);
  const expiryStatusLabel = getExpiryStatusLabel(item?.expiryStatus);
  const packageSummary = formatPackageSummary(item);
  const metaParts = [
    item?.brand,
    item?.barcode ? `Barcode ${item.barcode}` : '',
    packageSummary,
  ].filter(Boolean);

  return (
    <Card className="overflow-hidden rounded-[22px] border border-[#ecefe8] bg-white shadow-[0px_8px_18px_rgba(47,51,49,0.04)]">
      <CardContent className="grid gap-3 p-3 md:grid-cols-[56px_minmax(0,1fr)_auto] md:items-center md:gap-4 md:p-4">
        <div className="flex justify-start md:justify-center">
          <InventoryRowMedia item={item} />
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#005412] uppercase">
            {categoryLabel}
          </p>
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <h3 className="truncate text-[1.05rem] font-extrabold tracking-[-0.02em] text-[#181c1b]">
              {item?.name || 'Unnamed item'}
            </h3>
            <span className="hidden h-1 w-1 rounded-full bg-[#cfd5cc] sm:inline-flex" />
            <span className="truncate text-sm text-[#5f665f]">
              {formatQuantity(item)}
            </span>
          </div>
          {item?.description ? (
            <p className="line-clamp-1 max-w-3xl text-sm leading-5 text-[#5f665f]">
              {item.description}
            </p>
          ) : null}
          {metaParts.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#40493d]">
              {metaParts.map((part) => (
                <span
                  key={part}
                  className="inline-flex max-w-full items-center rounded-full bg-[#f3f4f0] px-2.5 py-1 font-medium"
                >
                  {part}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center md:gap-2">
          <div className="flex flex-col items-end gap-2">
            <Badge
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase hover:bg-inherit',
                getStatusTone(item?.status),
              )}
            >
              {getStatusIcon(item?.status)}
              {statusLabel}
            </Badge>
            {item?.expiryStatus !== undefined && item?.expiryStatus !== null ? (
              <Badge
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase hover:bg-inherit',
                  getExpiryStatusTone(item?.expiryStatus),
                )}
              >
                {getExpiryStatusIcon(item?.expiryStatus)}
                {expiryStatusLabel}
              </Badge>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-semibold"
            onClick={() => onOpen(itemId)}
            disabled={!itemId}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
