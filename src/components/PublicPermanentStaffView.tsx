import { Card, Table, Tag } from 'antd';
import { PermanentStaff, VisibilityConfig } from '../types';
import { renderMaskedField } from '../utils/experience';

interface PublicPermanentStaffViewProps {
  permanentStaff: PermanentStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
}

export function PublicPermanentStaffView({
  permanentStaff,
  visibility,
  isAuthenticated,
  onOpenDetails
}: PublicPermanentStaffViewProps) {
  const getPermanentStaffColumns = () => [
    { title: 'Perm Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
    { title: 'Staff Member', dataIndex: 'name', key: 'name', className: 'font-bold' },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    ...(isAuthenticated || !!visibility?.fields.email ? [{ title: 'Govt Email', dataIndex: 'govtEmail', key: 'govtEmail', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.phone ? [{ title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') }] : []),
    ...((isAuthenticated || !!visibility?.fields.aadhaar || !!visibility?.fields.pan) ? [{
      title: 'Aadhaar / PAN', 
      key: 'idDocs', 
      render: (_: any, s: PermanentStaff) => (
        <div className="text-[10px]">
          {(isAuthenticated || !!visibility?.fields.aadhaar) && <div>Aadhaar: {renderMaskedField(s.aadhaarNumber, true)}</div>}
          {(isAuthenticated || !!visibility?.fields.pan) && <div>PAN: {renderMaskedField(s.panNumber, true)}</div>}
        </div>
      )
    }] : []),
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="purple">{c}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
  ];

  return (
    <Card title="💼 Permanent Staff Directory (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
      <Table 
        columns={getPermanentStaffColumns()} 
        dataSource={permanentStaff} 
        pagination={{ pageSize: 8 }} 
        size="middle" 
        rowKey="id" 
        scroll={{ x: 'max-content' }}
        onRow={(record) => ({
          onClick: (e: any) => {
            if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
            onOpenDetails(record, 'perm');
          },
          className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
        })}
      />
    </Card>
  );
}
