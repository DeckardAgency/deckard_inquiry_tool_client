import { Component, OnInit, EventEmitter, Output, Input, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarDate } from './calendar.types';

// Re-export for backward compatibility
export type { CalendarDate };

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit {
  @Input() selectedDate: Date | null = null;
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Input() isRange = false;
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() rangeSelected = new EventEmitter<{ start: Date, end: Date }>();
  @Output() closeCalendar = new EventEmitter<void>();

  daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  calendarDays: CalendarDate[] = [];
  currentMonth: Date = new Date();
  nextMonth: Date = new Date();

  // For range selection
  selectionInProgress = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeCalendar.emit();
    }
  }

  ngOnInit() {
    this.nextMonth = new Date(this.currentMonth);
    this.nextMonth.setMonth(this.nextMonth.getMonth() + 1);
    this.generateCalendarDays(this.currentMonth);
  }

  generateCalendarDays(month: Date): void {
    this.calendarDays = [];

    // Current month's days
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Calculate the first day to show (might be from previous month)
    const firstDayToShow = new Date(firstDayOfMonth);
    firstDayToShow.setDate(firstDayToShow.getDate() - firstDayOfMonth.getDay());

    // Generate six weeks of days to ensure we have enough for all month views
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(firstDayToShow);
      currentDate.setDate(currentDate.getDate() + i);

      const isCurrentMonth = currentDate.getMonth() === month.getMonth();
      const isToday = currentDate.getTime() === today.getTime();

      let isSelected = false;
      let isInRange = false;
      let isRangeStart = false;
      let isRangeEnd = false;

      if (this.selectedDate && !this.isRange) {
        isSelected = currentDate.getTime() === new Date(this.selectedDate).setHours(0,0,0,0);
      }

      if (this.isRange && this.startDate && this.endDate) {
        const startTime = new Date(this.startDate).setHours(0,0,0,0);
        const endTime = new Date(this.endDate).setHours(0,0,0,0);
        const currentTime = currentDate.getTime();

        isRangeStart = currentTime === startTime;
        isRangeEnd = currentTime === endTime;
        isInRange = currentTime >= startTime && currentTime <= endTime;
      } else if (this.isRange && this.startDate && !this.endDate) {
        isRangeStart = currentDate.getTime() === new Date(this.startDate).setHours(0,0,0,0);
      }

      this.calendarDays.push({
        date: currentDate,
        isCurrentMonth,
        isToday,
        isSelected,
        isInRange,
        isRangeStart,
        isRangeEnd
      });
    }
  }

  prevMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.nextMonth.setMonth(this.nextMonth.getMonth() - 1);
    this.generateCalendarDays(this.currentMonth);
  }

  nextMonthClick(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.nextMonth.setMonth(this.nextMonth.getMonth() + 1);
    this.generateCalendarDays(this.currentMonth);
  }

  selectDate(date: Date): void {
    if (!this.isRange) {
      this.selectedDate = date;
      this.dateSelected.emit(new Date(date));
      this.generateCalendarDays(this.currentMonth);
    } else {
      if (!this.selectionInProgress || !this.startDate) {
        // First click in range selection
        this.startDate = date;
        this.endDate = null;
        this.selectionInProgress = true;
      } else {
        // Second click in range selection
        if (date.getTime() < this.startDate!.getTime()) {
          // If clicked date is before start date, swap them
          this.endDate = new Date(this.startDate);
          this.startDate = date;
        } else {
          this.endDate = date;
        }
        this.selectionInProgress = false;
        this.rangeSelected.emit({ start: new Date(this.startDate!), end: new Date(this.endDate!) });
      }
      this.generateCalendarDays(this.currentMonth);
    }
  }

  getMonthName(date: Date): string {
    return date.toLocaleString('default', { month: 'long' }) + ' ' + date.getFullYear();
  }

  clearSelection(): void {
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.selectionInProgress = false;
    this.generateCalendarDays(this.currentMonth);
  }

  applySelection(): void {
    if (this.isRange && this.startDate && this.endDate) {
      this.rangeSelected.emit({ start: new Date(this.startDate), end: new Date(this.endDate) });
    } else if (!this.isRange && this.selectedDate) {
      this.dateSelected.emit(new Date(this.selectedDate));
    }
    this.closeCalendar.emit();
  }

  // TrackBy functions for performance
  trackByIndex(index: number): number {
    return index;
  }

  trackByDate(index: number, day: CalendarDate): string {
    return day.date.toISOString();
  }
}
