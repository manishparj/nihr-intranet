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

export const calculateIcmrTenureStatus = (staff: any, project: any) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // A. Previous ICMR Experience
  let prevIcmrDays = 0;
  if (staff && staff.previousIcmrExperience && Array.isArray(staff.previousIcmrExperience)) {
    staff.previousIcmrExperience.forEach((entry: any) => {
      const start = parseDateFlexible(entry.fromDate);
      const end = parseDateFlexible(entry.toDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        prevIcmrDays += diffDays;
      }
    });
  }

  // B. Current Experience (DOJ to Today or lastWorkingDate if Left)
  let currentIcmrDays = 0;
  let currentIcmrEnd = todayStr;
  if (staff && staff.status === 'Left' && staff.lastWorkingDate) {
    currentIcmrEnd = staff.lastWorkingDate;
  }
  if (staff && staff.doj) {
    const start = parseDateFlexible(staff.doj);
    const end = parseDateFlexible(currentIcmrEnd);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      currentIcmrDays += diffDays;
    }
  }

  // C. Total ICMR EXP (Previous + Current)
  const totalIcmrDays = prevIcmrDays + currentIcmrDays;

  // Days to Y-M-D conversion helper
  const daysToYMD = (totalDays: number) => {
    const y = Math.floor(totalDays / 365.25);
    const remainingDaysAfterY = totalDays - (y * 365.25);
    const m = Math.floor(remainingDaysAfterY / 30.4375);
    const d = Math.round(remainingDaysAfterY - (m * 30.4375));
    return { y, m, d };
  };

  const prevIcmrYMD = daysToYMD(prevIcmrDays);
  const currentIcmrYMD = daysToYMD(currentIcmrDays);
  const totalIcmrYMD = daysToYMD(totalIcmrDays);

  // D. Non-ICMR Experience
  let nonIcmrDays = 0;
  if (staff && staff.previousNonIcmrExperience && Array.isArray(staff.previousNonIcmrExperience)) {
    staff.previousNonIcmrExperience.forEach((entry: any) => {
      const start = parseDateFlexible(entry.fromDate);
      const end = parseDateFlexible(entry.toDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        nonIcmrDays += diffDays;
      }
    });
  }
  const nonIcmrYMD = daysToYMD(nonIcmrDays);

  // E. Cumulative Experience Month Totals (Total ICMR + Non-ICMR)
  const cumulativeDays = totalIcmrDays + nonIcmrDays;
  const cumulativeYMD = daysToYMD(cumulativeDays);
  const cumulativeTotalMonths = cumulativeDays / 30.4375;

  // F. Cut Off Date calculation
  // 5 Years (60 months) limit = 1826 days
  const icmrFiveYearLimitDays = 1826;
  let limitDate: Date | null = null;
  let limitDateStr = 'N/A';
  if (staff && staff.doj) {
    const dojDate = parseDateFlexible(staff.doj);
    if (!isNaN(dojDate.getTime())) {
      const daysNeeded = icmrFiveYearLimitDays - prevIcmrDays;
      const tempLimitDate = new Date(dojDate.getTime());
      tempLimitDate.setDate(tempLimitDate.getDate() + daysNeeded);
      limitDate = tempLimitDate;
      limitDateStr = tempLimitDate.toISOString().split('T')[0];
    }
  }

  // Project Last Date (Project End Date)
  let projectEndDate: Date | null = null;
  let projectEndDateStr = 'N/A';
  if (project && project.endDate) {
    const parsed = parseDateFlexible(project.endDate);
    if (!isNaN(parsed.getTime())) {
      projectEndDate = parsed;
      projectEndDateStr = project.endDate;
    }
  }

  // Cut-off date is the earliest of Project End Date and 5-Year Limit Date
  let cutOffDate: Date | null = null;
  let cutOffDateStr = 'N/A';
  let cutOffReason = '';

  if (limitDate && projectEndDate) {
    if (limitDate < projectEndDate) {
      cutOffDate = limitDate;
      cutOffDateStr = limitDateStr;
      cutOffReason = '5-Year ICMR Limit';
    } else {
      cutOffDate = projectEndDate;
      cutOffDateStr = projectEndDateStr;
      cutOffReason = 'Project End Date';
    }
  } else if (limitDate) {
    cutOffDate = limitDate;
    cutOffDateStr = limitDateStr;
    cutOffReason = '5-Year ICMR Limit';
  } else if (projectEndDate) {
    cutOffDate = projectEndDate;
    cutOffDateStr = projectEndDateStr;
    cutOffReason = 'Project End Date';
  }

  // Red Flag Rule: Highlight active starting one month before the Cut Off Date
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let isRedFlag = false;
  let remainingDays = 0;
  let isExceeded = false;
  let remainingText = 'N/A';

  if (cutOffDate) {
    const compareDate = new Date(cutOffDate);
    compareDate.setHours(0,0,0,0);
    const diffTime = compareDate.getTime() - today.getTime();
    remainingDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (remainingDays < 0) {
      isExceeded = true;
      isRedFlag = true;
      const exceededDays = Math.abs(remainingDays);
      const exceededYMD = daysToYMD(exceededDays);
      let parts = [];
      if (exceededYMD.y > 0) parts.push(`${exceededYMD.y}y`);
      if (exceededYMD.m > 0) parts.push(`${exceededYMD.m}m`);
      if (exceededYMD.d > 0 || parts.length === 0) parts.push(`${exceededYMD.d}d`);
      remainingText = `Exceeded by ${parts.join(' ')}`;
    } else {
      // Visible to one month before (<= 30 days) Cut Off Date
      if (remainingDays <= 30) {
        isRedFlag = true;
      }
      
      const remYMD = daysToYMD(remainingDays);
      let parts = [];
      if (remYMD.y > 0) parts.push(`${remYMD.y}y`);
      if (remYMD.m > 0) parts.push(`${remYMD.m}m`);
      if (remYMD.d > 0 || parts.length === 0) parts.push(`${remYMD.d}d`);
      remainingText = `${parts.join(' ')} remaining`;
    }
  }

  return {
    prevIcmrDays,
    prevIcmrYMD,
    currentIcmrDays,
    currentIcmrYMD,
    totalIcmrDays,
    totalIcmrYMD,
    totalIcmrMonths: totalIcmrDays / 30.4375,
    nonIcmrDays,
    nonIcmrYMD,
    cumulativeDays,
    cumulativeYMD,
    cumulativeTotalMonths,
    limitDateStr,
    projectEndDateStr,
    cutOffDateStr,
    cutOffReason,
    isRedFlag,
    isExceeded,
    remainingDays,
    remainingText
  };
};

