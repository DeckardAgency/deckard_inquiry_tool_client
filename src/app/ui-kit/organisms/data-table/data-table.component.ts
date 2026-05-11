import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ContentChild,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShimmerComponent } from '../../atoms/shimmer/shimmer.component';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state.component';
import { PaginationComponent } from '../../molecules/pagination/pagination.component';
import { CheckboxComponent } from '../../atoms/checkbox/checkbox.component';

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  cellTemplate?: TemplateRef<{ $implicit: T; row: T; column: TableColumn<T> }>;
  headerTemplate?: TemplateRef<{ $implicit: TableColumn<T> }>;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

@Component({
  selector: 'ui-data-table',
  standalone: true,
  imports: [CommonModule, ShimmerComponent, EmptyStateComponent, PaginationComponent, CheckboxComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() loadingRows = 5;
  @Input() selectable = false;
  @Input() stickyHeader = false;
  @Input() striped = false;
  @Input() hoverable = true;
  @Input() bordered = false;
  @Input() compact = false;

  // Pagination
  @Input() paginated = false;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() currentPage = 1;

  // Empty state
  @Input() emptyTitle = 'No data found';
  @Input() emptyDescription = '';
  @Input() emptyIcon: 'inbox' | 'search' | 'file' = 'inbox';

  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() sortChange = new EventEmitter<SortConfig>();
  @Output() pageChange = new EventEmitter<number>();

  @ContentChild('rowActions') rowActionsTemplate?: TemplateRef<{ $implicit: T }>;

  protected selectedRows = signal<Set<T>>(new Set());
  protected sortConfig = signal<SortConfig>({ column: '', direction: null });

  protected allSelected = computed(() => {
    const selected = this.selectedRows();
    return this.data.length > 0 && selected.size === this.data.length;
  });

  protected someSelected = computed(() => {
    const selected = this.selectedRows();
    return selected.size > 0 && selected.size < this.data.length;
  });

  get tableClasses(): string[] {
    const classes = ['ui-data-table'];

    if (this.stickyHeader) classes.push('ui-data-table--sticky-header');
    if (this.striped) classes.push('ui-data-table--striped');
    if (this.hoverable) classes.push('ui-data-table--hoverable');
    if (this.bordered) classes.push('ui-data-table--bordered');
    if (this.compact) classes.push('ui-data-table--compact');

    return classes;
  }

  getLoadingRows(): number[] {
    return Array(this.loadingRows).fill(0).map((_, i) => i);
  }

  getCellValue(row: T, column: TableColumn<T>): unknown {
    return row[column.key];
  }

  onHeaderClick(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const currentSort = this.sortConfig();
    let newDirection: SortDirection = 'asc';

    if (currentSort.column === column.key) {
      if (currentSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (currentSort.direction === 'desc') {
        newDirection = null;
      }
    }

    const newConfig: SortConfig = {
      column: newDirection ? column.key : '',
      direction: newDirection
    };

    this.sortConfig.set(newConfig);
    this.sortChange.emit(newConfig);
  }

  getSortIcon(column: TableColumn<T>): 'asc' | 'desc' | 'none' {
    const sort = this.sortConfig();
    if (sort.column !== column.key || !sort.direction) return 'none';
    return sort.direction;
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  toggleRowSelection(row: T): void {
    this.selectedRows.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(row)) {
        newSet.delete(row);
      } else {
        newSet.add(row);
      }
      return newSet;
    });

    this.emitSelectionChange();
  }

  toggleAllSelection(): void {
    if (this.allSelected()) {
      this.selectedRows.set(new Set());
    } else {
      this.selectedRows.set(new Set(this.data));
    }

    this.emitSelectionChange();
  }

  isRowSelected(row: T): boolean {
    return this.selectedRows().has(row);
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  private emitSelectionChange(): void {
    this.selectionChange.emit(Array.from(this.selectedRows()));
  }

  trackByColumn(index: number, column: TableColumn<T>): string {
    return column.key;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
