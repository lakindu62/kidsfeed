'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function DatePicker({
  date,
  setDate,
  className,
  buttonClassName,
  calendarClassName,
  contentClassName,
  compact = false,
  placeholder = 'Pick a date',
}) {
  const compactMode = compact === true;

  return (
    <Popover className={className}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            'data-[empty=true]:text-muted-foreground flex w-full min-w-0 items-center justify-start gap-2 overflow-hidden text-left',
            compactMode
              ? 'typography-body-sm h-10 rounded-[12px] px-3'
              : 'typography-body h-11 rounded-[14px] px-4',
            buttonClassName,
          )}
        >
          <CalendarIcon
            className={cn('shrink-0', compactMode ? 'h-3.5 w-3.5' : 'h-4 w-4')}
          />
          <span className="min-w-0 truncate">
            {date
              ? format(date, compactMode ? 'MMM d, yyyy' : 'PPP')
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={compactMode ? 'end' : 'center'}
        sideOffset={compactMode ? 8 : 4}
        className={cn(
          compactMode
            ? 'w-auto rounded-[18px] border p-2 shadow-xl'
            : 'w-auto p-0',
          contentClassName,
        )}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className={cn(
            compactMode ? 'bg-transparent p-0 [--cell-size:2.1rem]' : null,
            calendarClassName,
          )}
        />
      </PopoverContent>
    </Popover>
  );
}
