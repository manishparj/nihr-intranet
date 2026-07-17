import { useState } from 'react';
import { Card, Table, Tag, Button, Modal, message } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { YPConsultant, VisibilityConfig } from '../types';
import { renderMaskedField } from '../utils/experience';
import { YPConsultantForm } from './StaffForms';
import { apiService } from '../services/api';

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
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

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
    <>
      <Card 
        title="🌟 Young Professional & Consultant Staff (Click row for full profile)" 
        variant="borderless" 
        className="shadow-sm rounded-xl overflow-hidden"
        extra={
          <Button 
            type="primary" 
            icon={<FileAddOutlined />} 
            onClick={() => setRegisterModalVisible(true)}
            className="rounded-lg text-xs font-semibold bg-[#005EB8] hover:bg-blue-700"
          >
            📝 Self-Registration Form
          </Button>
        }
      >
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

      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-base font-extrabold text-[#005EB8] dark:text-blue-400">📝 YP & CONSULTANT STAFF SELF-REGISTRATION FORM</span>
          </div>
        }
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
        className="rounded-xl overflow-hidden"
      >
        <div className="py-2 max-h-[75vh] overflow-y-auto px-1">
          <div className="text-xs text-blue-800 dark:text-blue-300 mb-4 bg-blue-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-blue-100 dark:border-zinc-800/40">
            📌 Fill out this registration form. Once submitted, your profile will be reviewed by the Super Administrator. 
            Upon approval, you will be allocated a <strong>Temp/CONS Employee Code</strong> and listed on the official directory.
          </div>
          <YPConsultantForm
            onSubmit={async (values) => {
              const hide = message.loading('Submitting registration...', 0);
              try {
                await apiService.submitPendingYPConsultant(values);
                message.success('Registration submitted successfully! It is now pending administrative approval.');
                setRegisterModalVisible(false);
              } catch (err: any) {
                message.error('Failed to submit registration. Please try again.');
                console.error(err);
              } finally {
                hide();
              }
            }}
            onCancel={() => setRegisterModalVisible(false)}
          />
        </div>
      </Modal>
    </>
  );
}
