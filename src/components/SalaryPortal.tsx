import React, { useState, useEffect } from 'react';
import {
  Card, Button, Select, Input, Row, Col, Table,
  message, Tag, Empty, Popconfirm, Alert
} from 'antd';
import {
  DownloadOutlined, PrinterOutlined, DeleteOutlined,
  SearchOutlined, LockOutlined, IdcardOutlined, PhoneOutlined,
  UploadOutlined, CheckCircleOutlined
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
// Shared helpers
// ==========================================
const toNumber = (val: string) => parseFloat((val || '').replace(/[^0-9.]/g, '')) || 0;

// A single compact "label over value" cell used across the slip
const InfoCell: React.FC<{ label: string; value: React.ReactNode; span?: string }> = ({ label, value, span }) => (
  <div className={span}>
    <div className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500 leading-none">
      {label}
    </div>
    <div className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-tight mt-0.5 truncate">
      {value}
    </div>
  </div>
);

const SectionLabel: React.FC<{ n: number; title: string }> = ({ n, title }) => (
  <div className="flex items-center gap-1.5 mb-1.5 mt-3 first:mt-0">
    <span className="w-4 h-4 rounded-full bg-[#005EB8] text-white text-[8px] font-black flex items-center justify-center shrink-0">
      {n}
    </span>
    <span className="text-[9.5px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
      {title}
    </span>
  </div>
);

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

  const handlePrintSlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !activeSlip) {
      message.error('Failed to open printing target. Please allow popups.');
      return;
    }

    const details = activeSlip.details || {};
    const getVal = (k: string) => details[k] || '-';
    const taxNum = toNumber(getVal('Income Tax Deduction'));
    const lwpDedNum = toNumber(getVal('Leave Without Pay Deduction'));
    const totalDed = taxNum + lwpDedNum;

    printWindow.document.write(`
      <html>
      <head>
        <title>Salary Slip - ${activeSlip.name}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #1a202c; font-size: 12px; }
          .container { border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px 20px; max-width: 760px; margin: 0 auto; }
          .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 2px solid #005EB8; padding-bottom: 10px; }
          .header img { height: 36px; }
          .header h2 { margin: 0; color: #005EB8; font-size: 15px; }
          .header p { margin: 2px 0 0 0; font-size: 9.5px; color: #64748b; letter-spacing: .3px; }
          h4.sec { margin: 10px 0 4px 0; font-size: 9.5px; text-transform: uppercase; color: #64748b; letter-spacing: .4px; font-weight: 700; }
          .meta-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 12px; margin-bottom: 8px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .meta-section.wide-first { grid-template-columns: 2fr 1fr; }
          .meta-item .label { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; letter-spacing: .3px; }
          .meta-item .val { font-size: 10.5px; font-weight: 700; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th { background: #f1f5f9; color: #475569; padding: 5px; font-size: 8.5px; border: 1px solid #cbd5e1; text-transform: uppercase; }
          td { padding: 6px 6px; border: 1px solid #cbd5e1; font-size: 10.5px; }
          .flex-row { display: flex; gap: 12px; margin-top: 8px; }
          .col { width: 50%; }
          .total { background: #f8fafc; font-weight: bold; }
          .net-banner { background: #005EB8; color: white; padding: 10px; border-radius: 6px; text-align: center; margin-top: 14px; font-size: 15px; font-weight: 800; letter-spacing: .3px; }
          .foot { text-align: center; font-size: 8px; color: #94a3b8; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://niirncd.icmr.org.in/assets/img/logo/nihrlogo.png" alt="Logo" />
            <div>
              <h2>National Institute for Health Research</h2>
              <p>OFFICIAL SALARY SLIP STATEMENT — ${activeSlip.month} ${activeSlip.year}</p>
            </div>
          </div>

          <h4 class="sec">1. Staff Appointment Details</h4>
          <div class="meta-section">
            <div class="meta-item"><span class="label">Employee Name</span><span class="val">${getVal('Employee Name')}</span></div>
            <div class="meta-item"><span class="label">Employee Code</span><span class="val">${getVal('Employee Code')}</span></div>
            <div class="meta-item"><span class="label">Designation</span><span class="val">${getVal('Designation')}</span></div>
            <div class="meta-item"><span class="label">Aadhaar (Masked)</span><span class="val">XXXX-XXXX-${activeSlip.aadhaarNumber.slice(-4)}</span></div>
            <div class="meta-item"><span class="label">Date of Joining</span><span class="val">${getVal('Date of Joining')}</span></div>
            <div class="meta-item"><span class="label">Tenure Up To</span><span class="val">${getVal('Tenure Up To')}</span></div>
          </div>

          <h4 class="sec">2. Project Reference &amp; Supervisor</h4>
          <div class="meta-section wide-first">
            <div class="meta-item"><span class="label">Project Name</span><span class="val">${getVal('Project Name')}</span></div>
            <div class="meta-item"><span class="label">PI / Supervisor</span><span class="val">${getVal('Scientist Name')} (${getVal('Scientist Designation')})</span></div>
          </div>

          <h4 class="sec">3. Bank Account Details</h4>
          <div class="meta-section">
            <div class="meta-item"><span class="label">Bank Name</span><span class="val">${getVal('Bank Name')}</span></div>
            <div class="meta-item"><span class="label">Account Number</span><span class="val">${getVal('Account Number')}</span></div>
            <div class="meta-item"><span class="label">IFSC Code</span><span class="val">${getVal('IFSC Code')}</span></div>
            <div class="meta-item"><span class="label">PAN Number</span><span class="val">${getVal('PAN Number')}</span></div>
          </div>

          <h4 class="sec">4. Leaves &amp; Attendance Summary</h4>
          <table>
            <thead>
              <tr>
                <th>Days in Month</th><th>Present</th><th>B/F Leave</th><th>Leave Credit</th>
                <th>Total Leave</th><th>Availed</th><th>Balance</th><th>LWP Days</th>
              </tr>
            </thead>
            <tbody>
              <tr style="text-align:center;">
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
              <h4 class="sec" style="margin-top:0;">Earnings</h4>
              <table>
                <thead><tr><th style="text-align:left;">Category</th><th style="text-align:right;">Amount</th></tr></thead>
                <tbody>
                  <tr><td>Basic Pay</td><td style="text-align:right;">${getVal('Basic Pay')}</td></tr>
                  <tr><td>HRA Allowance</td><td style="text-align:right;">${getVal('HRA')}</td></tr>
                  <tr class="total"><td>Gross Remuneration</td><td style="text-align:right;">${getVal('Gross Remuneration')}</td></tr>
                </tbody>
              </table>
            </div>
            <div class="col">
              <h4 class="sec" style="margin-top:0;">Deductions</h4>
              <table>
                <thead><tr><th style="text-align:left;">Category</th><th style="text-align:right;">Amount</th></tr></thead>
                <tbody>
                  <tr><td>Income Tax (TDS)</td><td style="text-align:right;">${getVal('Income Tax Deduction')}</td></tr>
                  <tr><td>Leave Without Pay</td><td style="text-align:right;">${getVal('Leave Without Pay Deduction')}</td></tr>
                  <tr class="total"><td>Total Deductions</td><td style="text-align:right;">₹${totalDed.toLocaleString('en-IN')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="net-banner">NET TAKE-HOME REMUNERATION &nbsp; ${getVal('Net Pay')}</div>
          <p class="foot">This is a dynamically generated statement. No hand-drawn signature is required.</p>
        </div>
        <script>window.onload = function () { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const details = activeSlip?.details || {};
  const getVal = (k: string) => details[k] || '-';
  const taxNum = toNumber(getVal('Income Tax Deduction'));
  const lwpDedNum = toNumber(getVal('Leave Without Pay Deduction'));
  const totalDed = taxNum + lwpDedNum;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 animate-fadeIn">
      {!activeSlip ? (
        <Card
          className="shadow-md rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          title={
            <div className="text-center py-2">
              <span className="block text-[10px] sm:text-[11px] text-blue-500 font-extrabold uppercase tracking-widest">
                🔒 Central Staff Payroll
              </span>
              <span className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-100">
                Project Staff Salary Slips Access Portal
              </span>
            </div>
          }
        >
          <div className="space-y-4 max-w-md mx-auto py-2 sm:py-4">
            <Alert
              message="Secure Authentication Required"
              description="Enter your registered mobile number and Aadhaar card number to view your monthly salary payslip."
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
                inputMode="numeric"
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
                inputMode="numeric"
              />
            </div>

            <Row gutter={12}>
              <Col xs={12}>
                <label className="text-xs font-bold text-slate-500 block mb-1">Payslip Month</label>
                <Select value={month} onChange={setMonth} className="w-full" style={{ height: 40 }}>
                  {MONTHS.map(m => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Col>
              <Col xs={12}>
                <label className="text-xs font-bold text-slate-500 block mb-1">Year</label>
                <Select value={year} onChange={setYear} className="w-full" style={{ height: 40 }}>
                  {YEARS.map(y => <Option key={y} value={y}>{y}</Option>)}
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
              Verify Credentials &amp; Load Payslip
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col xs:flex-row sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-100 dark:bg-zinc-800/50 p-2.5 rounded-lg">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-300">
              ✔️ Authenticated as <strong className="text-blue-600 dark:text-blue-400">{activeSlip.name}</strong>
            </span>
            <Button size="small" type="dashed" danger onClick={() => setActiveSlip(null)}>
              Sign Out
            </Button>
          </div>

          {/* ===== Compact professional payslip card ===== */}
          <Card
            id="printable-salary-slip"
            variant="outlined"
            className="shadow-sm rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            styles={{ body: { padding: 0 } }}
          >
            <div className="p-3 sm:p-5">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3 mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#005EB8] rounded flex items-center justify-center p-1 overflow-hidden shrink-0">
                  <img src="https://niirncd.icmr.org.in/assets/img/logo/nihrlogo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wide leading-tight truncate">
                    National Institute for Health Research
                  </h2>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold block">
                    Official Payroll Statement &middot; {activeSlip.month} {activeSlip.year}
                  </span>
                </div>
              </div>

              {/* 1. Appointment */}
              <SectionLabel n={1} title="Appointment & Staff Profile" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-2 bg-slate-50 dark:bg-zinc-800/20 p-2.5 sm:p-3 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                <InfoCell label="Staff Name" value={getVal('Employee Name')} span="col-span-2 sm:col-span-1" />
                <InfoCell label="Temp Code" value={getVal('Employee Code')} />
                <InfoCell label="Designation" value={getVal('Designation')} />
                <InfoCell label="Date of Joining" value={getVal('Date of Joining')} />
                <InfoCell label="Tenure Up To" value={getVal('Tenure Up To')} />
                <InfoCell label="Aadhaar (Masked)" value={`XXXX-XXXX-${activeSlip.aadhaarNumber.slice(-4)}`} />
              </div>

              {/* 2. Project */}
              <SectionLabel n={2} title="Associated Project & PI Scientist" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-2 bg-slate-50 dark:bg-zinc-800/20 p-2.5 sm:p-3 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                <InfoCell label="Project Title" value={getVal('Project Name')} span="sm:col-span-2" />
                <InfoCell
                  label="Principal Investigator"
                  value={<>{getVal('Scientist Name')} <span className="font-normal text-slate-400 dark:text-zinc-500">({getVal('Scientist Designation')})</span></>}
                />
              </div>

              {/* 3. Bank */}
              <SectionLabel n={3} title="Bank Account Details" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 bg-slate-50 dark:bg-zinc-800/20 p-2.5 sm:p-3 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                <InfoCell label="Bank Name" value={getVal('Bank Name')} />
                <InfoCell label="Account Number" value={getVal('Account Number')} />
                <InfoCell label="IFSC Code" value={getVal('IFSC Code')} />
                <InfoCell label="PAN Number" value={getVal('PAN Number')} />
              </div>

              {/* 4. Attendance */}
              <SectionLabel n={4} title="Leaves & Attendance Summary" />
              <div className="border border-slate-100 dark:border-zinc-800 rounded-lg overflow-x-auto bg-slate-50/30 dark:bg-zinc-800/10">
                <table className="w-full text-center text-[10.5px] border-collapse min-w-[480px]">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-zinc-800/50 text-slate-500 uppercase font-black text-[8px] border-b border-slate-100 dark:border-zinc-800">
                      <th className="p-1.5">Month Days</th>
                      <th className="p-1.5">Present</th>
                      <th className="p-1.5">B/F Leave</th>
                      <th className="p-1.5">Leave Credit</th>
                      <th className="p-1.5">Total Leave</th>
                      <th className="p-1.5">Availed</th>
                      <th className="p-1.5">Balance</th>
                      <th className="p-1.5 text-red-500">LWP Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-x divide-slate-100 dark:divide-zinc-800 font-bold text-slate-700 dark:text-zinc-300">
                    <tr>
                      <td className="p-1.5">{getVal('Days in Month')}</td>
                      <td className="p-1.5 text-emerald-600 dark:text-emerald-400">{getVal('Total Present Days')}</td>
                      <td className="p-1.5">{getVal('Balance Leave Brought')}</td>
                      <td className="p-1.5">{getVal('Leave Credit')}</td>
                      <td className="p-1.5">{getVal('Total Leave')}</td>
                      <td className="p-1.5 text-amber-600">{getVal('Leave Availed')}</td>
                      <td className="p-1.5 text-blue-600 dark:text-blue-400">{getVal('Leave Balance')}</td>
                      <td className="p-1.5 text-red-600">{getVal('Leave Without Pay')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Earnings / Deductions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[#005EB8] text-white uppercase text-[9px] font-black">
                        <th className="p-2 text-left">Earnings</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      <tr>
                        <td className="p-2 font-semibold text-slate-700 dark:text-zinc-300">Basic Pay</td>
                        <td className="p-2 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('Basic Pay')}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-slate-700 dark:text-zinc-300">HRA Allowance</td>
                        <td className="p-2 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('HRA')}</td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-zinc-800/50 border-t-2 border-slate-200 dark:border-zinc-700">
                        <td className="p-2 font-bold text-slate-900 dark:text-zinc-100">Gross Remuneration</td>
                        <td className="p-2 text-right font-black text-[#005EB8] dark:text-blue-400 text-xs">{getVal('Gross Remuneration')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-slate-700 dark:bg-zinc-800 text-white uppercase text-[9px] font-black">
                        <th className="p-2 text-left">Deductions</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      <tr>
                        <td className="p-2 font-semibold text-slate-700 dark:text-zinc-300">Income Tax (TDS)</td>
                        <td className="p-2 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('Income Tax Deduction')}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-slate-700 dark:text-zinc-300">Leave Without Pay</td>
                        <td className="p-2 text-right font-black text-slate-800 dark:text-zinc-200">{getVal('Leave Without Pay Deduction')}</td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-zinc-800/50 border-t-2 border-slate-200 dark:border-zinc-700">
                        <td className="p-2 font-bold text-slate-900 dark:text-zinc-100">Total Deductions</td>
                        <td className="p-2 text-right font-black text-red-600 dark:text-red-400 text-xs">₹{totalDed.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net pay */}
              <div className="bg-[#005EB8] text-white px-4 py-3 rounded-lg text-center shadow-inner mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-85">Net Disbursed Take-home Salary</span>
                <span className="text-xl sm:text-2xl font-black tracking-tight">{getVal('Net Pay')}</span>
              </div>

              <div className="text-center text-[9px] text-slate-400 leading-normal border-t border-slate-100 dark:border-zinc-800 pt-2 mt-3">
                This slip is generated dynamically from official project payroll records. No physical signature is required.
              </div>
            </div>
          </Card>

          {/* Print button */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handlePrintSlip}
              icon={<PrinterOutlined />}
              className="rounded-lg text-xs font-bold h-9 px-6"
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

export const AdminSalariesManager: React.FC<AdminSalariesManagerProps> = () => {
  const [salaries, setSalaries] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

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

      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setParsedPreview({ headers, rowsCount: lines.length - 1 });
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
      const res = await apiService.uploadSalaryCSV({ csvText, month: uploadMonth, year: uploadYear });
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

  const filteredSalaries = salaries.filter(s =>
    s.name.toLowerCase().includes(searchText.toLowerCase()) ||
    s.employeeCode.toLowerCase().includes(searchText.toLowerCase()) ||
    s.month.toLowerCase().includes(searchText.toLowerCase()) ||
    s.year.includes(searchText)
  );

  const columns = [
    { title: 'Employee Name', dataIndex: 'name', key: 'name' },
    { title: 'Temp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Mobile', dataIndex: 'mobile', key: 'mobile', render: (val: string) => val ? `XXXXXX${val.slice(-4)}` : '-' },
    { title: 'Aadhaar', dataIndex: 'aadhaarNumber', key: 'aadhaarNumber', render: (val: string) => val ? `XXXX-XXXX-${val.slice(-4)}` : '-' },
    { title: 'Month', dataIndex: 'month', key: 'month', render: (val: string) => <Tag color="blue" className="font-bold">{val}</Tag> },
    { title: 'Year', dataIndex: 'year', key: 'year' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, rec: SalarySlip) => (
        <Popconfirm title="Delete this payslip statement?" onConfirm={() => handleDeleteSlip(rec.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} title="Delete Slip" />
        </Popconfirm>
      )
    }
  ];

  const downloadSampleCSV = () => {
    const headers = [
      "Employee_Code", "Project_Name", "Scientist_Name", "Scientist_Designation", "Employee Name",
      "DOJ ", "Tenure_up_to", "Designation", "Mobile_Number", "Address", "Aadhaar_Number",
      "PAN_Number", "Bank_Name", "Account Number", "IFSC_Code", "Pay_Month", "Pay Year",
      "Basic_Pay", "HRA", "Balance_Leave_Brought_from_Previous_Month",
      "Leave_Credit_as_on_Last_pay_month_Last_Day", "Total_Leave", "Leave_Availed_During_the_Month",
      "Leave_Balance_as_on_31.03.26", "Leave_Without_Pay", "Total_Present_Day ",
      "Gross_Remuneration ", "InCome_Tax_Deduction", "LWP_Deduction", "Net_Pay"
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
    <div className="space-y-4 sm:space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 w-full py-1">
                <span className="font-extrabold text-xs sm:text-sm text-blue-700 dark:text-blue-400">📊 Upload Salary Payroll Sheet</span>
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
                <Col xs={12}>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Upload Period Month</label>
                  <Select value={uploadMonth} onChange={setUploadMonth} className="w-full">
                    {MONTHS.map(m => <Option key={m} value={m}>{m}</Option>)}
                  </Select>
                </Col>
                <Col xs={12}>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Select Year</label>
                  <Select value={uploadYear} onChange={setUploadYear} className="w-full">
                    {YEARS.map(y => <Option key={y} value={y}>{y}</Option>)}
                  </Select>
                </Col>
              </Row>

              <div className="p-5 sm:p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition-all cursor-pointer relative text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadOutlined className="text-2xl sm:text-3xl text-slate-400 block mb-2" />
                <span className="block text-xs font-bold text-slate-700 dark:text-zinc-200">
                  {csvFileName ? `✔️ Attached: ${csvFileName}` : 'Drag and drop or click to choose CSV payroll file'}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">File format supported: .csv only</span>
              </div>

              {parsedPreview && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-100 dark:border-zinc-800 text-[11px] space-y-2">
                  <div className="font-bold text-slate-700 dark:text-zinc-300">✔️ Parse Result Preview:</div>
                  <div>Rows Found: <strong className="text-emerald-600">{parsedPreview.rowsCount} rows</strong></div>
                  <div className="flex flex-wrap gap-1">
                    {parsedPreview.headers.map(h => <Tag key={h} className="text-[9px] m-0">{h}</Tag>)}
                  </div>
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

        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Central Registry Ledger</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">📂 Active Salary Payslip Statements</span>
                </div>
                <Input
                  placeholder="Search statements..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  className="rounded-lg text-xs w-full sm:w-[220px]"
                />
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
    </div>
  );
};
