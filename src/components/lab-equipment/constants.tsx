import React from 'react';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

export const CATEGORIES = [
  'Research Infrastructure',
  'Chromatography',
  'Imaging & Microscopy',
  'Spectroscopy & Spectrometry',
  'PCR/Sequencing & Genomics',
  'Flow Cytometry & Cell Sorting',
  'Centrifugation & Sample Prep',
  'Thermal/Incubation',
  'Cryo/Storage & Bio-banking',
  'Analytical & Mass Spectrometry',
  'Molecular Diagnostics',
  'General Lab Instrumentation',
  'Biosafety & Containment',
  'Electrophysiology & Neuro-analysis',
  'Other'
];

export const LOCATIONS = [
  'Central Laboratory',
  'Ground Floor, Analytical Core Lab Room 104',
  '1st Floor, Advanced Imaging Suite Room 210',
  '2nd Floor, Molecular Diagnostics Lab Room 302',
  'CIF Ground Floor - Bay 1 (Mass Spec & High-End Tech)',
  'CIF Ground Floor - Bay 2 (Chromatography)',
  'CIF 1st Floor - Confocal Microscopy Suite',
  'CIF 2nd Floor - Genomics & Flow Cytometry Lab',
  'Bio-Safety Level 2/3 Lab Facility',
  'Pre-Clinical Research & Animal Facility',
  'Other'
];

export const OPERATIONAL_STATUSES = [
  'Working',
  'Under Maintenance',
  'Out of Order',
  'Under Calibration / Standby',
  'Decommissioned',
  'Other'
];

export const FUNDING_AGENCIES = [
  'Govt',
  'ICMR Extramural',
  'ICMR Intramural',
  'DBT (Department of Biotechnology)',
  'DST (Department of Science & Technology)',
  'CSIR',
  'DHR National Biomedical Infrastructure',
  'WHO / International Grant',
  'Institutional CIF Corpus Fund',
  'Other'
];

export const DEPARTMENTS = [
  'Central Instrumentation Facility (CIF)',
  'Analytical Biochemistry & Pharmacology',
  'Cell Biology & Pathology',
  'Molecular Biology & Virology',
  'Microbiology & Immunology',
  'Biochemistry',
  'Genomics & Molecular Diagnostics Hub',
  'Epidemiology & Biostatistics',
  'Materials & Molecular Characterization Suite'
];

export const renderOperationalStatusBadge = (status: string) => {
  switch (status) {
    case 'Working':
      return (
        <Tag color="success" className="font-semibold flex items-center gap-1 border-0 shadow-xs px-2.5 py-0.5 rounded-full text-xs">
          <CheckCircleOutlined /> Working / Operational
        </Tag>
      );
    case 'Under Maintenance':
      return (
        <Tag color="warning" className="font-semibold flex items-center gap-1 border-0 shadow-xs px-2.5 py-0.5 rounded-full text-xs">
          <ClockCircleOutlined /> Under Maintenance
        </Tag>
      );
    case 'Out of Order':
      return (
        <Tag color="error" className="font-semibold flex items-center gap-1 border-0 shadow-xs px-2.5 py-0.5 rounded-full text-xs">
          <CloseCircleOutlined /> Out of Order
        </Tag>
      );
    case 'Under Calibration / Standby':
      return (
        <Tag color="processing" className="font-semibold flex items-center gap-1 border-0 shadow-xs px-2.5 py-0.5 rounded-full text-xs">
          <ExclamationCircleOutlined /> Under Calibration
        </Tag>
      );
    case 'Decommissioned':
      return (
        <Tag color="default" className="font-semibold flex items-center gap-1 border-0 shadow-xs px-2.5 py-0.5 rounded-full text-xs">
          <CloseCircleOutlined /> Decommissioned
        </Tag>
      );
    default:
      return <Tag className="font-semibold px-2.5 py-0.5 rounded-full text-xs">{status || 'Unknown'}</Tag>;
  }
};
