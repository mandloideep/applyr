# TanStack Table Setup Guide

This guide explains how to set up and use TanStack Table with filtering, sorting, and pagination.

## Architecture Overview

TanStack Table provides headless UI primitives for building tables:

```
1. Data & Types      → Define your data structure
2. Column Definitions → Configure columns with accessors, filters, sorting
3. Table Instance    → useReactTable() with row models
4. UI Components     → Render table, filters, pagination
```

## File Structure

```
src/
├── components/
│   └── table/
│       ├── DataTable.tsx       # Main table component
│       ├── DebouncedInput.tsx  # Search input with debounce
│       ├── Filter.tsx          # Column filter component
│       └── Pagination.tsx      # Pagination controls
├── lib/
│   └── table-utils.ts          # Fuzzy filter/sort utilities
```

---

## Step 1: Install Dependencies

```bash
pnpm add @tanstack/react-table @tanstack/match-sorter-utils
```

---

## Step 2: Define Data Types

**File: `src/types/table.ts`** (or use shared types from `packages/`)

```typescript
export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  status: "active" | "inactive" | "pending";
};
```

---

## Step 3: Create Table Utilities

### Fuzzy Filter & Sort Functions

**File: `src/lib/table-utils.ts`**

```typescript
import { compareItems, rankItem } from "@tanstack/match-sorter-utils";
import { sortingFns } from "@tanstack/react-table";
import type { FilterFn, SortingFn } from "@tanstack/react-table";
import type { RankingInfo } from "@tanstack/match-sorter-utils";

// Extend TanStack Table types for custom filter
declare module "@tanstack/react-table" {
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

/**
 * Custom fuzzy filter using match-sorter-utils
 * Ranks items by relevance and filters based on ranking
 */
export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store ranking info for sorting
  addMeta({ itemRank });

  // Return true if item passes the filter
  return itemRank.passed;
};

/**
 * Custom fuzzy sort that sorts by rank when available
 * Falls back to alphanumeric sorting
 */
export const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0;

  // Sort by rank if column has ranking metadata
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      rowB.columnFiltersMeta[columnId]?.itemRank!
    );
  }

  // Fallback to alphanumeric sort when ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};
```

---

## Step 4: Create Helper Components

### DebouncedInput Component

Prevents excessive re-renders during typing.

**File: `src/components/table/DebouncedInput.tsx`**

```typescript
import React from 'react'

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = React.useState(initialValue)

  // Sync with external value
  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Debounce the onChange callback
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

### Column Filter Component

**File: `src/components/table/Filter.tsx`**

```typescript
import type { Column } from '@tanstack/react-table'
import { DebouncedInput } from './DebouncedInput'

export function Filter({ column }: { column: Column<any, unknown> }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(value) => column.setFilterValue(value)}
      placeholder="Search..."
      className="w-full px-2 py-1 bg-gray-700 text-white rounded-md border border-gray-600"
    />
  )
}
```

---

## Step 5: Create the Data Table Component

**File: `src/components/table/DataTable.tsx`**

```typescript
import React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'

import { fuzzyFilter } from '@/lib/table-utils'
import { DebouncedInput } from './DebouncedInput'
import { Filter } from './Filter'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
}

export function DataTable<TData>({ data, columns }: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'fuzzy',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Global Search */}
      <DebouncedInput
        value={globalFilter ?? ''}
        onChange={(value) => setGlobalFilter(String(value))}
        className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700"
        placeholder="Search all columns..."
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm text-gray-200">
          <thead className="bg-gray-800 text-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan} className="px-4 py-3 text-left">
                    {header.isPlaceholder ? null : (
                      <>
                        {/* Sortable Header */}
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none hover:text-blue-400'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                        {/* Column Filter */}
                        {header.column.getCanFilter() && (
                          <div className="mt-2">
                            <Filter column={header.column} />
                          </div>
                        )}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-700">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-800">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center gap-2 text-gray-200">
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        <span className="flex items-center gap-1">
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="w-16 px-2 py-1 bg-gray-800 rounded-md border border-gray-700"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="px-2 py-1 bg-gray-800 rounded-md border border-gray-700"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>

      {/* Row Count */}
      <div className="text-gray-400">
        {table.getPrePaginationRowModel().rows.length} total rows
      </div>
    </div>
  )
}
```

---

## Step 6: Define Columns and Use the Table

### Example Usage in a Route

**File: `src/routes/users.tsx`**

```typescript
import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/table/DataTable'
import { fuzzySort } from '@/lib/table-utils'

export const Route = createFileRoute('/users')({
  component: UsersPage,
})

type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  status: 'active' | 'inactive'
}

function UsersPage() {
  const [data] = React.useState<User[]>([
    { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', status: 'inactive' },
    // ... more data
  ])

  const columns = React.useMemo<ColumnDef<User, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        filterFn: 'equalsString', // Exact match
      },
      {
        accessorKey: 'firstName',
        header: 'First Name',
        filterFn: 'includesStringSensitive', // Case-sensitive contains
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        filterFn: 'includesString', // Case-insensitive contains
      },
      {
        // Computed column
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: 'fullName',
        header: 'Full Name',
        filterFn: 'fuzzy', // Fuzzy search
        sortingFn: fuzzySort,
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string
          return (
            <span
              className={`px-2 py-1 rounded ${
                status === 'active' ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {status}
            </span>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <DataTable data={data} columns={columns} />
    </div>
  )
}
```

---

## Column Definition Options

### Filter Functions

| Filter Function           | Description                        |
| ------------------------- | ---------------------------------- |
| `equalsString`            | Exact string match                 |
| `includesString`          | Case-insensitive contains          |
| `includesStringSensitive` | Case-sensitive contains            |
| `fuzzy`                   | Fuzzy search with ranking (custom) |

### Column Configuration

```typescript
const columns: ColumnDef<User, any>[] = [
  // Simple accessor
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },

  // Custom accessor function
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: 'fullName', // Required when using accessorFn
    header: 'Full Name',
  },

  // Custom cell rendering
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  },

  // With custom filter and sort
  {
    accessorKey: 'name',
    filterFn: 'fuzzy',
    sortingFn: fuzzySort,
  },

  // Disable filtering/sorting
  {
    accessorKey: 'actions',
    enableColumnFilter: false,
    enableSorting: false,
  },
]
```

---

## Row Models

TanStack Table uses "row models" to process data:

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(), // Required: base rows
  getFilteredRowModel: getFilteredRowModel(), // Enable filtering
  getSortedRowModel: getSortedRowModel(), // Enable sorting
  getPaginationRowModel: getPaginationRowModel(), // Enable pagination
});
```

---

## Table State

Access and control table state:

```typescript
// Get current state
table.getState().pagination.pageIndex;
table.getState().pagination.pageSize;
table.getState().sorting;
table.getState().columnFilters;
table.getState().globalFilter;

// Control state
table.setPageIndex(0);
table.setPageSize(20);
table.setSorting([{ id: "name", desc: false }]);
table.setGlobalFilter("search term");

// Navigation helpers
table.getCanPreviousPage();
table.getCanNextPage();
table.previousPage();
table.nextPage();
table.getPageCount();
```

---

## Integrating with React Query

Fetch data with React Query and pass to table:

```typescript
import { useQuery } from '@tanstack/react-query'
import { usersQueries } from '@/services/users/queries'

function UsersPage() {
  const { data: users = [], isLoading } = useQuery(usersQueries.list())

  const columns = React.useMemo<ColumnDef<User, any>[]>(() => [
    // ... column definitions
  ], [])

  if (isLoading) return <div>Loading...</div>

  return <DataTable data={users} columns={columns} />
}
```

---

## Key Patterns Summary

| Pattern                                   | Description                                              |
| ----------------------------------------- | -------------------------------------------------------- |
| `useReactTable()`                         | Create table instance with data, columns, and row models |
| `flexRender()`                            | Render header/cell content from column definitions       |
| `table.getHeaderGroups()`                 | Get header rows for rendering                            |
| `table.getRowModel().rows`                | Get visible rows after filtering/pagination              |
| `header.column.getToggleSortingHandler()` | Click handler for sorting                                |
| `header.column.getIsSorted()`             | Current sort direction ('asc' / 'desc' / false)          |
| `column.setFilterValue()`                 | Set column filter value                                  |
| `fuzzyFilter` + `fuzzySort`               | Intelligent search with ranking                          |

---

## Row Selection

Enable users to select rows with checkboxes.

### Setup Row Selection

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import type { RowSelectionState } from '@tanstack/react-table'

function SelectableTable() {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const columns = React.useMemo<ColumnDef<User, any>[]>(
    () => [
      // Selection checkbox column
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      // ... other columns
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true, // Enable row selection
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Access selected rows
  const selectedRows = table.getSelectedRowModel().rows

  return (
    <div>
      <p>{selectedRows.length} rows selected</p>
      <button onClick={() => handleBulkAction(selectedRows)}>
        Bulk Action
      </button>
      {/* Table rendering... */}
    </div>
  )
}
```

### Row Selection APIs

| API                                       | Description                           |
| ----------------------------------------- | ------------------------------------- |
| `table.getIsAllRowsSelected()`            | Are all rows selected?                |
| `table.getIsSomeRowsSelected()`           | Are some (but not all) rows selected? |
| `table.getToggleAllRowsSelectedHandler()` | Handler to toggle all rows            |
| `row.getIsSelected()`                     | Is this row selected?                 |
| `row.getCanSelect()`                      | Can this row be selected?             |
| `row.getToggleSelectedHandler()`          | Handler to toggle this row            |
| `table.getSelectedRowModel().rows`        | Get all selected rows                 |
| `table.resetRowSelection()`               | Clear all selections                  |

---

## Column Visibility

Allow users to show/hide columns dynamically.

### Setup Column Visibility

```typescript
import type { VisibilityState } from '@tanstack/react-table'

function TableWithColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    email: false, // Hide email column by default
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      {/* Column visibility toggles */}
      <div className="flex gap-2 mb-4">
        {table.getAllLeafColumns().map((column) => (
          <label key={column.id} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={column.getIsVisible()}
              onChange={column.getToggleVisibilityHandler()}
            />
            {column.id}
          </label>
        ))}
      </div>

      {/* Render table using getVisibleLeafColumns */}
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Column Visibility APIs

| API                                   | Description                      |
| ------------------------------------- | -------------------------------- |
| `table.getAllLeafColumns()`           | Get all columns (for toggle UI)  |
| `table.getVisibleLeafColumns()`       | Get only visible columns         |
| `column.getIsVisible()`               | Is column visible?               |
| `column.getToggleVisibilityHandler()` | Handler to toggle visibility     |
| `column.toggleVisibility(value?)`     | Toggle or set visibility         |
| `row.getVisibleCells()`               | Get only visible cells for a row |

---

## Column Pinning

Pin columns to the left or right side of the table.

### Setup Column Pinning

```typescript
import type { ColumnPinningState } from '@tanstack/react-table'

function TableWithPinnedColumns() {
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: ['select', 'name'], // Pin to left
    right: ['actions'],        // Pin to right
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      columnPinning,
    },
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isPinned = header.column.getIsPinned()
                return (
                  <th
                    key={header.id}
                    style={{
                      position: isPinned ? 'sticky' : 'relative',
                      left: isPinned === 'left' ? `${header.getStart('left')}px` : undefined,
                      right: isPinned === 'right' ? `${header.getAfter('right')}px` : undefined,
                      backgroundColor: isPinned ? '#1f2937' : undefined,
                      zIndex: isPinned ? 1 : 0,
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {/* Pin/Unpin buttons */}
                    {!isPinned && (
                      <button onClick={() => header.column.pin('left')}>Pin Left</button>
                    )}
                    {isPinned && (
                      <button onClick={() => header.column.pin(false)}>Unpin</button>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        {/* Body with same pinning styles... */}
      </table>
    </div>
  )
}
```

### Column Pinning APIs

| API                            | Description                             |
| ------------------------------ | --------------------------------------- |
| `column.getIsPinned()`         | Returns 'left', 'right', or false       |
| `column.pin(position)`         | Pin column ('left', 'right', or false)  |
| `header.getStart('left')`      | Get left offset for sticky positioning  |
| `header.getAfter('right')`     | Get right offset for sticky positioning |
| `table.getLeftLeafColumns()`   | Get left-pinned columns                 |
| `table.getRightLeafColumns()`  | Get right-pinned columns                |
| `table.getCenterLeafColumns()` | Get unpinned columns                    |

---

## Expanding Rows / Sub-Rows

Display nested data with expandable rows.

### Setup with Sub-Rows

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table'
import type { ExpandedState } from '@tanstack/react-table'

type Department = {
  id: number
  name: string
  manager: string
  employees?: Department[] // Sub-rows
}

function ExpandableTable() {
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const data: Department[] = [
    {
      id: 1,
      name: 'Engineering',
      manager: 'Alice',
      employees: [
        { id: 11, name: 'Frontend', manager: 'Bob' },
        { id: 12, name: 'Backend', manager: 'Charlie' },
      ],
    },
    // ...
  ]

  const columns = React.useMemo<ColumnDef<Department, any>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          if (!row.getCanExpand()) return null
          return (
            <button onClick={row.getToggleExpandedHandler()}>
              {row.getIsExpanded() ? '▼' : '▶'}
            </button>
          )
        },
      },
      {
        accessorKey: 'name',
        header: 'Department',
        cell: ({ row, getValue }) => (
          <span style={{ paddingLeft: `${row.depth * 20}px` }}>
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'manager',
        header: 'Manager',
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.employees, // Tell table where sub-rows are
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <table>
      {/* Render table... */}
    </table>
  )
}
```

### Expanding APIs

| API                              | Description                     |
| -------------------------------- | ------------------------------- |
| `row.getCanExpand()`             | Does row have sub-rows?         |
| `row.getIsExpanded()`            | Is row expanded?                |
| `row.getToggleExpandedHandler()` | Handler to toggle expansion     |
| `row.toggleExpanded(value?)`     | Toggle or set expanded state    |
| `row.depth`                      | Nesting depth (0 = root)        |
| `row.subRows`                    | Array of sub-rows               |
| `table.getExpandedRowModel()`    | Get rows with expansion applied |
| `table.toggleAllRowsExpanded()`  | Expand/collapse all rows        |

---

## Grouping & Aggregation

Group rows by column values and aggregate data.

### Setup Grouping

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table'
import type { GroupingState } from '@tanstack/react-table'

function GroupedTable() {
  const [grouping, setGrouping] = React.useState<GroupingState>(['status'])

  const columns = React.useMemo<ColumnDef<User, any>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        // Enable grouping for this column
        enableGrouping: true,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'salary',
        header: 'Salary',
        // Aggregate function for grouped rows
        aggregationFn: 'sum',
        aggregatedCell: ({ getValue }) => `Total: $${getValue()}`,
      },
      {
        accessorKey: 'age',
        header: 'Age',
        aggregationFn: 'mean',
        aggregatedCell: ({ getValue }) => `Avg: ${Math.round(getValue())}`,
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
      expanded: true, // Auto-expand all groups
    },
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div>
      {/* Group by dropdown */}
      <select
        value={grouping[0] || ''}
        onChange={(e) => setGrouping(e.target.value ? [e.target.value] : [])}
      >
        <option value="">No grouping</option>
        <option value="status">Group by Status</option>
        <option value="department">Group by Department</option>
      </select>

      <table>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {/* Different rendering for grouped vs regular rows */}
                  {cell.getIsGrouped() ? (
                    // Grouped cell (show expander + count)
                    <button onClick={row.getToggleExpandedHandler()}>
                      {row.getIsExpanded() ? '▼' : '▶'}{' '}
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}{' '}
                      ({row.subRows.length})
                    </button>
                  ) : cell.getIsAggregated() ? (
                    // Aggregated cell (show aggregate value)
                    flexRender(
                      cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                      cell.getContext(),
                    )
                  ) : cell.getIsPlaceholder() ? null : (
                    // Regular cell
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Built-in Aggregation Functions

| Function      | Description            |
| ------------- | ---------------------- |
| `sum`         | Sum of values          |
| `min`         | Minimum value          |
| `max`         | Maximum value          |
| `extent`      | [min, max] tuple       |
| `mean`        | Average value          |
| `median`      | Median value           |
| `unique`      | Array of unique values |
| `uniqueCount` | Count of unique values |
| `count`       | Count of rows          |

### Custom Aggregation Function

```typescript
{
  accessorKey: 'status',
  aggregationFn: (columnId, leafRows, childRows) => {
    // Return custom aggregated value
    const activeCount = leafRows.filter(row => row.original.status === 'active').length
    return `${activeCount}/${leafRows.length} active`
  },
}
```

### Grouping APIs

| API                                 | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `cell.getIsGrouped()`               | Is this the grouped column cell?         |
| `cell.getIsAggregated()`            | Is this an aggregated cell?              |
| `cell.getIsPlaceholder()`           | Is this a placeholder (hidden in group)? |
| `column.getCanGroup()`              | Can this column be grouped?              |
| `column.getIsGrouped()`             | Is this column currently grouped?        |
| `column.getToggleGroupingHandler()` | Handler to toggle grouping               |
| `row.getIsGrouped()`                | Is this a group row?                     |
| `row.groupingColumnId`              | Column ID this row is grouped by         |
| `row.groupingValue`                 | Value this row is grouped by             |

---

## Display Columns

Add columns for actions, checkboxes, or other non-data content.

```typescript
const columns: ColumnDef<User, any>[] = [
  // Selection column
  {
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableSorting: false,
    enableColumnFilter: false,
  },

  // Data columns...
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },

  // Actions column
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(row.original)}>Edit</button>
        <button onClick={() => handleDelete(row.original.id)}>Delete</button>
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
]
```

---

## Server-Side Operations

For large datasets, handle filtering/sorting/pagination on the server.

```typescript
function ServerSideTable() {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  // Fetch data from server with current state
  const { data, isLoading } = useQuery({
    queryKey: ['users', pagination, sorting, columnFilters],
    queryFn: () => fetchUsers({
      page: pagination.pageIndex,
      limit: pagination.pageSize,
      sortBy: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      filters: columnFilters,
    }),
  })

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    pageCount: data?.pageCount ?? -1,
    state: {
      pagination,
      sorting,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // Don't use client-side row models for server-side
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  return <DataTable table={table} isLoading={isLoading} />
}
```

### Manual Mode Options

| Option                   | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `manualPagination: true` | Disable client-side pagination                    |
| `manualSorting: true`    | Disable client-side sorting                       |
| `manualFiltering: true`  | Disable client-side filtering                     |
| `manualGrouping: true`   | Disable client-side grouping                      |
| `pageCount`              | Total page count (required for manual pagination) |
