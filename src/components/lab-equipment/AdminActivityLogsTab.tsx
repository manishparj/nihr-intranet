import React, { useState } from 'react';
import { Card, Input, Table, Tag } from 'antd';
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import { LabActivityLog } from '../../types/labEquipment';

interface AdminActivityLogsTabProps {
  logs: LabActivityLog[];
  search?: string;
  setSearch?: (val: string) => void;
}

export const AdminActivityLogsTab: React.FC<AdminActivityLogsTabProps> = ({
  logs,
  search: controlledSearch,
  setSearch: setControlledSearch
}) => {
  const [internalSearch, setInternalSearch] = useState<string>('');
  const search = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setSearch = setControlledSearch || setInternalSearch;

  const filteredLogs = logs.filter(
    l =>
      !search ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.actionType.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card
      title={
        <div className="flex justify-between items-center flex-wrap gap-2 py-1">
          <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <SafetyCertificateOutlined className="text-blue-600" />
            Immutable Administrative System Activity Audit Logs
          </span>
          <Input
            placeholder="Search audit trail..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
            className="rounded-xl text-xs"
          />
        </div>
      }
      variant="borderless"
      className="shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
    >
      <Table
        dataSource={filteredLogs}
        rowKey="id"
        pagination={{ pageSize: 12 }}
        size="middle"
        scroll={{ x: 800 }}
        columns={[
          {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 170,
            render: (t: string) => (
              <span className="font-mono text-xs text-slate-600 dark:text-zinc-400">
                {t}
              </span>
            )
          },
          {
            title: 'Action Performed',
            dataIndex: 'actionType',
            key: 'actionType',
            width: 180,
            render: (type: string) => {
              let color = 'blue';
              if (type.includes('CREATE') || type.includes('ADD')) color = 'green';
              if (type.includes('DELETE') || type.includes('REMOVE')) color = 'red';
              if (type.includes('LOGIN') || type.includes('AUTH')) color = 'purple';
              if (type.includes('STATUS') || type.includes('REVIEW')) color = 'orange';
              return (
                <Tag color={color} className="font-bold text-xs uppercase px-2 py-0.5 rounded-md">
                  {type}
                </Tag>
              );
            }
          },
          {
            title: 'Audit Event Description',
            dataIndex: 'description',
            key: 'description',
            render: (desc: string) => (
              <span className="font-medium text-xs text-slate-800 dark:text-zinc-200">
                {desc}
              </span>
            )
          },
          {
            title: 'Authorized Actor',
            dataIndex: 'actor',
            key: 'actor',
            width: 170,
            render: (actor: string) => (
              <span className="font-semibold text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <UserOutlined /> {actor || 'System'}
              </span>
            )
          }
        ]}
      />
    </Card>
  );
};
