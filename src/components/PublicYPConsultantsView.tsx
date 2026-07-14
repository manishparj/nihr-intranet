import { Card, Table, Tag } from 'antd';
import { YPConsultant, VisibilityConfig } from '../types';
import { renderMaskedField } from '../utils/experience';

interface PublicYPConsultantsViewProps {
  ypConsultants: YPConsultant[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
}

export function PublicYPConsultantsView({
  ypConsultants,
  visibility,
  isAuthenticated,
  onOpenDetails
}: PublicYPConsultantsViewProps) {
  const getYPConsultantColumns = () => [
    { title: 'Temp/CONS Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
    { title: 'Staff Member', dataIndex: 'name', key: 'name', className: 'font-bold' },
    { title: 'Designation Type', dataIndex: 'designationType', key: 'designationType', render: (val: string) => <Tag color={val === 'Consultant' ? 'magenta' : 'cyan'}>{val}</Tag> },
    { title: 'Full Designation', dataIndex: 'fullDesignation', key: 'fullDesignation' },
    ...(isAuthenticated || !!visibility?.fields.email ? [{ title: 'Email', dataIndex: 'email', key: 'email', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.phone ? [{ title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') }] : []),
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
  ];

  return (
    <Card title="🌟 Young Professional & Consultant Staff (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
      <Table 
        columns={getYPConsultantColumns()} 
        dataSource={ypConsultants} 
        pagination={{ pageSize: 8 }} 
        size="middle" 
        rowKey="id" 
        scroll={{ x: 'max-content' }}
        onRow={(record) => ({
          onClick: (e: any) => {
            if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
            onOpenDetails(record, 'ypc');
          },
          className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
        })}
      />
    </Card>
  );
}
