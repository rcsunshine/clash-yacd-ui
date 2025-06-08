import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import cx from 'clsx';
import { formatDistance } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';

import prettyBytes from '../misc/pretty-bytes';
import s from './ConnectionTable.module.scss';
import { MutableConnRefCtx } from './conns/ConnCtx';

const COLUMN_SORT = [{ id: 'id', desc: true }];

function Table({ data }: { data: any }) {
  const { t } = useTranslation();
  const connCtx = React.useContext(MutableConnRefCtx);
  const [sorting, setSorting] = React.useState<SortingState>(COLUMN_SORT);

  const fullColumns = React.useMemo(() => [
  { header: 'Id', accessorKey: 'id' },
  { 
      header: t('Host'), 
    accessorKey: 'host',
    cell: (info: any) => (
      <div className="d-flex align-items-center" style={{ minWidth: '180px' }}>
        <i className="ti ti-world me-2 text-muted"></i>
        <span className="text-truncate" style={{ maxWidth: '150px' }} title={info.getValue()}>
          {info.getValue()}
        </span>
      </div>
    )
  },
  { 
      header: t('Process'), 
    accessorKey: 'process',
    cell: (info: any) => (
      <div className="d-flex align-items-center">
        <i className="ti ti-app-window me-2 text-muted"></i>
        <span className="text-truncate" style={{ maxWidth: '150px' }}>
          {info.getValue()}
        </span>
      </div>
    )
  },
  {
      header: t('Download'),
    accessorKey: 'download',
    cell: (info: any) => (
      <span className="badge badge-outline text-info">
        <i className="ti ti-download me-1"></i>
        {prettyBytes(info.getValue())}
      </span>
    ),
  },
  {
      header: t('Upload'),
    accessorKey: 'upload',
    cell: (info: any) => (
      <span className="badge badge-outline text-success">
        <i className="ti ti-upload me-1"></i>
        {prettyBytes(info.getValue())}
      </span>
    ),
  },
  {
      header: t('DL Speed'),
    accessorKey: 'downloadSpeedCurr',
    cell: (info: any) => (
      <span className="text-info fw-medium">
        {prettyBytes(info.getValue())}/s
      </span>
    ),
  },
  {
      header: t('UL Speed'),
    accessorKey: 'uploadSpeedCurr',
    cell: (info: any) => (
      <span className="text-success fw-medium">
        {prettyBytes(info.getValue())}/s
      </span>
    ),
  },
  { 
      header: t('Chains'), 
    accessorKey: 'chains',
    cell: (info: any) => (
      <span className="text-truncate d-inline-block" style={{ maxWidth: '140px' }} title={info.getValue()}>
        {info.getValue()}
      </span>
    )
  },
  { 
      header: t('Rule'), 
    accessorKey: 'rule',
    cell: (info: any) => (
      <span className="badge badge-outline text-warning">
        {info.getValue()}
      </span>
    )
  },
  {
      header: t('Duration'),
    accessorKey: 'start',
    cell: (info: any) => (
      <span className="text-muted">
        <i className="ti ti-clock me-1"></i>
        {formatDistance(info.getValue(), 0)}
      </span>
    ),
  },
  { 
      header: t('Source'), 
    accessorKey: 'source',
    cell: (info: any) => (
      <code className="text-primary text-truncate d-inline-block" style={{ maxWidth: '110px' }} title={info.getValue()}>
        {info.getValue()}
      </code>
    )
  },
  { 
      header: t('Destination'), 
    accessorKey: 'destinationIP',
    cell: (info: any) => (
      <code className="text-secondary text-truncate d-inline-block" style={{ maxWidth: '110px' }} title={info.getValue()}>
        {info.getValue()}
      </code>
    )
  },
  { 
      header: t('Type'), 
    accessorKey: 'type',
    cell: (info: any) => (
      <span className="badge badge-outline text-primary">
        {info.getValue()}
      </span>
    )
  },
  ], [t]);

const columns = fullColumns;
  const columnsWithoutProcess = React.useMemo(() => 
    fullColumns.filter((item) => item.accessorKey !== 'process'), 
    [fullColumns]
  );
  const table = useReactTable({
    columns: connCtx.hasProcessPath ? columns : columnsWithoutProcess,
    data,
    state: {
      sorting,
      columnVisibility: { id: false },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  
  return (
    <div className="table-responsive connection-table-container">
      <table className="table table-vcenter tabler-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => {
            return (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  
                  return (
                    <th
                      key={header.id}
                      className={cx(
                        'user-select-none',
                        canSort && 'cursor-pointer'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {canSort && (
                          <div className="d-flex flex-column sort-indicators">
                            <i 
                              className={cx(
                                'ti ti-chevron-up',
                                sortDirection === 'asc' ? 'text-primary' : 'text-muted opacity-50'
                              )}
                              style={{ fontSize: '12px', lineHeight: '1' }}
                            ></i>
                            <i 
                              className={cx(
                                'ti ti-chevron-down',
                                sortDirection === 'desc' ? 'text-primary' : 'text-muted opacity-50'
                              )}
                              style={{ fontSize: '12px', lineHeight: '1' }}
                            ></i>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllColumns().length} className="text-center py-4">
                <div className="text-muted">
                  <i className="ti ti-wifi-off me-2"></i>
                  No active connections
                </div>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, index) => {
              return (
                <tr 
                  key={row.id}
                  className={cx(
                    'connection-row',
                    index % 2 === 0 && 'bg-light-subtle'
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id} className="align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
