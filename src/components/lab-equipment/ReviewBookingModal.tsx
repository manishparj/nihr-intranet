import React from 'react';
import { Modal, Form, Select, Input, Descriptions, Tag, Button } from 'antd';
import { SafetyCertificateOutlined, UnlockOutlined } from '@ant-design/icons';
import { FormInstance } from 'antd/es/form';
import { EquipmentBooking } from '../../types/labEquipment';

const { Option } = Select;
const { TextArea } = Input;

interface ReviewBookingModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
  onDirectRelease?: (bookingId: string) => void;
  form: FormInstance;
  booking: EquipmentBooking | null;
  saving: boolean;
}

export const ReviewBookingModal: React.FC<ReviewBookingModalProps> = ({
  visible,
  onCancel,
  onSave,
  onDirectRelease,
  form,
  booking,
  saving
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      onOk={onSave}
      confirmLoading={saving}
      title={
        <span className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <SafetyCertificateOutlined className="text-blue-600" />
          Review & Sanction Booking #{booking?.id}
        </span>
      }
      okText="Save Sanction Decision"
      okButtonProps={{ className: 'bg-blue-600 font-bold rounded-xl' }}
      cancelButtonProps={{ className: 'rounded-xl' }}
      className="rounded-2xl overflow-hidden"
    >
      {booking && (
        <div className="space-y-4 py-2">
          <Descriptions
            bordered
            size="small"
            column={1}
            className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl overflow-hidden"
          >
            <Descriptions.Item label="Applicant Name">
              <strong>{booking.applicantName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Mobile / Email">
              <span className="font-mono">
                {booking.applicantMobile} | {booking.applicantEmail}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Equipment">
              <ul className="list-disc list-inside m-0 p-0 text-xs">
                {booking.equipmentNames.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </Descriptions.Item>
            <Descriptions.Item label="Slot Duration">
              <span className="font-mono font-semibold">
                {booking.fromDateTime} to {booking.toDateTime} ({booking.durationHours || 0} Hours)
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Purpose / Protocol">
              <span className="italic text-xs">"{booking.purposeRemark}"</span>
            </Descriptions.Item>
            <Descriptions.Item label="Current Status">
              <Tag
                color={
                  booking.status === 'Approved'
                    ? 'green'
                    : booking.status === 'Pending'
                    ? 'gold'
                    : booking.status === 'Completed'
                    ? 'blue'
                    : 'red'
                }
                className="font-bold"
              >
                {booking.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {/* Quick Release Button if Approved */}
          {booking.status === 'Approved' && onDirectRelease && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-bold">Protocol Complete?</span> Mark equipment as returned & release lock.
              </div>
              <Button
                size="small"
                type="primary"
                icon={<UnlockOutlined />}
                onClick={() => onDirectRelease(booking.id)}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg text-xs"
              >
                Release Equipment
              </Button>
            </div>
          )}

          <Form form={form} layout="vertical" className="space-y-3">
            <Form.Item
              label="Sanction Action"
              name="status"
              rules={[{ required: true, message: 'Select approval action' }]}
            >
              <Select className="rounded-xl font-semibold">
                <Option value="Approved">Approve Reservation</Option>
                <Option value="Rejected">Reject Request</Option>
                <Option value="Completed">Mark as Completed & Released</Option>
                <Option value="Pending">Keep as Pending</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Super Admin Remark / Protocol Instructions"
              name="adminRemark"
            >
              <TextArea
                rows={3}
                placeholder="e.g. Approved. Please bring filtered samples and log entry in physical register room 104."
                className="rounded-xl"
              />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};
