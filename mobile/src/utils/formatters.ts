export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('zh-CN').format(value);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const getPositionName = (position: string): string => {
  const positionMap: Record<string, string> = {
    GK: '门将',
    CB: '中后卫',
    LB: '左后卫',
    RB: '右后卫',
    CDM: '后腰',
    CM: '中前卫',
    CAM: '前腰',
    LM: '左前卫',
    RM: '右前卫',
    LW: '左边锋',
    RW: '右边锋',
    ST: '前锋',
  };
  return positionMap[position] || position;
};

export const getOverallRatingColor = (rating: number): string => {
  if (rating >= 85) return '#4CAF50';
  if (rating >= 75) return '#8BC34A';
  if (rating >= 65) return '#FFC107';
  if (rating >= 55) return '#FF9800';
  return '#f44336';
};
