// Currency & Number Formatters for Indian Rupee (INR) - Integer whole rupees, no decimal paise
export const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return '₹' + Math.round(Number(val)).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
};

export const formatLakhs = (val) => {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  const lk = (num / 100000).toFixed(2).replace(/\.00$/, '');
  return `₹${lk} L`;
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

export const THEME = {
  primary: '#6c56db',
  primaryHover: '#5d44db',
  primaryDark: '#39287a',
  primaryGradient: 'linear-gradient(135deg, #745df0 0%, #5d44db 100%)',
  coral: '#ff6088',
  coralGradient: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
  mint: '#10b981',
  mintLight: '#e6f9f3',
  canvas: '#e0e4ef',
  card: '#ffffff',
  subtle: '#f4f6fc',
  textDark: '#1a1d36',
  textMuted: '#6e768e',
  textDim: '#8f9bb3',
  border: '#edf0f8'
};

export const DASH_COLORS = [
  '#6c56db', // Royal Purple
  '#ff6088', // Coral Pink
  '#10b981', // Mint Green
  '#38bdf8', // Sky Blue
  '#f59e0b', // Warm Amber
  '#8b5cf6', // Violet
  '#ec4899', // Hot Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1'  // Indigo
];
