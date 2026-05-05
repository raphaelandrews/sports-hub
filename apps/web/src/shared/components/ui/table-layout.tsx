import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@sports-system/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sports-system/ui/components/input-group";
import { Separator } from "@sports-system/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { SearchIcon, XIcon } from "lucide-react";
import * as m from "@/paraglide/messages";

interface TableLayoutProps<TData> {
  title?: string;
  countLabel?: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  headerActions?: React.ReactNode;
  filterActions?: React.ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function TableLayout<TData>({
  columns,
  data,
  emptyMessage = m["search.noResults"](),
  searchPlaceholder = m["common.table.searchPlaceholder"](),
  searchQuery,
  onSearchChange,
  headerActions,
  filterActions,
  activeFilterCount = 0,
  onClearFilters,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  onPageSizeChange,
}: TableLayoutProps<TData>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter: searchQuery,
      pagination,
    },
    onGlobalFilterChange: onSearchChange,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const totalCount = table.getFilteredRowModel().rows.length;
  const currentPageSize = table.getState().pagination.pageSize;
  const currentPageIndex = table.getState().pagination.pageIndex;

  return (
    <>
      <header className="mb-1 flex items-end justify-between gap-4">
        {headerActions ? (
          <div className="flex items-center gap-2">{headerActions}</div>
        ) : null}
      </header>

      <div className="rounded-xl bg-card shadow-xs/5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <InputGroup className="w-64">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label={m["common.actions.clearAria"]()}
                  title={m["common.actions.clearTitle"]()}
                  size="icon-xs"
                  onClick={() => onSearchChange("")}
                >
                  <XIcon className="size-3.5" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {filterActions ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-6" />
              {filterActions}
            </>
          ) : null}

          {activeFilterCount > 0 && onClearFilters ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={onClearFilters}
            >
              <XIcon className="size-3.5 mr-1" />
              {m["common.actions.clearFilters"]()}
            </Button>
          ) : null}

          <span className="ms-auto text-muted-foreground text-xs">
            <span className="text-foreground">
              {activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""}
            </span>{" "}
            ativo{activeFilterCount !== 1 ? "s" : ""}
          </span>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      (header.column.columnDef.meta as { className?: string } | undefined)
                        ?.className
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        (cell.column.columnDef.meta as { className?: string } | undefined)
                          ?.className
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Exibir</span>
            <select
              className="h-8 rounded-md border bg-transparent px-2 text-sm"
              value={currentPageSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                table.setPageSize(size);
                onPageSizeChange?.(size);
              }}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span>por página</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "0"
              : `${currentPageIndex * currentPageSize + 1} - ${Math.min(
                  (currentPageIndex + 1) * currentPageSize,
                  totalCount,
                )}`}{" "}
            de {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
