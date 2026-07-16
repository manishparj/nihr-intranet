import { useState } from 'react';
import { Card, Table, Tag, Button, Modal, message } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { ProjectStaff, Project, Scientist, VisibilityConfig } from '../types';
import { calculateStaffExperienceYMD, formatYMD, renderMaskedField, calculateIcmrTenureStatus } from '../utils/experience';
import { ProjectStaffForm } from './StaffForms';
import { apiService } from '../services/api';

interface PublicProjectStaffViewProps {
  projectStaff: ProjectStaff[];
  projects: Project[];
  scientists: Scientist[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
}

export function PublicProjectStaffView({
  projectStaff,
  projects,
  scientists,
  visibility,
  isAuthenticated,
  onOpenDetails
}: PublicProjectStaffViewProps) {
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  const getProjectStaffColumns = () => [
    { title: 'Temp Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => (a.employeeCode || '').localeCompare(b.employeeCode || '') },
    { title: 'Staff Member', dataIndex: 'name', key: 'name', className: 'font-bold', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Linked Project', dataIndex: 'projectId', key: 'projectId', render: (id: string) => projects.find(p => p.id === id)?.shortName || 'None' },
    { title: 'Principal Investigator', dataIndex: 'scientistId', key: 'scientistId', render: (id: string) => scientists.find(s => s.id === id)?.name || '-' },
    ...(isAuthenticated || !!visibility?.fields.email ? [{ title: 'Email Address', dataIndex: 'email', key: 'email', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.phone ? [{ title: 'Phone Number', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.dob ? [{ title: 'Date of Birth', dataIndex: 'dob', key: 'dob', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.dob, '🔒 masked') }] : []),
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    ...(isAuthenticated || !!visibility?.fields.aadhaar ? [{ title: 'Aadhaar Number', dataIndex: 'aadhaarNumber', key: 'aadhaarNumber', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.aadhaar, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.pan ? [{ title: 'PAN Card', dataIndex: 'panNumber', key: 'panNumber', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.pan, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.bankDetails ? [
      { title: 'Bank Name', dataIndex: 'bankName', key: 'bankName', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked') },
      { title: 'Account Number', dataIndex: 'accountNumber', key: 'accountNumber', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked') },
      { title: 'IFSC Code', dataIndex: 'ifscCode', key: 'ifscCode', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked') }
    ] : []),
    { title: 'Total Exp (Y-M-D)', key: 'totalExpYMD', render: (_: any, rec: ProjectStaff) => {
      const expYMD = calculateStaffExperienceYMD(rec);
      return <Tag color="blue" title={`${rec.totalExpMonths || 0} Months cumulative`}>{formatYMD(expYMD.total)}</Tag>;
    }, sorter: (a: any, b: any) => (a.totalExpMonths || 0) - (b.totalExpMonths || 0) },
    { 
      title: 'ICMR Experience & Red Flag Status', 
      key: 'icmrExpLimit', 
      render: (_: any, rec: ProjectStaff) => {
        const project = projects.find(p => p.id === rec.projectId);
        const status = calculateIcmrTenureStatus(rec, project);
        
        return (
          <div className={`p-2 rounded-lg border flex flex-col gap-1 text-xs max-w-xs ${
            status.isRedFlag 
              ? 'bg-red-50/80 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-200' 
              : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-300'
          }`}>
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between gap-4">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">Prev ICMR Exp:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{formatYMD(status.prevIcmrYMD)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">Current Exp:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{formatYMD(status.currentIcmrYMD)}</span>
              </div>
              <div className="border-t border-dashed border-slate-300/60 dark:border-zinc-700/60 my-0.5" />
              <div className="flex justify-between gap-4 font-semibold">
                <span className="text-[10px] text-slate-600 dark:text-zinc-300">Total ICMR EXP:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{formatYMD(status.totalIcmrYMD)}</span>
              </div>
              <div className="flex justify-between gap-4 text-[10px] text-slate-500 dark:text-zinc-400">
                <span>Cumulative Mths (ICMR+Non-ICMR):</span>
                <span className="font-mono font-semibold">{status.cumulativeTotalMonths.toFixed(1)} mths</span>
              </div>
            </div>
            
            <div className="border-t border-dashed border-slate-300/60 dark:border-zinc-700/60 my-0.5" />
            
            {status.isRedFlag ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider flex items-center gap-1">
                  🚨 RED FLAG LIMIT WARNING
                </span>
                <span className="text-[11px] font-bold text-red-700 dark:text-red-300">
                  {status.remainingText} (Cut-off: {status.cutOffDateStr})
                </span>
                <span className="text-[9px] text-red-500/90 dark:text-red-400/80">
                  Based on: {status.cutOffReason}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                  ✅ Tenure Status Stable
                </span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400">
                  {status.remainingText} until Cut-off ({status.cutOffDateStr})
                </span>
              </div>
            )}
          </div>
        );
      }
    },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="purple">{c}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
  ];

  return (
    <>
      <Card 
        title="👥 Project Research Staff Profiles (Click row for full profile)" 
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
          columns={getProjectStaffColumns()} 
          dataSource={projectStaff} 
          pagination={{ pageSize: 8 }} 
          size="middle" 
          rowKey="id" 
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: (e: any) => {
              if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
              onOpenDetails(record, 'pstaff');
            },
            className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
          })}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-base font-extrabold text-[#005EB8] dark:text-blue-400">📝 PROJECT RESEARCH STAFF SELF-REGISTRATION FORM</span>
          </div>
        }
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
        className="rounded-xl overflow-hidden"
      >
        <div className="py-2 max-h-[75vh] overflow-y-auto px-1">
          <div className="text-xs text-blue-800 dark:text-blue-300 mb-4 bg-blue-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-blue-100 dark:border-zinc-800/40">
            📌 Fill out this registration form. Once submitted, your profile will be reviewed by the Super Administrator. 
            Upon approval, you will be allocated a <strong>TEMP Employee Code</strong> and listed on the official research staff directory.
          </div>
          <ProjectStaffForm
            projects={projects}
            scientists={scientists}
            onSubmit={async (values) => {
              const hide = message.loading('Submitting registration...', 0);
              try {
                await apiService.submitPendingProjectStaff(values);
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
