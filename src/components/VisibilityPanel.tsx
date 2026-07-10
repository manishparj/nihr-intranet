import React, { useState, useEffect } from 'react';
import { Card, Switch, Divider, Row, Col, Space, Button, message, Alert, App } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, SafetyCertificateOutlined, SettingOutlined } from '@ant-design/icons';
import { VisibilityConfig } from '../types';

interface VisibilityPanelProps {
  initialConfig: VisibilityConfig;
  onSave: (config: VisibilityConfig) => Promise<void>;
}

export const VisibilityPanel: React.FC<VisibilityPanelProps> = ({
  initialConfig,
  onSave,
}) => {
  const { message } = App.useApp();
  const [config, setConfig] = useState<VisibilityConfig>(initialConfig);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleModuleToggle = (moduleKey: keyof VisibilityConfig['modules'], checked: boolean) => {
    setConfig({
      ...config,
      modules: {
        ...config.modules,
        [moduleKey]: checked,
      },
    });
  };

  const handleFieldToggle = (fieldKey: keyof VisibilityConfig['fields'], checked: boolean) => {
    setConfig({
      ...config,
      fields: {
        ...config.fields,
        [fieldKey]: checked,
      },
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(config);
      message.success('System visibility configuration saved successfully.');
    } catch (e) {
      message.error('Failed to update visibility configurations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={<Space><SettingOutlined className="text-blue-500" /><span>System Visibility Control Panel</span></Space>}
      variant="borderless"
      className="shadow-sm rounded-xl"
    >
      <Alert
        message="Configure Public Dashboard Settings"
        description="Control which modules are rendered for public guests, and restrict sensitive personal fields (such as Bank Details, Aadhaar, PAN) from public lookup tables."
        type="info"
        showIcon
        className="mb-6 rounded-lg"
      />

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-sm mb-4 flex items-center gap-2">
            <EyeOutlined className="text-blue-500" /> Public Modules Visibility
          </h3>
          <Row gutter={[16, 16]}>
            {Object.keys(config.modules).map((key) => {
              const moduleKey = key as keyof VisibilityConfig['modules'];
              // Map keys to pretty labels
              const labels: Record<keyof VisibilityConfig['modules'], string> = {
                scientists: 'Scientists Registry',
                projects: 'Project Records & Budget',
                projectStaff: 'Project Staff Profiles',
                permanentStaff: 'Permanent Staff Registry',
                ypConsultants: 'YP & Consultants Registry',
                circulars: 'Office Circulars (PDF)',
                forms: 'Office Forms Documents',
                announcements: 'Dashboard Announcements',
                events: 'Today’s Meetings & Events',
                birthdays: 'Weekly Birthdays Celebrate',
                workAnniversaries: 'Weekly Work Anniversaries',
                broadcast: 'Live Broadcast Channel',
              };

              return (
                <Col xs={24} sm={12} md={8} key={moduleKey}>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-slate-200 transition-colors">
                    <span className="font-medium text-slate-700 dark:text-zinc-300 text-xs">
                      {labels[moduleKey] || moduleKey}
                    </span>
                    <Switch
                      checkedChildren="Visible"
                      unCheckedChildren="Hidden"
                      checked={config.modules[moduleKey]}
                      onChange={(checked) => handleModuleToggle(moduleKey, checked)}
                    />
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>

        <Divider className="my-6" />

        <div>
          <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-sm mb-4 flex items-center gap-2">
            <SafetyCertificateOutlined className="text-yellow-600" /> Personal Identity & Field Masking (GDPR compliance)
          </h3>
          <Row gutter={[16, 16]}>
            {Object.keys(config.fields).map((key) => {
              const fieldKey = key as keyof VisibilityConfig['fields'];
              const labels: Record<keyof VisibilityConfig['fields'], string> = {
                phone: 'Show Phone Numbers in Public Directories',
                email: 'Show Email Addresses in Public Directories',
                aadhaar: 'Show Aadhaar Identity Numbers in Public Views',
                pan: 'Show PAN Tax Cards in Public Views',
                bankDetails: 'Show Bank Account & IFSC details',
                dob: 'Show Birth Dates (DOB)',
                address: 'Show Home Addresses in Public Views',
              };

              return (
                <Col xs={24} md={12} key={fieldKey}>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-slate-200 transition-colors">
                    <div className="flex flex-col pr-4">
                      <span className="font-medium text-slate-700 dark:text-zinc-300 text-xs">
                        {labels[fieldKey] || fieldKey}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {config.fields[fieldKey] ? '🚨 Unrestricted public access' : '🔒 Securely masked from public visitors'}
                      </span>
                    </div>
                    <Switch
                      checkedChildren="Public"
                      unCheckedChildren="Masked"
                      checked={config.fields[fieldKey]}
                      onChange={(checked) => handleFieldToggle(fieldKey, checked)}
                      className={config.fields[fieldKey] ? 'bg-red-500' : 'bg-slate-300'}
                    />
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>

        <Divider className="my-6" />

        <div className="flex justify-end gap-3">
          <Button 
            type="primary" 
            size="large" 
            loading={loading}
            onClick={handleSave}
            className="px-6 rounded-lg font-semibold"
          >
            Apply Changes & Update Public Views
          </Button>
        </div>
      </div>
    </Card>
  );
};
