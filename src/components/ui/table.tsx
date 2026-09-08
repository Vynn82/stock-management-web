"use client";

import React from "react";
import { Table as AntTable, TableProps as AntTableProps } from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";

export interface Column<T> {
  key: string;
  header: string;
  dataIndex?: string;
  render?: (item: T, index?: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  width?: number | string;
  align?: "left" | "right" | "center";
}

export interface TableProps<T> extends Omit<
  AntTableProps<T>,
  "columns" | "dataSource"
> {
  columns: (Column<T> | ColumnType<T>)[];
  data: T[];
  emptyText?: string;
  rowKey?: string | ((record: T) => string);
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  emptyText = "No records found.",
  rowKey = "id",
  pagination,
  className,
  ...rest
}: TableProps<T>) {
  const paginationConfig =
    pagination === false
      ? false
      : {
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          showTotal: (total: number) => `Total ${total} items`,
          ...(typeof pagination === "object" ? pagination : {}),
        };
  const antdColumns: ColumnsType<T> = columns.map((col) => {
    if ("title" in col) {
      return col as ColumnType<T>;
    }

    const customCol = col as Column<T>;
    return {
      key: customCol.key,
      title: customCol.header,
      dataIndex: customCol.dataIndex || customCol.key,
      width: customCol.width,
      align: customCol.align,
      sorter: customCol.sorter,
      render: (_value: any, record: T, index: number) => {
        if (customCol.render) {
          return customCol.render(record, index);
        }
        return record[customCol.key];
      },
    };
  });

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <AntTable<T>
        columns={antdColumns}
        dataSource={data}
        rowKey={rowKey}
        pagination={paginationConfig}
        locale={{ emptyText }}
        className={className}
        {...rest}
      />
    </div>
  );
}
