export const parseDateFlexible = (dateStr: string): Date => {
  if (!dateStr) return new Date(NaN);
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  // Support DD-MM-YYYY or DD/MM/YYYY
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(NaN);
};

export const getPeriodYMD = (fromDateStr: string, toDateStr: string) => {
  const start = parseDateFlexible(fromDateStr);
  const end = parseDateFlexible(toDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { y: 0, m: 0, d: 0 };
  }
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate() + 1; // inclusive of end date
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { y: years, m: months, d: days };
};

export const formatYMD = (ymd: { y: number; m: number; d: number }): string => {
  return `${ymd.y}-${ymd.m}-${ymd.d}`;
};

export const calculateStaffExperienceYMD = (staff: any) => {
  let icmrY = 0, icmrM = 0, icmrD = 0;
  if (staff && staff.previousIcmrExperience && Array.isArray(staff.previousIcmrExperience)) {
    staff.previousIcmrExperience.forEach((entry: any) => {
      const ymd = getPeriodYMD(entry.fromDate, entry.toDate);
      icmrY += ymd.y;
      icmrM += ymd.m;
      icmrD += ymd.d;
    });
  }
  
  let nonIcmrY = 0, nonIcmrM = 0, nonIcmrD = 0;
  if (staff && staff.previousNonIcmrExperience && Array.isArray(staff.previousNonIcmrExperience)) {
    staff.previousNonIcmrExperience.forEach((entry: any) => {
      const ymd = getPeriodYMD(entry.fromDate, entry.toDate);
      nonIcmrY += ymd.y;
      nonIcmrM += ymd.m;
      nonIcmrD += ymd.d;
    });
  }
  
  // Current Experience: DOJ to Today (or lastWorkingDate if they left)
  let currentY = 0, currentM = 0, currentD = 0;
  if (staff && staff.doj) {
    const fromDate = staff.doj;
    const toDate = staff.status === 'Left' && staff.lastWorkingDate
      ? staff.lastWorkingDate
      : new Date().toISOString().split('T')[0];
      
    const ymd = getPeriodYMD(fromDate, toDate);
    currentY = ymd.y;
    currentM = ymd.m;
    currentD = ymd.d;
  }
  
  // Sum and Carry over
  // ICMR
  icmrM += Math.floor(icmrD / 30);
  icmrD = icmrD % 30;
  icmrY += Math.floor(icmrM / 12);
  icmrM = icmrM % 12;
  
  // Non-ICMR
  nonIcmrM += Math.floor(nonIcmrD / 30);
  nonIcmrD = nonIcmrD % 30;
  nonIcmrY += Math.floor(nonIcmrM / 12);
  nonIcmrM = nonIcmrM % 12;
  
  // Current
  currentM += Math.floor(currentD / 30);
  currentD = currentD % 30;
  currentY += Math.floor(currentM / 12);
  currentM = currentM % 12;
  
  // Total combined
  let totalY = icmrY + nonIcmrY + currentY;
  let totalM = icmrM + nonIcmrM + currentM;
  let totalD = icmrD + nonIcmrD + currentD;
  
  totalM += Math.floor(totalD / 30);
  totalD = totalD % 30;
  totalY += Math.floor(totalM / 12);
  totalM = totalM % 12;
  
  return {
    icmr: { y: icmrY, m: icmrM, d: icmrD },
    nonIcmr: { y: nonIcmrY, m: nonIcmrM, d: nonIcmrD },
    current: { y: currentY, m: currentM, d: currentD },
    total: { y: totalY, m: totalM, d: totalD }
  };
};

export const renderMaskedField = (value: string | undefined, show: boolean, placeholder = '🔒 Restricted') => {
  if (!value) return '-';
  return show ? value : placeholder;
};
