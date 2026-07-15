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

  // Shared table-based HTML used for both download and print, so the two
  // outputs always stay visually identical and both scale down cleanly.
const buildSlipHTML = (activeSlip: SalarySlip, forPrint: boolean) => {
    const details = activeSlip.details || {};
    const getVal = (k: string) => details[k] || '-';
    const taxNum = parseFloat(getVal('Income Tax Deduction').replace(/[^0-9.]/g, '')) || 0;
    const lwpDedNum = parseFloat(getVal('Leave Without Pay Deduction').replace(/[^0-9.]/g, '')) || 0;
    const totalDed = taxNum + lwpDedNum;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>REMUNERATION STATEMENT - ${activeSlip.name} - ${activeSlip.month} ${activeSlip.year}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif; 
            margin: 0; 
            padding: 12px; 
            background: #f0f2f5; 
            color: #1a2332; 
            font-size: 11px;
            line-height: 1.5;
          }
          .sheet { 
            max-width: 850px; 
            margin: 0 auto; 
            background: #ffffff; 
            border: 1px solid #d1d5db; 
            border-radius: 6px; 
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          }
          
          /* Header */
          .header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            border-bottom: 2.5px solid #1a5fb4;
            background: #f8faff;
          }
          .header img { height: 38px; width: auto; }
          .header .org-name { 
            font-size: 15px; 
            font-weight: 800; 
            color: #1a5fb4; 
            margin: 0; 
            letter-spacing: 0.3px;
          }
          .header .org-sub { 
            font-size: 9px; 
            font-weight: 600; 
            color: #5e6f8d; 
            letter-spacing: 0.5px; 
            text-transform: uppercase;
          }
          .title-bar {
            background: #f0f4f8;
            padding: 6px;
            text-align: center;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #1a2332;
            border-bottom: 1px solid #e2e8f0;
          }

          /* Content */
          .content { padding: 14px 18px 8px; }

          /* Staff & Bank Combined - Two Column Layout */
          .info-grid {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
          }
          .info-grid-inner {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
          }
          .info-col {
            padding: 8px 14px;
          }
          .info-col:first-child {
            border-right: 1px solid #e2e8f0;
          }
          .info-row {
            display: flex;
            padding: 4px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-row .label {
            width: 35%;
            font-weight: 700;
            color: #5e6f8d;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            flex-shrink: 0;
          }
          .info-row .value {
            width: 65%;
            font-weight: 600;
            color: #0f172a;
            font-size: 10.5px;
            word-break: break-word;
          }
          .info-col .col-title {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1a5fb4;
            padding: 4px 0 3px;
            border-bottom: 2px solid #1a5fb4;
            margin-bottom: 5px;
          }
          .info-col .col-title.gray {
            color: #475569;
            border-bottom-color: #475569;
          }

          /* Leave Table */
          .leave-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
          }
          .leave-wrap .table-title {
            background: #f0f4f8;
            padding: 5px 12px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
          }
          .leave-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          .leave-table th {
            background: #f8fafc;
            color: #475569;
            font-weight: 800;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 6px 8px;
            border-bottom: 1.5px solid #e2e8f0;
            text-align: center;
          }
          .leave-table td {
            padding: 7px 8px;
            text-align: center;
            font-weight: 700;
            font-size: 10.5px;
            border-bottom: 1px solid #f1f5f9;
          }
          .leave-table tr:last-child td {
            border-bottom: none;
          }

          /* Salary Row - 3 columns */
          .salary-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          .salary-box {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
          }
          .salary-box .box-title {
            padding: 5px 12px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #ffffff;
            text-align: center;
          }
          .salary-box .box-title.earn { background: #1a5fb4; }
          .salary-box .box-title.ded { background: #475569; }
          .salary-box .box-title.net { background: #0d9488; }

          .salary-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 10.5px;
          }
          .salary-item:last-child {
            border-bottom: none;
          }
          .salary-item .s-label {
            font-weight: 600;
            color: #334155;
          }
          .salary-item .s-value {
            font-weight: 700;
            color: #0f172a;
          }
          .salary-item.total {
            background: #f8fafc;
            font-weight: 800;
            border-top: 2px solid #d1d5db;
          }
          .salary-item.total .s-value.gross {
            color: #1a5fb4;
            font-size: 11.5px;
          }
          .salary-item.total .s-value.ded {
            color: #dc2626;
            font-size: 11.5px;
          }
          .salary-item.net-row {
            background: #0d9488;
            padding: 8px 12px;
            border-bottom: none;
          }
          .salary-item.net-row .s-label {
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .salary-item.net-row .s-value {
            color: #ffffff;
            font-size: 16px;
            font-weight: 900;
          }

          /* Important Box */
          .important-box {
            border: 2px solid #dc2626;
            border-radius: 4px;
            padding: 10px 14px;
            background: #fefaf9;
            margin: 0 0 6px 0;
          }
          .important-box .imp-title {
            font-size: 10px;
            font-weight: 900;
            color: #dc2626;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .important-box p {
            font-size: 9px;
            line-height: 1.6;
            color: #1e293b;
            margin: 0 0 4px 0;
          }
          .important-box p:last-child {
            margin-bottom: 0;
          }
          .important-box .hl {
            color: #dc2626;
            font-weight: 700;
          }

          /* Footer */
          .footer {
            text-align: center;
            font-size: 8.5px;
            color: #94a3b8;
            padding: 8px 18px 12px;
            border-top: 1px solid #f1f5f9;
          }
          .footer .contact {
            font-size: 9.5px;
            color: #5e6f8d;
            font-weight: 600;
            margin: 3px 0;
          }
          .footer .contact a {
            color: #1a5fb4;
            text-decoration: none;
          }

          /* Print Styles */
          @media print {
            body { 
              background: #fff; 
              padding: 6px; 
              font-size: 10px;
            }
            .sheet { 
              border: none; 
              border-radius: 0; 
              max-width: 100%; 
              box-shadow: none;
              margin: 0;
            }
            .header { padding: 8px 16px; }
            .header img { height: 32px; }
            .header .org-name { font-size: 13px; }
            .content { padding: 10px 14px 6px; }
            .info-col { padding: 6px 12px; }
            .info-col:first-child {
              border-right: 1px solid #e2e8f0;
            }
            .info-row { padding: 3px 0; }
            .info-row .label { font-size: 8px; }
            .info-row .value { font-size: 9.5px; }
            .info-col .col-title { font-size: 8px; padding: 3px 0; }
            .leave-table th { font-size: 7.5px; padding: 5px 6px; }
            .leave-table td { font-size: 9.5px; padding: 5px 6px; }
            .salary-item { font-size: 9.5px; padding: 4px 10px; }
            .salary-item.total .s-value.gross { font-size: 10.5px; }
            .salary-item.total .s-value.ded { font-size: 10.5px; }
            .salary-item.net-row { padding: 6px 10px; }
            .salary-item.net-row .s-label { font-size: 9.5px; }
            .salary-item.net-row .s-value { font-size: 14px; }
            .salary-box .box-title { font-size: 8px; padding: 4px 10px; }
            .important-box { padding: 8px 12px; }
            .important-box .imp-title { font-size: 9px; }
            .important-box p { font-size: 8px; line-height: 1.5; margin-bottom: 3px; }
            .footer { font-size: 7.5px; padding: 6px 14px 8px; }
            .footer .contact { font-size: 8.5px; }
            .title-bar { font-size: 10px; padding: 5px; }
            .salary-row { gap: 8px; }
            .info-grid { margin-bottom: 8px; }
            .leave-wrap { margin-bottom: 8px; }
            .salary-row { margin-bottom: 8px; }
            
            /* Ensure colors print */
            .salary-box .box-title.earn { background: #1a5fb4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .salary-box .box-title.ded { background: #475569 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .salary-box .box-title.net { background: #0d9488 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .salary-item.net-row { background: #0d9488 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }

          /* Responsive */
          @media (max-width: 640px) {
            body { padding: 6px; font-size: 10px; }
            .header { padding: 8px 12px; flex-wrap: wrap; }
            .header img { height: 28px; }
            .header .org-name { font-size: 12px; }
            .content { padding: 8px 10px 4px; }
            .info-grid-inner {
              grid-template-columns: 1fr;
            }
            .info-col:first-child {
              border-right: none;
              border-bottom: 1px solid #e2e8f0;
            }
            .salary-row { grid-template-columns: 1fr; gap: 6px; }
            .info-row .label { width: 40%; }
            .info-row .value { width: 60%; }
            .salary-item.net-row .s-value { font-size: 14px; }
            .important-box p { font-size: 8.5px; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <!-- Header -->
          <div class="header">
            <img src="https://niirncd.icmr.org.in/assets/img/logo/nihrlogo.png" alt="ICMR Logo" />
            <div>
              <div class="org-name">ICMR-National Institute for Health Research, Jodhpur</div>
              <div class="org-sub">Ministry of Health & Family Welfare, Government of India</div>
            </div>
          </div>
          <div class="title-bar">Remuneration Statement &mdash; ${activeSlip.month} ${activeSlip.year}</div>

          <div class="content">
            <!-- Staff & Bank Details - Two Column Layout -->
            <div class="info-grid">
              <div class="info-grid-inner">
                <!-- Left Column: Staff Details -->
                <div class="info-col">
                  <div class="col-title">Staff Details</div>
                  <div class="info-row"><span class="label">Employee Name</span><span class="value">${getVal('Employee Name')}</span></div>
                  <div class="info-row"><span class="label">Employee Code</span><span class="value">${getVal('Employee Code')}</span></div>
                  <div class="info-row"><span class="label">Designation</span><span class="value">${getVal('Designation')}</span></div>
                  <div class="info-row"><span class="label">Date of Joining</span><span class="value">${getVal('Date of Joining')}</span></div>
                  <div class="info-row"><span class="label">Tenure Up To</span><span class="value">${getVal('Tenure Up To')}</span></div>
                  <div class="info-row"><span class="label">Employment Status</span><span class="value">Purely Temporary / Project Staff (Co-terminus with the Project)</span></div>
                  <div class="info-row"><span class="label">Aadhaar (Masked)</span><span class="value">XXXX-XXXX-${activeSlip.aadhaarNumber.slice(-4)}</span></div>
                  <div class="info-row"><span class="label">Project Name</span><span class="value">${getVal('Project Name')}</span></div>
                  <div class="info-row"><span class="label">Principal Investigator</span><span class="value">${getVal('Scientist Name')}</span></div>
                  <div class="info-row"><span class="label">PI Designation</span><span class="value">${getVal('Scientist Designation')}</span></div>
                </div>
                
                <!-- Right Column: Bank Details -->
                <div class="info-col">
                  <div class="col-title gray">Bank Details</div>
                  <div class="info-row"><span class="label">Bank Name</span><span class="value">${getVal('Bank Name')}</span></div>
                  <div class="info-row"><span class="label">Account Number</span><span class="value">${getVal('Account Number')}</span></div>
                  <div class="info-row"><span class="label">IFSC Code</span><span class="value">${getVal('IFSC Code')}</span></div>
                  <div class="info-row"><span class="label">PAN Number</span><span class="value">${getVal('PAN Number')}</span></div>
                </div>
              </div>
            </div>

            <!-- Leave Details -->
            <div class="leave-wrap">
              <div class="table-title">Leave Details</div>
              <table class="leave-table">
                <thead>
                  <tr>
                    <th>Month Days</th>
                    <th>Present</th>
                    <th>B/F Leave</th>
                    <th>Leave Credit</th>
                    <th>Total Leave</th>
                    <th>Availed</th>
                    <th>Balance</th>
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
            </div>

            <!-- Earnings, Deductions & Net Pay -->
            <div class="salary-row">
              <div class="salary-box">
                <div class="box-title earn">Earnings</div>
                <div class="salary-item"><span class="s-label">Consolidated Remuneration</span><span class="s-value">${getVal('Basic Pay')}</span></div>
                <div class="salary-item"><span class="s-label">HRA Allowance</span><span class="s-value">${getVal('HRA')}</span></div>
                <div class="salary-item total"><span class="s-label">Gross Remuneration</span><span class="s-value gross">${getVal('Gross Remuneration')}</span></div>
              </div>

              <div class="salary-box">
                <div class="box-title ded">Deductions</div>
                <div class="salary-item"><span class="s-label">Income Tax (TDS)</span><span class="s-value">${getVal('Income Tax Deduction')}</span></div>
                <div class="salary-item"><span class="s-label">Leave Without Pay</span><span class="s-value">${getVal('Leave Without Pay Deduction')}</span></div>
                <div class="salary-item total"><span class="s-label">Total Deductions</span><span class="s-value ded">₹${totalDed.toLocaleString('en-IN')}</span></div>
              </div>

              <div class="salary-box">
                <div class="box-title net">Net Pay</div>
                <div class="salary-item net-row">
                  <span class="s-label">Take-home Amount</span>
                  <span class="s-value">${getVal('Net Pay')}</span>
                </div>
              </div>
            </div>

            <!-- Important Instructions -->
            <div class="important-box">
              <div class="imp-title">⚠️ Important Instructions &amp; Disclaimers</div>
              <p><strong>1. Employment Status:</strong> This is a <span class="hl">purely temporary/contractual</span> engagement under a time-bound research project. The employee has <span class="hl">no claim</span> for regular appointment, absorption, continuation of service, pension, or any other benefits beyond the terms of the appointment.</p>
              <p><strong>2. Document Purpose:</strong> This computer-generated remuneration statement is issued <span class="hl">only for information and record purposes</span>. It does not require a physical signature.</p>
              <p><strong>3. Non-Transferability:</strong> This statement shall <span class="hl">not be construed</span> as proof of permanent Government employment or guarantee of future employment.</p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="contact">ICMR&ndash;National Institute for Health Research, Jodhpur</div>
              <div class="contact">Website: <a href="https://niirncd.icmr.org.in/">https://niirncd.icmr.org.in/</a> &nbsp;|&nbsp; Email: <a href="mailto:director-niirncd@icmr.gov.in">director-niirncd@icmr.gov.in</a></div>
              <div style="margin-top: 3px;">System-generated document &bull; Valid without signature</div>
            </div>
          </div>
        </div>
        ${forPrint ? '<script>window.onload = function(){ window.print(); };</script>' : ''}
      </body>
      </html>
    `;
  };

  const handlePrintSlip = () => {
    if (!activeSlip) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Failed to open printing target. Please allow popups.');
      return;
    }
    printWindow.document.write(buildSlipHTML(activeSlip, true));
    printWindow.document.close();
  };

  const details = activeSlip?.details || {};
  const getVal = (k: string) => details[k] || '-';
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
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
              ✔️ Authenticated successfully as <strong className="text-blue-600 dark:text-blue-400">{activeSlip.name}</strong>
            </span>
            <Button size="small" type="dashed" danger onClick={() => setActiveSlip(null)}>
              Sign Out / Lock Portal
            </Button>
          </div>
          {/* Download & Print Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
        destroyOnClose
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