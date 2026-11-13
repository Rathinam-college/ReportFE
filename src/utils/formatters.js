// Currency & Number Formatters for Indian Rupee (INR)
export const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return '₹' + Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
};

export const formatLakhs = (val) => {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(num / 100000).toFixed(2)} L`;
};

// SVG Donut Path Calculator
export const getDonutSlicePath = (cx, cy, rOuter, rInner, startAngle, endAngle) => {
  if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
    endAngle = startAngle + 2 * Math.PI - 0.001;
  }
  const x1 = cx + rOuter * Math.cos(startAngle);
  const y1 = cy + rOuter * Math.sin(startAngle);
  const x2 = cx + rOuter * Math.cos(endAngle);
  const y2 = cy + rOuter * Math.sin(endAngle);
  const x3 = cx + rInner * Math.cos(endAngle);
  const y3 = cy + rInner * Math.sin(endAngle);
  const x4 = cx + rInner * Math.cos(startAngle);
  const y4 = cy + rInner * Math.sin(startAngle);
  const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
};

// SVG Solid Pie Slice Path Calculator
export const getPieSlicePath = (cx, cy, radius, startAngle, endAngle) => {
  if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
    endAngle = startAngle + 2 * Math.PI - 0.001;
  }
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

export const DASH_COLORS = [
  '#2563eb', // Food Material - Blue
  '#8b5cf6', // Food Labour - Purple
  '#f59e0b', // Maintenance - Amber
  '#10b981', // Event - Green
  '#ec4899', // Festival - Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#e11d48'  // Rose
];
