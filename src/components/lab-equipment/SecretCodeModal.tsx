import React from 'react';
import { Modal, Button, Alert, message } from 'antd';
import { KeyOutlined, CopyOutlined } from '@ant-design/icons';

export interface SecretCodeModalProps {
  visible?: boolean;
  data: { name: string; mobile: string; code: string } | null;
  onClose: () => void;
}

export const SecretCodeModal: React.FC<SecretCodeModalProps> = ({
  visible = true,
  data,
  onClose
}) => {
  if (!data || !visible) return null;

  return (
    <Modal
      open={visible && !!data}
      onCancel={onClose}
      footer={[
        <Button
          key="copy"
          icon={<CopyOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(data.code);
            message.success('Secret code copied to clipboard!');
          }}
          className="rounded-lg"
        >
          Copy Secret Code
        </Button>,
        <Button
          key="ok"
          type="primary"
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-500 font-bold rounded-lg"
        >
          Done & Handover
        </Button>
      ]}
      title={
        <span className="font-bold text-base text-purple-700 dark:text-purple-400 flex items-center gap-2">
          <KeyOutlined /> 8-Digit Secret Code Generated
        </span>
      }
      centered
      width="90vw"
      style={{ maxWidth: 520 }}
    >
      <div className="space-y-4 py-2">
        <Alert
          title="One-Time Secret Code Handover"
          description="This code will NOT be shown again in plaintext for security compliance. Please copy or note down this code and securely hand it over to the applicant."
          type="warning"
          showIcon
        />

        <div className="bg-slate-900 text-white p-5 rounded-2xl text-center space-y-2 border border-slate-800 shadow-inner">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
            Generated Secret Code
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-black tracking-[0.3em] text-emerald-400 select-all">
            {data.code}
          </div>
          <div className="text-xs text-slate-400">
            For: <strong className="text-white">{data.name}</strong> ({data.mobile})
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center">
          The applicant will use this 8-digit passcode alongside their registered mobile number to reserve equipment.
        </div>
      </div>
    </Modal>
  );
};
