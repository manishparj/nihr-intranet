import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Button, Select, Input, Row, Col, Space, Table, 
  message, Tag, Divider, Empty, Popconfirm, Form, Badge, Alert, Modal
} from 'antd';
import { 
  UserOutlined, DownloadOutlined, PrinterOutlined, DeleteOutlined, 
  SearchOutlined, LockOutlined, IdcardOutlined, PhoneOutlined,
  CalendarOutlined, UploadOutlined, FileTextOutlined, CheckCircleOutlined,
  EditOutlined, PlusOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';
import { SalarySlip } from '../types';

const { Option } = Select;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2025', '2026', '2027', '2028'];

// ==========================================
// 1. PUBLIC STAFF SALARY PORTAL VIEW
// ==========================================
export const SalaryPortalView: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [month, setMonth] = useState('July');
  const [year, setYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [activeSlip, setActiveSlip] = useState<SalarySlip | null>(null);

  const handlePortalLogin = async () => {
    if (!mobile || !aadhaar) {
      message.error('Please fill in both Mobile and Aadhaar card numbers.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiService.loginSalaryPortal({
        mobile,
        aadhaarNumber: aadhaar,
        month,
        year
      });
      if (res.success && res.salarySlip) {
        setActiveSlip(res.salarySlip);
        message.success(`Welcome back, ${res.salarySlip.name}! Here is your salary slip.`);
      } else {
        message.error('Failed to locate salary record.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'No salary slip matches the provided credentials.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSlip = () => {
    if (!activeSlip) return;

    try {
      const details = activeSlip.details || {};
      const getVal = (k: string) => String(details[k] ?? '-');
      const titleText = `Salary_Slip_${activeSlip.name.replace(/\s+/g, '_')}_${activeSlip.month}_${activeSlip.year}`;

      const basicNum = parseFloat(getVal('Basic Pay').replace(/[^0-9.]/g, '')) || 0;
      const hraNum = parseFloat(getVal('HRA').replace(/[^0-9.]/g, '')) || 0;
      const grossNum = parseFloat(getVal('Gross Remuneration').replace(/[^0-9.]/g, '')) || 0;
      const taxNum = parseFloat(getVal('Income Tax Deduction').replace(/[^0-9.]/g, '')) || 0;
      const lwpDedNum = parseFloat(getVal('Leave Without Pay Deduction').replace(/[^0-9.]/g, '')) || 0;
      const totalDed = taxNum + lwpDedNum;
      const netNum = parseFloat(getVal('Net Pay').replace(/[^0-9.]/g, '')) || 0;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${titleText}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; background: #f8fafc; color: #1e293b; line-height: 1.5; }
            .slip-container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 3px solid #005EB8; padding-bottom: 15px; }
            .header-title { font-size: 22px; font-weight: 800; color: #005EB8; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-subtitle { font-size: 11px; font-weight: bold; color: #64748b; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; }
            
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 1px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            
            .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .meta-grid td { width: 33.33%; padding: 10px; vertical-align: top; border: 1px solid #e2e8f0; background: #fafafa; }
            .meta-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 3px; }
            .meta-val { font-size: 12px; font-weight: bold; color: #0f172a; }

            .attendance-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: center; }
            .attendance-table th { background: #f1f5f9; padding: 6px; font-size: 9px; font-weight: 800; color: #475569; border: 1px solid #e2e8f0; text-transform: uppercase; }
            .attendance-table td { padding: 8px; font-size: 11px; font-weight: bold; color: #1e293b; border: 1px solid #e2e8f0; }

            .details-table-wrapper { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
            .details-column { width: 50%; }
            .details-table { width: 100%; border-collapse: collapse; }
            .details-table th { background: #005EB8; color: #ffffff; padding: 8px; font-size: 11px; font-weight: bold; text-align: left; text-transform: uppercase; }
            .details-table td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            
            .total-row { background: #f8fafc; font-weight: bold; }
            .total-row td { border-top: 2px solid #cbd5e1; color: #0f172a; font-weight: 800; }

            .net-pay-banner { background: #005EB8; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px; }
            .net-pay-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
            .net-pay-val { font-size: 26px; font-weight: 900; margin: 5px 0 0 0; }

            .footer-note { font-size: 10px; text-align: center; color: #94a3b8; margin-top: 35px; font-weight: 500; border-t: 1px solid #f1f5f9; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <table class="header-table">
              <tr>
                <td style="width: 70px; padding-bottom: 10px;">
                  <img src="https://icmr.gov.in/images/icmr_logo.png" alt="ICMR Logo" style="height: 50px; width: auto;" />
                </td>
                <td style="padding-left: 15px; padding-bottom: 10px;">
                  <h1 class="header-title">National Institute for Health Research</h1>
                  <p class="header-subtitle">Official Monthly Payslip & Statement of Earnings</p>
                </td>
              </tr>
            </table>

            <div class="section-title">1. Staff Member & Appointment Details</div>
            <table class="meta-grid">
              <tr>
                <td>
                  <span class="meta-label">Employee Code</span>
                  <span class="meta-val">${getVal('Employee Code')}</span>
                </td>
                <td>
                  <span class="meta-label">Employee Name</span>
                  <span class="meta-val">${getVal('Employee Name')}</span>
                </td>
                <td>
                  <span class="meta-label">Designation</span>
                  <span class="meta-val">${getVal('Designation')}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span class="meta-label">Date of Joining</span>
                  <span class="meta-val">${getVal('Date of Joining')}</span>
                </td>
                <td>
                  <span class="meta-label">Tenure Up To</span>
                  <span class="meta-val">${getVal('Tenure Up To')}</span>
                </td>
                <td>
                  <span class="meta-label">Aadhaar (Masked)</span>
                  <span class="meta-val">XXXX-XXXX-${activeSlip.aadhaarNumber.slice(-4)}</span>
                </td>
              </tr>
            </table>

            <div class="section-title">2. Associated Project & Supervisor details</div>
            <table class="meta-grid">
              <tr>
                <td style="width: 50%;">
                  <span class="meta-label">Project Name</span>
                  <span class="meta-val" style="font-size: 11px;">${getVal('Project Name')}</span>
                </td>
                <td style="width: 50%;">
                  <span class="meta-label">Principal Investigator</span>
                  <span class="meta-val">${getVal('Scientist Name')} (${getVal('Scientist Designation')})</span>
                </td>
              </tr>
            </table>

            <div class="section-title">3. Bank Account & Tax Identity</div>
            <table class="meta-grid">
              <tr>
                <td>
                  <span class="meta-label">Bank Name</span>
                  <span class="meta-val">${getVal('Bank Name')}</span>
                </td>
                <td>
                  <span class="meta-label">Account Number</span>
                  <span class="meta-val">${getVal('Account Number')}</span>
                </td>
                <td>
                  <span class="meta-label">IFSC Code</span>
                  <span class="meta-val">${getVal('IFSC Code')}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span class="meta-label">PAN Number</span>
                  <span class="meta-val">${getVal('PAN Number')}</span>
                </td>
                <td>
                  <span class="meta-label">Payslip Month</span>
                  <span class="meta-val">${activeSlip.month}</span>
                </td>
                <td>
                  <span class="meta-label">Payslip Year</span>
                  <span class="meta-val">${activeSlip.year}</span>
                </td>
              </tr>
            </table>

            <div class="section-title">4. Attendance & Leaves summary</div>
            <table class="attendance-table">
              <thead>
                <tr>
                  <th>Month Days</th>
                  <th>Present Days</th>
                  <th>Prev Balance</th>
                  <th>Leave Credit</th>
                  <th>Total Leave</th>
                  <th>Leave Availed</th>
                  <th>Leave Balance</th>
                  <th>LWP Days</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${getVal('Days in Month')}</td>
                  <td>${getVal('Total Present Days')}</td>
                  <td>${getVal('Balance Leave Brought')}</td>
                  <td>${getVal('Leave Credit')}</td>
                  <td>${getVal('Total Leave')}</td>
                  <td>${getVal('Leave Availed')}</td>
                  <td>${getVal('Leave Balance')}</td>
                  <td>${getVal('Leave Without Pay')}</td>
                </tr>
              </tbody>
            </table>

            <div class="details-table-wrapper">
              <div class="details-column">
                <table class="details-table">
                  <thead>
                    <tr>
                      <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Earnings Category</th>
                      <th style="border-top-right-radius: 6px; border-bottom-right-radius: 6px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Basic Salary Pay</td>
                      <td style="text-align: right;">${getVal('Basic Pay')}</td>
                    </tr>
                    <tr>
                      <td>HRA Allowance</td>
                      <td style="text-align: right;">${getVal('HRA')}</td>
                    </tr>
                    <tr class="total-row">
                      <td>Gross Remuneration</td>
                      <td style="text-align: right;">${getVal('Gross Remuneration')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="details-column">
                <table class="details-table">
                  <thead>
                    <tr>
                      <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Deductions Category</th>
                      <th style="border-top-right-radius: 6px; border-bottom-right-radius: 6px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Income Tax (TDS)</td>
                      <td style="text-align: right;">${getVal('Income Tax Deduction')}</td>
                    </tr>
                    <tr>
                      <td>Leave Without Pay Deduction</td>
                      <td style="text-align: right;">${getVal('Leave Without Pay Deduction')}</td>
                    </tr>
                    <tr class="total-row">
                      <td>Total Deductions</td>
                      <td style="text-align: right;">₹${totalDed.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="net-pay-banner">
              <div class="net-pay-label">Net Salary Disbursed / Take-home pay</div>
              <div class="net-pay-val">${getVal('Net Pay')}</div>
            </div>

            <p class="footer-note">This statement has been authenticated dynamically under Central Payroll Registry of National Institute for Health Research. No hand-drawn signature is required.</p>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${titleText}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('Detailed salary slip statement downloaded successfully!');
    } catch (e: any) {
      console.error(e);
      message.error('Failed to export salary slip document.');
    }
  };

  const handlePrintSlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !activeSlip) {
      message.error('Failed to open printing target. Please allow popups.');
      return;
    }

    const details = activeSlip.details || {};
    const getVal = (k: string) => String(details[k] ?? '-');
    const basicNum = parseFloat(getVal('Basic Pay').replace(/[^0-9.]/g, '')) || 0;
    const hraNum = parseFloat(getVal('HRA').replace(/[^0-9.]/g, '')) || 0;
    const grossNum = parseFloat(getVal('Gross Remuneration').replace(/[^0-9.]/g, '')) || 0;
    const taxNum = parseFloat(getVal('Income Tax Deduction').replace(/[^0-9.]/g, '')) || 0;
    const lwpDedNum = parseFloat(getVal('Leave Without Pay Deduction').replace(/[^0-9.]/g, '')) || 0;
    const totalDed = taxNum + lwpDedNum;

    printWindow.document.write(`
      <html>
      <head>
        <title>Print Salary Slip - ${activeSlip.name}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #1a202c; }
          .container { border: 1px solid #cbd5e1; padding: 30px; border-radius: 8px; max-width: 750px; margin: 0 auto; }
          .header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 2px solid #005EB8; padding-bottom: 15px; }
          .meta-section { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .meta-item { flex: 1; min-width: 200px; margin-bottom: 8px; }
          .label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; }
          .val { font-size: 12px; font-weight: bold; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; color: #475569; padding: 8px; font-size: 10px; border: 1px solid #cbd5e1; text-transform: uppercase; }
          td { padding: 10px 8px; border: 1px solid #cbd5e1; font-size: 12px; }
          .flex-row { display: flex; justify-content: space-between; gap: 20px; margin-top: 20px; }
          .col { width: 50%; }
          .total { background: #f8fafc; font-weight: bold; }
          .net-banner { background: #005EB8; color: white; padding: 15px; border-radius: 6px; text-align: center; margin-top: 25px; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://icmr.gov.in/images/icmr_logo.png" alt="Logo" style="height: 45px;" />
            <div>
              <h2 style="margin: 0; color: #005EB8; font-size: 18px;">National Institute for Health Research</h2>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #777;">OFFICIAL SALARY SLIP STATEMENT</p>
            </div>
          </div>
          
          <h4 style="margin: 15px 0 5px 0; font-size: 11px; text-transform: uppercase; color: #475569;">1. Staff Appointment Details</h4>
          <div class="meta-section">
            <div class="meta-item"><span class="label">Employee Name</span><span class="val">${getVal('Employee Name')}</span></div>
            <div class="meta-item"><span class="label">Employee Code</span><span class="val">${getVal('Employee Code')}</span></div>
            <div class="meta-item"><span class="label">Designation</span><span class="val">${getVal('Designation')}</span></div>
            <div class="meta-item"><span class="label">Date of Joining</span><span class="val">${getVal('Date of Joining')}</span></div>
            <div class="meta-item"><span class="label">Tenure Up To</span><span class="val">${getVal('Tenure Up To')}</span></div>
            <div class="meta-item"><span class="label">Aadhaar (Masked)</span><span class="val">XXXX-XXXX-${activeSlip.aadhaarNumber.slice(-4)}</span></div>
          </div>

          <h4 style="margin: 15px 0 5px 0; font-size: 11px; text-transform: uppercase; color: #475569;">2. Project Reference & Supervisor</h4>
          <div class="meta-section">
            <div style="flex: 2;"><span class="label">Project Name</span><span class="val" style="font-size: 11px;">${getVal('Project Name')}</span></div>
            <div style="flex: 1;"><span class="label">PI / Supervisor Name</span><span class="val">${getVal('Scientist Name')} (${getVal('Scientist Designation')})</span></div>
          </div>

          <h4 style="margin: 15px 0 5px 0; font-size: 11px; text-transform: uppercase; color: #475569;">3. Bank Accounts & Attendance Period</h4>
          <div class="meta-section">
            <div class="meta-item"><span class="label">Bank Name</span><span class="val">${getVal('Bank Name')}</span></div>
            <div class="meta-item"><span class="label">Account Number</span><span class="val">${getVal('Account Number')}</span></div>
            <div class="meta-item"><span class="label">IFSC Code</span><span class="val">${getVal('IFSC Code')}</span></div>
            <div class="meta-item"><span class="label">PAN Number</span><span class="val">${getVal('PAN Number')}</span></div>
            <div class="meta-item"><span class="label">Pay period</span><span class="val">${activeSlip.month} ${activeSlip.year}</span></div>
          </div>

          <h4 style="margin: 15px 0 5px 0; font-size: 11px; text-transform: uppercase; color: #475569;">4. Leaves & Attendance Summary</h4>
          <table>
            <thead>
              <tr>
                <th>Days in Month</th>
                <th>Present Days</th>
                <th>Brought Forward</th>
                <th>Leave Credit</th>
                <th>Total Leave</th>
                <th>Leave Availed</th>
                <th>Leave Balance</th>
                <th>LWP Days</th>
              </tr>
            </thead>
            <tbody>
              <tr style="text-align: center;">
                <td>${getVal('Days in Month')}</td>
                <td>${getVal('Total Present Days')}</td>
                <td>${getVal('Balance Leave Brought')}</td>
                <td>${getVal('Leave Credit')}</td>
                <td>${getVal('Total Leave')}</td>
                <td>${getVal('Leave Availed')}</td>
                <td>${getVal('Leave Balance')}</td>
                <td>${getVal('Leave Without Pay')}</td>
              </tr>
            </tbody>
          </table>

          <div class="flex-row">
            <div class="col">
              <h4 style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #475569;">Earnings</h4>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left;">Earnings Category</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Pay</td>
                    <td style="text-align: right;">${getVal('Basic Pay')}</td>
                  </tr>
                  <tr>
                    <td>HRA Allowance</td>
                    <td style="text-align: right;">${getVal('HRA')}</td>
                  </tr>
                  <tr class="total">
                    <td>Gross Remuneration</td>
                    <td style="text-align: right;">${getVal('Gross Remuneration')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="col">
              <h4 style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #475569;">Deductions</h4>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left;">Deductions Category</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Income Tax (TDS)</td>
                    <td style="text-align: right;">${getVal('Income Tax Deduction')}</td>
                  </tr>
                  <tr>
                    <td>Leave Without Pay Deduction</td>
                    <td style="text-align: right;">${getVal('Leave Without Pay Deduction')}</td>
                  </tr>
                  <tr class="total">
                    <td>Total Deductions</td>
                    <td style="text-align: right;">₹${totalDed.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="net-banner">
            NET TAKE-HOME REMUNERATION: &nbsp; ${getVal('Net Pay')}
          </div>
          
          <p style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is a dynamically generated statement. No hand-drawn signature is required.</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const details = activeSlip?.details || {};
  const getVal = (k: string) => String(details[k] ?? '-');
  const taxNum = parseFloat(getVal('Income Tax Deduction').replace(/[^0-9.]/g, '')) || 0;
  const lwpDedNum = parseFloat(getVal('Leave Without Pay Deduction').replace(/[^0-9.]/g, '')) || 0;
  const totalDed = taxNum + lwpDedNum;

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-6 animate-fadeIn">
      {!activeSlip ? (
        <Card 
          className="shadow-md rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          title={
            <div className="text-center py-2">
              <span className="block text-[11px] text-blue-500 font-extrabold uppercase tracking-widest">🔒 Central Staff Payroll</span>
              <span className="text-base font-black text-slate-800 dark:text-zinc-100">Project Staff Salary Slips Access Portal</span>
            </div>
          }
        >
          <div className="space-y-4 max-w-md mx-auto py-4">
            <Alert 
              title="Secure Authentication Required"
              description="Please provide your registered mobile number and Aadhaar card number to look up and view your monthly salary payslip statement."
              type="info"
              showIcon
              className="rounded-lg text-xs"
            />

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Registered Mobile Number</label>
              <Input 
                prefix={<PhoneOutlined className="text-slate-400" />}
                placeholder="e.g. 9876543210" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={10}
                className="rounded-lg h-10"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Aadhaar Card Number (12 Digits)</label>
              <Input 
                prefix={<IdcardOutlined className="text-slate-400" />}
                placeholder="e.g. 123456789012" 
                value={aadhaar} 
                onChange={(e) => setAadhaar(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={12}
                className="rounded-lg h-10"
              />
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <label className="text-xs font-bold text-slate-500 block mb-1">Select Payslip Month</label>
                <Select value={month} onChange={setMonth} className="w-full h-10 rounded-lg">
                  {MONTHS.map(m => (
                    <Option key={m} value={m}>{m}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={12}>
                <label className="text-xs font-bold text-slate-500 block mb-1">Select Year</label>
                <Select value={year} onChange={setYear} className="w-full h-10 rounded-lg">
                  {YEARS.map(y => (
                    <Option key={y} value={y}>{y}</Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <Button 
              type="primary" 
              block 
              loading={loading}
              onClick={handlePortalLogin}
              className="h-10 rounded-lg font-bold text-xs bg-[#005EB8] hover:bg-blue-700 mt-2"
              icon={<LockOutlined />}
            >
              Verify Credentials & Load Payslip
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-100 dark:bg-zinc-800/50 p-3 rounded-lg">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 animate-pulse">
              ✔️ Authenticated successfully as <strong className="text-blue-600 dark:text-blue-400">{activeSlip.name}</strong>
            </span>
            <Button size="small" type="dashed" danger onClick={() => setActiveSlip(null)}>
              Sign Out / Lock Portal
            </Button>
          </div>

          <Card 
            id="printable-salary-slip"
            variant="outlined"
            className="shadow-md rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 md:p-6"
          >
            {/* Header section with branding & logo */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4 mb-4">
              <div className="w-12 h-12 bg-[#005EB8] rounded flex items-center justify-center p-1 overflow-hidden">
                <img src="https://icmr.gov.in/images/icmr_logo.png" alt="ICMR Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wide leading-tight">
                  National Institute for Health Research
                </h2>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold block">
                  Official Statement of Monthly Payroll & Statement of Earnings
                </span>
              </div>
            </div>

            {/* Profile grids info */}
            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">1. Appointment & Staff Profile</h4>
            <Row gutter={[16, 16]} className="bg-slate-50 dark:bg-zinc-800/20 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50 mb-4">
              <Col xs={24} sm={8}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Staff Member Name</div>
                <div className="text-xs font-black text-slate-800 dark:text-zinc-200">{getVal('Employee Name')}</div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Appointed Temp Code</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getVal('Employee Code')}</div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Designation</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getVal('Designation')}</div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Date of Joining</div>
                <div className="text-xs font-medium text-slate-800 dark:text-zinc-200">{getVal('Date of Joining')}</div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Tenure Up To</div>
                <div className="text-xs font-medium text-slate-800 dark:text-zinc-200">{getVal('Tenure Up To')}</div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Aadhaar (Masked)</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">XXXX-XXXX-{activeSlip.aadhaarNumber.slice(-4)}</div>
              </Col>
            </Row>

            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">2. Associated Project & PI Scientist</h4>
            <Row gutter={[16, 16]} className="bg-slate-50 dark:bg-zinc-800/20 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50 mb-4">
              <Col xs={24} sm={16}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Project Title</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">{getVal('Project Name')}</div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Principal Investigator</div>
                <div className="text-xs font-black text-slate-800 dark:text-zinc-200">{getVal('Scientist Name')}</div>
                <span className="text-[9px] text-slate-400 italic block">{getVal('Scientist Designation')}</span>
              </Col>
            </Row>

            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">3. Bank Account & Payslip Metadata</h4>
            <Row gutter={[16, 16]} className="bg-slate-50 dark:bg-zinc-800/20 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50 mb-4">
              <Col xs={12} sm={6}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Bank Name</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getVal('Bank Name')}</div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Account Number</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getVal('Account Number')}</div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">IFSC Code</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getVal('IFSC Code')}</div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="text-[9px] text-slate-400 font-bold uppercase">PAN Number</div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getVal('PAN Number')}</div>
              </Col>
            </Row>

            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">4. Leaves & Attendance Summary</h4>
            <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden mb-6 bg-slate-50/30 dark:bg-zinc-800/10">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-zinc-800/50 text-slate-500 uppercase font-black text-[9px] border-b border-slate-100 dark:border-zinc-800">
                    <th className="p-2">Month Days</th>
                    <th className="p-2">Present</th>
                    <th className="p-2">B/F Leave</th>
                    <th className="p-2">Leave Credit</th>
                    <th className="p-2">Total Leave</th>
                    <th className="p-2">Leave Availed</th>
                    <th className="p-2">Balance</th>
                    <th className="p-2 text-red-500">LWP Days</th>
                  </tr>
                </thead>
                <tbody className="divide-x divide-slate-100 dark:divide-zinc-800 font-bold text-slate-700 dark:text-zinc-300">
                  <tr>
                    <td className="p-3">{getVal('Days in Month')}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400">{getVal('Total Present Days')}</td>
                    <td className="p-3">{getVal('Balance Leave Brought')}</td>
                    <td className="p-3">{getVal('Leave Credit')}</td>
                    <td className="p-3">{getVal('Total Leave')}</td>
                    <td className="p-3 text-amber-600">{getVal('Leave Availed')}</td>
                    <td className="p-3 text-blue-600 dark:text-blue-400">{getVal('Leave Balance')}</td>
                    <td className="p-3 text-red-600">{getVal('Leave Without Pay')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} md={12}>
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#005EB8] text-white uppercase text-[10px] font-black">
                        <th className="p-3 text-left">Earnings Category</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      <tr>
                        <td className="p-3 font-semibold text-slate-700 dark:text-zinc-300">Basic Pay</td>
                        <td className="p-3 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('Basic Pay')}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-700 dark:text-zinc-300">HRA Allowance</td>
                        <td className="p-3 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('HRA')}</td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-zinc-800/50 border-t-2 border-slate-200 dark:border-zinc-700">
                        <td className="p-3 font-bold text-slate-900 dark:text-zinc-100">Gross Remuneration</td>
                        <td className="p-3 text-right font-black text-[#005EB8] dark:text-blue-400 text-sm">{getVal('Gross Remuneration')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-700 dark:bg-zinc-800 text-white uppercase text-[10px] font-black">
                        <th className="p-3 text-left">Deductions Category</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      <tr>
                        <td className="p-3 font-semibold text-slate-700 dark:text-zinc-300">Income Tax (TDS)</td>
                        <td className="p-3 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('Income Tax Deduction')}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-700 dark:text-zinc-300">Leave Without Pay Deduction</td>
                        <td className="p-3 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('Leave Without Pay Deduction')}</td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-zinc-800/50 border-t-2 border-slate-200 dark:border-zinc-700">
                        <td className="p-3 font-bold text-slate-900 dark:text-zinc-100">Total Deductions</td>
                        <td className="p-3 text-right font-black text-red-600 dark:text-red-400 text-sm">₹{totalDed.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Col>
            </Row>

            <div className="bg-[#005EB8] text-white p-5 rounded-xl text-center shadow-inner mb-4">
              <span className="text-[10px] uppercase font-black tracking-widest block opacity-85">Net Disbursed Take-home Salary</span>
              <span className="text-2xl md:text-3xl font-black block mt-1 tracking-tight">{getVal('Net Pay')}</span>
            </div>

            <div className="text-center text-[10px] text-slate-400 leading-normal border-t border-slate-100 dark:border-zinc-800 pt-4">
              * This slip has been generated dynamically based on official project payroll records. No physical signatures are requested.
            </div>
          </Card>

          {/* Download & Print Buttons */}
          <div className="flex gap-4 justify-center">
            <Button 
              type="primary" 
              onClick={handleDownloadSlip}
              icon={<DownloadOutlined />}
              className="rounded-lg text-xs font-bold h-10 px-6 bg-[#005EB8]"
            >
              Download PDF / Payslip Statement
            </Button>
            <Button 
              onClick={handlePrintSlip}
              icon={<PrinterOutlined />}
              className="rounded-lg text-xs font-bold h-10 px-6"
            >
              Print Payslip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 2. SUPER ADMIN SALARIES MANAGER
// ==========================================
interface AdminSalariesManagerProps {
  projectStaff: any[];
}

export const AdminSalariesManager: React.FC<AdminSalariesManagerProps> = ({ projectStaff }) => {
  const [salaries, setSalaries] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Manual Create/Edit State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<SalarySlip | null>(null);
  const [manualForm] = Form.useForm();

  const handleOpenCreateModal = () => {
    setEditingSlip(null);
    manualForm.resetFields();
    manualForm.setFieldsValue({
      month: 'July',
      year: '2026',
      basicPay: '78000',
      hra: '15600',
      grossRemuneration: '93600',
      incomeTaxDeduction: '1000',
      lwpDeduction: '0',
      netPay: '92600'
    });
    setManualModalOpen(true);
  };

  const handleOpenEditModal = (slip: SalarySlip) => {
    setEditingSlip(slip);
    manualForm.resetFields();
    manualForm.setFieldsValue({
      name: slip.name,
      employeeCode: slip.employeeCode,
      mobile: slip.mobile,
      aadhaarNumber: slip.aadhaarNumber,
      month: slip.month,
      year: slip.year,
      basicPay: slip.details?.['Basic Pay'] || slip.details?.['Basic_Pay'] || '',
      hra: slip.details?.['HRA'] || '',
      grossRemuneration: slip.details?.['Gross Remuneration '] || slip.details?.['Gross_Remuneration '] || '',
      incomeTaxDeduction: slip.details?.['InCome Tax Deduction'] || slip.details?.['InCome_Tax_Deduction'] || '',
      lwpDeduction: slip.details?.['LWP Deduction'] || slip.details?.['LWP_Deduction'] || '',
      netPay: slip.details?.['Net Pay'] || slip.details?.['Net_Pay'] || ''
    });
    setManualModalOpen(true);
  };

  const handleSaveManualSlip = async (values: any) => {
    try {
      const details: Record<string, string> = {
        'Basic Pay': values.basicPay,
        'HRA': values.hra,
        'Gross Remuneration ': values.grossRemuneration,
        'InCome Tax Deduction': values.incomeTaxDeduction,
        'LWP Deduction': values.lwpDeduction,
        'Net Pay': values.netPay
      };

      const payload = {
        name: values.name,
        employeeCode: values.employeeCode,
        mobile: values.mobile,
        aadhaarNumber: values.aadhaarNumber,
        month: values.month,
        year: values.year,
        details
      };

      if (editingSlip) {
        await apiService.updateSalarySlip(editingSlip.id, payload);
        message.success('Salary statement updated successfully.');
      } else {
        await apiService.createSalarySlip(payload);
        message.success('Manual salary statement created successfully.');
      }

      setManualModalOpen(false);
      fetchSalaries();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to save manual salary statement.');
    }
  };
  
  // Upload State
  const [csvText, setCsvText] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [uploadMonth, setUploadMonth] = useState('July');
  const [uploadYear, setUploadYear] = useState('2026');
  const [submitting, setSubmitting] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{ headers: string[], rowsCount: number } | null>(null);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await apiService.getSalaries();
      setSalaries(res);
    } catch (err) {
      console.error(err);
      message.error('Failed to load salaries ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      message.error('Please upload a valid CSV file (.csv).');
      return;
    }

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      
      // Parse a quick preview
      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setParsedPreview({
          headers,
          rowsCount: lines.length - 1
        });
      }
    };
    reader.readAsText(file);
  };

  const handleUploadCSV = async () => {
    if (!csvText) {
      message.error('Please select and load a CSV file first.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiService.uploadSalaryCSV({
        csvText,
        month: uploadMonth,
        year: uploadYear
      });
      if (res.success) {
        message.success(res.message || 'Salaries uploaded successfully.');
        setCsvText('');
        setCsvFileName('');
        setParsedPreview(null);
        fetchSalaries();
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || 'Failed to process CSV file on backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlip = async (id: string) => {
    try {
      const res = await apiService.deleteSalarySlip(id);
      if (res.success) {
        message.success('Salary statement deleted.');
        fetchSalaries();
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to delete salary statement.');
    }
  };

  // Filter salaries by search query
  const filteredSalaries = salaries.filter(s => 
    s.name.toLowerCase().includes(searchText.toLowerCase()) ||
    s.employeeCode.toLowerCase().includes(searchText.toLowerCase()) ||
    s.month.toLowerCase().includes(searchText.toLowerCase()) ||
    s.year.includes(searchText)
  );

  const columns = [
    { title: 'Employee Name', dataIndex: 'name', key: 'name', font: 'bold' },
    { title: 'Temp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Registered Mobile', dataIndex: 'mobile', key: 'mobile', render: (val: string) => val ? `XXXXXX${val.slice(-4)}` : '-' },
    { title: 'Aadhaar (Masked)', dataIndex: 'aadhaarNumber', key: 'aadhaarNumber', render: (val: string) => val ? `XXXX-XXXX-${val.slice(-4)}` : '-' },
    { title: 'Payslip Month', dataIndex: 'month', key: 'month', render: (val: string) => <Tag color="blue" className="font-bold">{val}</Tag> },
    { title: 'Year', dataIndex: 'year', key: 'year' },
    { 
      title: 'Action', 
      key: 'action', 
      render: (_: any, rec: SalarySlip) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => handleOpenEditModal(rec)} 
            title="Edit Slip" 
          />
          <Popconfirm title="Delete this payslip statement?" onConfirm={() => handleDeleteSlip(rec.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} title="Delete Slip" />
          </Popconfirm>
        </Space>
      ) 
    }
  ];

  const downloadSampleCSV = () => {
    const headers = [
      "Employee_Code",
      "Project_Name",
      "Scientist_Name",
      "Scientist_Designation",
      "Employee Name",
      "DOJ ",
      "Tenure_up_to",
      "Designation",
      "Mobile_Number",
      "Address",
      "Aadhaar_Number",
      "PAN_Number",
      "Bank_Name",
      "Account Number",
      "IFSC_Code",
      "Pay_Month",
      "Pay Year",
      "Basic_Pay",
      "HRA",
      "Balance_Leave_Brought_from_Previous_Month",
      "Leave_Credit_as_on_Last_pay_month_Last_Day",
      "Total_Leave",
      "Leave_Availed_During_the_Month",
      "Leave_Balance_as_on_31.03.26",
      "Leave_Without_Pay",
      "Total_Present_Day ",
      "Gross_Remuneration ",
      "InCome_Tax_Deduction",
      "LWP_Deduction",
      "Net_Pay"
    ].join(",");

    const rows = [
      'TEMP-10001,"Implementing a Screening and Identification Model for Latent Tuberculosis Among Family Members of TB Patients Using the Cytb Test with Android Application",Dr. Rajesh Verma,Scientist C,Rohit Deshmukh,22-10-1992,31-10-2026,Senior Research Fellow (SRF),9988776655,"Katwaria Sarai, New Delhi",1234-5678-9012,ABCDE1234F,State Bank of India,10002345678,SBIN0001234,4,2026,78000,15600,0,1.5,1.5,3,-1.5,1.5,28.5,93600,1000,3900,88700',
      'TEMP-10002,"Implementing a Screening and Identification Model for Latent Tuberculosis Among Family Members of TB Patients Using the Cytb Test with Android Application",Dr. Rajesh Verma,Scientist C,Sunita Sharma,15-05-2018,31-10-2026,Research Associate (RA),9876543210,"Safdarjung Enclave, New Delhi",5678-1234-9012,WXYZR7890S,HDFC Bank,501002345678,HDFC0000123,4,2026,90000,18000,1.0,1.5,2.5,1,1.5,0,30,108000,1500,0,106500',
      'TEMP-10003,"Efficacy of Cytb Test in Field Settings for Active Case Finding of Tuberculosis",Dr. Ananya Sen,Scientist E,Aravind Nair,01-12-2021,30-11-2027,Project Assistant,9123456789,"Thiruvananthapuram, Kerala",9876-5432-1098,JKLMN4567P,ICICI Bank,000412345678,ICIC0000004,4,2026,31000,6200,2.0,1.5,3.5,4,-0.5,0.5,29.5,37200,0,517,36683',
      'TEMP-10004,"Efficacy of Cytb Test in Field Settings for Active Case Finding of Tuberculosis",Dr. Ananya Sen,Scientist E,Meenakshi Iyer,10-01-2024,30-11-2027,Data Entry Operator,9898989898,"Adyar, Chennai",3456-7890-1234,VUTSR9876Q,Indian Bank,987654321,IDIB000M001,4,2026,20000,4000,0,1.5,1.5,3.5,-2,2,28,24000,0,1333,22667',
      'TEMP-10005,"Implementing a Screening and Identification Model for Latent Tuberculosis Among Family Members of TB Patients Using the Cytb Test with Android Application",Dr. Rajesh Verma,Scientist C,Vikram Rathore,05-09-2023,31-10-2026,Junior Research Fellow (JRF),8877665544,"Jodhpur, Rajasthan",7890-1234-5678,PQRST4567A,Punjab National Bank,123400150012,PUNB0123400,4,2026,37000,7400,0.5,1.5,2,5,-3,3,27,44400,200,3700,40500'
    ];

    const csvContent = headers + "\n" + rows.join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project_staff_salary_payroll_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Project Staff exact salary CSV payroll template downloaded.');
  };

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        {/* Left: Upload and Preview panel */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <div className="flex justify-between items-center w-full py-1">
                <span className="font-extrabold text-xs sm:text-sm text-blue-700 dark:text-blue-400">📊 UPLOAD NEW SALARY PAYROLL SHEET</span>
                <Button size="small" type="dashed" className="text-[10px] font-bold" onClick={downloadSampleCSV}>
                  Sample CSV
                </Button>
              </div>
            }
            variant="borderless"
            className="shadow-sm rounded-xl overflow-hidden"
          >
            <div className="space-y-4">
              <Row gutter={12}>
                <Col span={12}>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Upload Period Month</label>
                  <Select value={uploadMonth} onChange={setUploadMonth} className="w-full">
                    {MONTHS.map(m => (
                      <Option key={m} value={m}>{m}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Select Year</label>
                  <Select value={uploadYear} onChange={setUploadYear} className="w-full">
                    {YEARS.map(y => (
                      <Option key={y} value={y}>{y}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <div className="p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition-all cursor-pointer relative text-center">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleCSVFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadOutlined className="text-3xl text-slate-400 block mb-2" />
                <span className="block text-xs font-bold text-slate-700 dark:text-zinc-200">
                  {csvFileName ? `✔️ Attached: ${csvFileName}` : 'Drag and drop or click to choose CSV payroll file'}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">File format supported: .csv only</span>
              </div>

              {parsedPreview && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-100 dark:border-zinc-800 text-[11px] space-y-2">
                  <div className="font-bold text-slate-700 dark:text-zinc-300">✔️ Parse Result Preview:</div>
                  <div>Rows Found: <strong className="text-emerald-600">{parsedPreview.rowsCount} rows</strong></div>
                  <div>Detected Headers: {parsedPreview.headers.map(h => <Tag key={h} className="text-[9px] m-0.5">{h}</Tag>)}</div>
                </div>
              )}

              <Button 
                type="primary" 
                block 
                disabled={!csvText}
                loading={submitting}
                onClick={handleUploadCSV}
                className="rounded-lg text-xs font-bold bg-[#005EB8]"
                icon={<CheckCircleOutlined />}
              >
                Parse CSV & Generate Staff Salaries
              </Button>
            </div>
          </Card>
        </Col>

        {/* Right: Uploaded logs overview list */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Central Registry Ledger</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">📂 Active Salary Payslips Statements</span>
                </div>
                <Space>
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={handleOpenCreateModal}
                    className="rounded-lg text-xs font-bold bg-[#005EB8]"
                  >
                    Add Payslip
                  </Button>
                  <Input
                    placeholder="Search statements..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    style={{ width: '150px' }}
                    className="rounded-lg text-xs"
                  />
                </Space>
              </div>
            }
            variant="borderless"
            className="shadow-sm rounded-xl overflow-hidden h-full"
          >
            <Table 
              columns={columns} 
              dataSource={filteredSalaries} 
              loading={loading}
              pagination={{ pageSize: 5 }}
              size="middle"
              rowKey="id"
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: <Empty description="No salary statements uploaded for project staff." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div className="border-b border-slate-100 pb-2">
            <span className="font-extrabold text-sm text-blue-600 block uppercase">
              {editingSlip ? '📝 EDIT MANUAL SALARY PAYSLIP' : '➕ GENERATE MANUAL SALARY PAYSLIP'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {editingSlip ? `ID: ${editingSlip.id}` : 'Create a single payslip entry directly'}
            </span>
          </div>
        }
        open={manualModalOpen}
        onCancel={() => setManualModalOpen(false)}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <Form
          form={manualForm}
          layout="vertical"
          onFinish={handleSaveManualSlip}
          className="mt-4"
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="text-xs font-semibold">Employee / Staff Name</span>}
                name="name"
                rules={[{ required: true, message: 'Please enter employee name' }]}
              >
                <Input placeholder="e.g. Rohit Deshmukh" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="text-xs font-semibold">Temporary Employee Code</span>}
                name="employeeCode"
                rules={[{ required: true, message: 'Please enter employee code' }]}
              >
                <Input placeholder="e.g. TEMP-10001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="text-xs font-semibold">Registered Mobile Number</span>}
                name="mobile"
                rules={[{ required: true, message: 'Please enter mobile' }]}
              >
                <Input placeholder="e.g. 9988776655" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="text-xs font-semibold">Aadhaar Card Number</span>}
                name="aadhaarNumber"
                rules={[{ required: true, message: 'Please enter Aadhaar' }]}
              >
                <Input placeholder="e.g. 1234-5678-9012" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="text-xs font-semibold">Payslip Month</span>}
                name="month"
                rules={[{ required: true }]}
              >
                <Select>
                  {MONTHS.map(m => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="text-xs font-semibold">Payslip Year</span>}
                name="year"
                rules={[{ required: true }]}
              >
                <Select>
                  {YEARS.map(y => <Option key={y} value={y}>{y}</Option>)}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Divider className="my-1" />
              <span className="text-xs font-bold text-slate-700 block mb-3">💰 SALARY SLIP FINANCIAL BREAKDOWN</span>
            </Col>

            <Col xs={12} sm={8}>
              <Form.Item
                label={<span className="text-xs font-medium">Basic Pay (INR)</span>}
                name="basicPay"
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. 78000" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label={<span className="text-xs font-medium">HRA (INR)</span>}
                name="hra"
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. 15600" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label={<span className="text-xs font-medium">Gross Remuneration (INR)</span>}
                name="grossRemuneration"
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. 93600" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label={<span className="text-xs font-medium">Income Tax Deduction (INR)</span>}
                name="incomeTaxDeduction"
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. 1000" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label={<span className="text-xs font-medium">LWP Deduction (INR)</span>}
                name="lwpDeduction"
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. 0" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label={<span className="text-xs font-medium">Net Pay Remitted (INR)</span>}
                name="netPay"
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. 92600" />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setManualModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-[#005EB8]" icon={<CheckCircleOutlined />}>
              Save Payslip Details
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
