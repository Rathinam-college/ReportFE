import React, { useState, useRef } from 'react';
import { Info } from 'lucide-react';

export default function MonthlyExpenseCharts({
  chartModel = 'clustered_columns',
  months = [],
  categories = [],
  matrixValues = {},
  monthTotals = {},
  categoryTotals = {},
  cycleTotal = 0,
  unitMode = 'full',
  formatValue,
  monthPalette = ['#6c5ce7', '#ff6b9d', '#1fbf8f', '#3fb8ff', '#f5a524'],
  categoryPalette = ['#6c5ce7', '#ff6b9d', '#1fbf8f', '#3fb8ff', '#f5a524']
}) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, title, subtitle, value, percent }

  const handleMouseMove = (e, info) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      containerWidth: rect.width,
      containerHeight: rect.height,
      ...info
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Smart text wrapping for category labels to prevent collisions and overlays
  const wrapCategoryText = (name, maxChars = 14, maxLines = 2) => {
    if (!name) return [''];
    if (name.length <= maxChars) return [name];

    const formatted = String(name).replace(/\//g, '/ ').replace(/&/g, '& ');
    const tokens = formatted.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for (const tok of tokens) {
      const testLine = current ? (current + (current.endsWith('/') ? '' : ' ') + tok) : tok;
      if (!current) {
        current = tok;
      } else if (testLine.length <= maxChars) {
        current = testLine;
      } else {
        lines.push(current);
        current = tok;
      }
    }
    if (current) {
      lines.push(current);
    }

    return lines.slice(0, maxLines).map((line, idx) => {
      if (idx === maxLines - 1 && lines.length > maxLines) {
        return line.length > maxChars - 1 ? line.slice(0, maxChars - 2) + '…' : line + '…';
      }
      if (line.length > maxChars + 2) {
        return line.slice(0, maxChars) + '…';
      }
      return line;
    });
  };

  // 1. Clustered Columns Model
  const renderClusteredColumns = () => {
    let maxVal = 0;
    categories.forEach((cat) => {
      const cId = cat.category_id || cat.id;
      months.forEach((m) => {
        const val = matrixValues[m.id]?.[cId] || 0;
        if (val > maxVal) maxVal = val;
      });
    });
    if (maxVal === 0) maxVal = 100000;
    const yMax = maxVal * 1.15;

    const width = 880;
    const height = 360;
    const padLeft = 75;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 75;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const catCount = categories.length || 1;
    const monthCount = months.length || 1;
    const clusterW = chartW / catCount;
    const barW = Math.max(8, Math.min(28, (clusterW * 0.75) / monthCount));

    const yTicks = [0, 0.25, 0.5, 0.75, 1];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Y Axis Gridlines */}
        {yTicks.map((ratio) => {
          const y = padTop + chartH - ratio * chartH;
          const tickVal = ratio * yMax;
          return (
            <g key={ratio}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6a7392"
                fontWeight="600"
              >
                {formatValue(tickVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {categories.map((cat, cIdx) => {
          const cId = cat.category_id || cat.id;
          const clusterCenterX = padLeft + cIdx * clusterW + clusterW / 2;
          const clusterStartX = clusterCenterX - (monthCount * barW) / 2;
          const rawName = cat.category_name || cat.name || '';
          const maxChars = Math.max(11, Math.floor(clusterW / 8));
          const lines = wrapCategoryText(rawName, maxChars, 2);

          return (
            <g key={cId || cIdx}>
              {/* Category Label (Multi-line, no collision or overlay) */}
              <text
                x={clusterCenterX}
                y={height - padBottom + 18}
                textAnchor="middle"
                fontSize={lines.length > 1 ? "10.5" : "11.5"}
                fontWeight="700"
                fill="#141a33"
              >
                {lines.map((line, lIdx) => (
                  <tspan
                    key={lIdx}
                    x={clusterCenterX}
                    dy={lIdx === 0 ? 0 : 13}
                  >
                    {line}
                  </tspan>
                ))}
              </text>

              {months.map((m, mIdx) => {
                const val = matrixValues[m.id]?.[cId] || 0;
                const barH = (val / yMax) * chartH;
                const barX = clusterStartX + mIdx * barW;
                const barY = padTop + chartH - barH;
                const barColor = monthPalette[mIdx % monthPalette.length];

                return (
                  <rect
                    key={m.id || mIdx}
                    x={barX}
                    y={barY}
                    width={barW - 2}
                    height={Math.max(2, barH)}
                    rx="3"
                    fill={barColor}
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                    onMouseMove={(e) =>
                      handleMouseMove(e, {
                        title: `${cat.category_name || cat.name}`,
                        subtitle: `${m.period_label || m.period_code}`,
                        value: formatValue(val),
                        color: barColor
                      })
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  // 2. Stacked Columns Model
  const renderStackedColumns = () => {
    let maxMonthTot = 0;
    months.forEach((m) => {
      const tot = monthTotals[m.id] || 0;
      if (tot > maxMonthTot) maxMonthTot = tot;
    });
    if (maxMonthTot === 0) maxMonthTot = 100000;
    const yMax = maxMonthTot * 1.15;

    const width = 850;
    const height = 340;
    const padLeft = 75;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 55;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const monthCount = months.length || 1;
    const colW = Math.min(55, chartW / (monthCount * 1.8));

    const yTicks = [0, 0.25, 0.5, 0.75, 1];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {yTicks.map((ratio) => {
          const y = padTop + chartH - ratio * chartH;
          return (
            <g key={ratio}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6a7392" fontWeight="600">
                {formatValue(ratio * yMax)}
              </text>
            </g>
          );
        })}

        {months.map((m, mIdx) => {
          const mId = m.id;
          const colX = padLeft + (mIdx + 0.5) * (chartW / monthCount) - colW / 2;
          const mTotal = monthTotals[mId] || 0;
          let currentY = padTop + chartH;

          return (
            <g key={mId || mIdx}>
              {/* Month Total above column */}
              {mTotal > 0 && (
                <text
                  x={colX + colW / 2}
                  y={padTop + chartH - (mTotal / yMax) * chartH - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#141a33"
                >
                  {formatValue(mTotal)}
                </text>
              )}

              {/* Month Label */}
              <text
                x={colX + colW / 2}
                y={height - padBottom + 20}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#141a33"
              >
                {m.period_label || m.period_code}
              </text>

              {/* Stack segments */}
              {categories.map((cat, cIdx) => {
                const cId = cat.category_id || cat.id;
                const val = matrixValues[mId]?.[cId] || 0;
                if (val <= 0) return null;

                const segH = (val / yMax) * chartH;
                const segY = currentY - segH;
                currentY = segY;

                const segColor = categoryPalette[cIdx % categoryPalette.length];
                const pct = mTotal > 0 ? (val / mTotal) * 100 : 0;

                return (
                  <rect
                    key={cId}
                    x={colX}
                    y={segY}
                    width={colW}
                    height={segH}
                    fill={segColor}
                    rx={cIdx === categories.length - 1 ? '4' : '0'}
                    style={{ cursor: 'pointer' }}
                    onMouseMove={(e) =>
                      handleMouseMove(e, {
                        title: `${cat.category_name || cat.name}`,
                        subtitle: `${m.period_label || m.period_code}`,
                        value: `${formatValue(val)} (${pct.toFixed(1)}%)`,
                        color: segColor
                      })
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  // 3. Trend Lines Model (Needs >= 2 months)
  const renderTrendLines = () => {
    if (months.length < 2) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6a7392' }}>
          <Info size={32} style={{ margin: '0 auto 12px auto', color: '#5b5bf0' }} />
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#141a33' }}>
            Multi-Cycle View Required
          </div>
          <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
            Trend Lines require at least 2 billing cycles to plot historical progression. Please select "All Cycles" or a multi-month period from the Reporting Cycle menu.
          </div>
        </div>
      );
    }

    let maxVal = 0;
    categories.forEach((cat) => {
      const cId = cat.category_id || cat.id;
      months.forEach((m) => {
        const val = matrixValues[m.id]?.[cId] || 0;
        if (val > maxVal) maxVal = val;
      });
    });
    if (maxVal === 0) maxVal = 100000;
    const yMax = maxVal * 1.15;

    const width = 850;
    const height = 340;
    const padLeft = 75;
    const padRight = 35;
    const padTop = 30;
    const padBottom = 55;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    const monthStep = chartW / (months.length - 1);

    const yTicks = [0, 0.25, 0.5, 0.75, 1];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {yTicks.map((ratio) => {
          const y = padTop + chartH - ratio * chartH;
          return (
            <g key={ratio}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6a7392" fontWeight="600">
                {formatValue(ratio * yMax)}
              </text>
            </g>
          );
        })}

        {/* X Axis Months */}
        {months.map((m, mIdx) => {
          const x = padLeft + mIdx * monthStep;
          return (
            <text
              key={m.id || mIdx}
              x={x}
              y={height - padBottom + 22}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#141a33"
            >
              {m.period_label || m.period_code}
            </text>
          );
        })}

        {/* Category Lines */}
        {categories.map((cat, cIdx) => {
          const cId = cat.category_id || cat.id;
          const lineColor = categoryPalette[cIdx % categoryPalette.length];
          const points = months.map((m, mIdx) => {
            const val = matrixValues[m.id]?.[cId] || 0;
            const x = padLeft + mIdx * monthStep;
            const y = padTop + chartH - (val / yMax) * chartH;
            return { x, y, val, month: m };
          });

          const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

          return (
            <g key={cId}>
              <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" />
              {points.map((pt, pIdx) => (
                <circle
                  key={pIdx}
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke={lineColor}
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer' }}
                  onMouseMove={(e) =>
                    handleMouseMove(e, {
                      title: `${cat.category_name || cat.name}`,
                      subtitle: `${pt.month.period_label || pt.month.period_code}`,
                      value: formatValue(pt.val),
                      color: lineColor
                    })
                  }
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </g>
          );
        })}
      </svg>
    );
  };

  // 4. Stacked Area Model (Needs >= 2 months)
  const renderStackedArea = () => {
    if (months.length < 2) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6a7392' }}>
          <Info size={32} style={{ margin: '0 auto 12px auto', color: '#5b5bf0' }} />
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#141a33' }}>
            Multi-Cycle View Required
          </div>
          <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
            Stacked Area requires at least 2 billing cycles to render cumulative area layers. Please select "All Cycles" or a multi-month period.
          </div>
        </div>
      );
    }

    let maxMonthTot = 0;
    months.forEach((m) => {
      const tot = monthTotals[m.id] || 0;
      if (tot > maxMonthTot) maxMonthTot = tot;
    });
    if (maxMonthTot === 0) maxMonthTot = 100000;
    const yMax = maxMonthTot * 1.15;

    const width = 850;
    const height = 340;
    const padLeft = 75;
    const padRight = 35;
    const padTop = 30;
    const padBottom = 55;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    const monthStep = chartW / (months.length - 1);

    const yTicks = [0, 0.25, 0.5, 0.75, 1];

    // Build cumulative arrays per month
    // baselineY[mIdx] tracks baseline for next layer
    const layerBaselines = months.map(() => 0);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {yTicks.map((ratio) => {
          const y = padTop + chartH - ratio * chartH;
          return (
            <g key={ratio}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6a7392" fontWeight="600">
                {formatValue(ratio * yMax)}
              </text>
            </g>
          );
        })}

        {months.map((m, mIdx) => {
          const x = padLeft + mIdx * monthStep;
          return (
            <text
              key={m.id || mIdx}
              x={x}
              y={height - padBottom + 22}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#141a33"
            >
              {m.period_label || m.period_code}
            </text>
          );
        })}

        {categories.map((cat, cIdx) => {
          const cId = cat.category_id || cat.id;
          const areaColor = categoryPalette[cIdx % categoryPalette.length];

          const upperPoints = [];
          const lowerPoints = [];

          months.forEach((m, mIdx) => {
            const val = matrixValues[m.id]?.[cId] || 0;
            const bVal = layerBaselines[mIdx];
            const topVal = bVal + val;
            layerBaselines[mIdx] = topVal;

            const x = padLeft + mIdx * monthStep;
            const yTop = padTop + chartH - (topVal / yMax) * chartH;
            const yBottom = padTop + chartH - (bVal / yMax) * chartH;

            upperPoints.push({ x, y: yTop, val, month: m });
            lowerPoints.push({ x, y: yBottom });
          });

          // Build SVG closed polygon
          let d = `M ${upperPoints[0].x} ${upperPoints[0].y}`;
          for (let i = 1; i < upperPoints.length; i++) {
            d += ` L ${upperPoints[i].x} ${upperPoints[i].y}`;
          }
          for (let i = lowerPoints.length - 1; i >= 0; i--) {
            d += ` L ${lowerPoints[i].x} ${lowerPoints[i].y}`;
          }
          d += ' Z';

          return (
            <g key={cId}>
              <path
                d={d}
                fill={areaColor}
                fillOpacity="0.45"
                stroke={areaColor}
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) =>
                  handleMouseMove(e, {
                    title: `${cat.category_name || cat.name}`,
                    subtitle: 'Cumulative Area Layer',
                    value: formatValue(categoryTotals[cId] || 0),
                    color: areaColor
                  })
                }
                onMouseLeave={handleMouseLeave}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  // 5. Donut Share Model
  const renderDonutShare = () => {
    const validTotal = cycleTotal > 0 ? cycleTotal : 1;
    let cumulativeAngle = -Math.PI / 2;

    const cx = 180;
    const cy = 170;
    const outerR = 125;
    const innerR = 80;

    const slices = categories.map((cat, cIdx) => {
      const cId = cat.category_id || cat.id;
      const val = categoryTotals[cId] || 0;
      const angle = (val / validTotal) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;

      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);

      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      const pathData = `
        M ${x1} ${y1}
        A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${ix1} ${iy1}
        A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${ix2} ${iy2}
        Z
      `;

      return {
        cat,
        val,
        pct: (val / validTotal) * 100,
        color: categoryPalette[cIdx % categoryPalette.length],
        pathData
      };
    });

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '30px', padding: '10px 0' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: '360px', height: '340px', flexShrink: 0 }}>
          <svg viewBox="0 0 360 340" style={{ width: '100%', height: '100%' }}>
            {slices.map((slice, sIdx) => {
              if (slice.val <= 0) return null;
              return (
                <path
                  key={sIdx}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                  onMouseMove={(e) =>
                    handleMouseMove(e, {
                      title: slice.cat.category_name || slice.cat.name,
                      subtitle: 'Donut Segment Share',
                      value: `${formatValue(slice.val)} (${slice.pct.toFixed(1)}%)`,
                      color: slice.color
                    })
                  }
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}
          </svg>

          {/* Center Label inside donut hole */}
          <div
            style={{
              position: 'absolute',
              top: `${cy - 40}px`,
              left: `${cx - 65}px`,
              width: '130px',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#6a7392', textTransform: 'uppercase' }}>
              Cycle Total
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#141a33', marginTop: '2px' }}>
              {formatValue(cycleTotal)}
            </div>
          </div>
        </div>

        {/* Side List */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#6a7392', textTransform: 'uppercase', marginBottom: '4px' }}>
            Category Distribution Breakdown
          </div>
          {slices.map((slice, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f4fb'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    backgroundColor: slice.color,
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#141a33' }}>
                  {slice.cat.category_name || slice.cat.name}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#141a33', fontVariantNumeric: 'tabular-nums' }}>
                  {formatValue(slice.val)}
                </span>
                <span style={{ fontSize: '11.5px', color: '#6a7392', marginLeft: '6px', fontWeight: '600' }}>
                  ({slice.pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 6. Radar Profile Model
  const renderRadarProfile = () => {
    const width = 800;
    const height = 340;
    const cx = 400;
    const cy = 170;
    const radius = 120;
    const catCount = categories.length || 1;

    // Find category max
    const catMaxMap = {};
    categories.forEach((cat) => {
      const cId = cat.category_id || cat.id;
      let mVal = 0;
      months.forEach((m) => {
        const val = matrixValues[m.id]?.[cId] || 0;
        if (val > mVal) mVal = val;
      });
      catMaxMap[cId] = mVal > 0 ? mVal : 100000;
    });

    const angleStep = (2 * Math.PI) / catCount;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Radar Rings (25%, 50%, 75%, 100%) */}
        {[0.25, 0.5, 0.75, 1].map((rRatio) => {
          const ringR = radius * rRatio;
          const ringPoints = categories
            .map((_, i) => {
              const a = i * angleStep - Math.PI / 2;
              return `${cx + ringR * Math.cos(a)},${cy + ringR * Math.sin(a)}`;
            })
            .join(' ');

          return (
            <polygon
              key={rRatio}
              points={ringPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Radiating Spokes and Labels */}
        {categories.map((cat, i) => {
          const a = i * angleStep - Math.PI / 2;
          const spokeX = cx + radius * Math.cos(a);
          const spokeY = cy + radius * Math.sin(a);
          const labelX = cx + (radius + 24) * Math.cos(a);
          const labelY = cy + (radius + 18) * Math.sin(a);
          const rawName = cat.category_name || cat.name || '';
          const radarLines = wrapCategoryText(rawName, 13, 2);
          const align = Math.abs(Math.cos(a)) < 0.25 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';

          return (
            <g key={cat.category_id || i}>
              <line x1={cx} y1={cy} x2={spokeX} y2={spokeY} stroke="#e2e8f0" strokeWidth="1" />
              <text
                x={labelX}
                y={labelY - (radarLines.length > 1 ? 5 : 0)}
                textAnchor={align}
                fontSize="10"
                fontWeight="700"
                fill="#141a33"
              >
                {radarLines.map((line, lIdx) => (
                  <tspan
                    key={lIdx}
                    x={labelX}
                    dy={lIdx === 0 ? 0 : 12}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Polygons for each Month */}
        {months.map((m, mIdx) => {
          const mColor = monthPalette[mIdx % monthPalette.length];
          const polyPoints = categories
            .map((cat, i) => {
              const cId = cat.category_id || cat.id;
              const val = matrixValues[m.id]?.[cId] || 0;
              const maxVal = catMaxMap[cId];
              const rNorm = Math.min(radius, (val / maxVal) * radius);
              const a = i * angleStep - Math.PI / 2;
              return `${cx + rNorm * Math.cos(a)},${cy + rNorm * Math.sin(a)}`;
            })
            .join(' ');

          return (
            <polygon
              key={m.id || mIdx}
              points={polyPoints}
              fill={mColor}
              fillOpacity="0.22"
              stroke={mColor}
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseMove={(e) =>
                handleMouseMove(e, {
                  title: `${m.period_label || m.period_code}`,
                  subtitle: 'Radar Cycle Profile',
                  value: formatValue(monthTotals[m.id] || 0),
                  color: mColor
                })
              }
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </svg>
    );
  };

  // 7. Heatmap Grid Model
  const renderHeatmapGrid = () => {
    return (
      <div style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '6px', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#6a7392', fontWeight: '800' }}>
                Category
              </th>
              {months.map((m, mIdx) => (
                <th
                  key={m.id || mIdx}
                  style={{ textAlign: 'center', padding: '8px 12px', color: '#141a33', fontWeight: '700' }}
                >
                  {m.period_label || m.period_code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const cId = cat.category_id || cat.id;
              let rowMax = 0;
              months.forEach((m) => {
                const val = matrixValues[m.id]?.[cId] || 0;
                if (val > rowMax) rowMax = val;
              });
              if (rowMax === 0) rowMax = 1;

              return (
                <tr key={cId}>
                  <td style={{ fontWeight: '700', color: '#141a33', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {cat.category_name || cat.name}
                  </td>
                  {months.map((m) => {
                    const val = matrixValues[m.id]?.[cId] || 0;
                    const intensity = Math.min(1, val / rowMax);
                    const bgAlpha = 0.08 + intensity * 0.75;
                    const isDark = intensity > 0.55;

                    return (
                      <td
                        key={m.id}
                        style={{
                          backgroundColor: `rgba(91, 91, 240, ${bgAlpha})`,
                          borderRadius: '8px',
                          textAlign: 'center',
                          padding: '10px 14px',
                          fontWeight: '800',
                          color: isDark ? '#ffffff' : '#141a33',
                          fontVariantNumeric: 'tabular-nums',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease'
                        }}
                        onMouseMove={(e) =>
                          handleMouseMove(e, {
                            title: cat.category_name || cat.name,
                            subtitle: m.period_label || m.period_code,
                            value: formatValue(val),
                            color: '#5b5bf0'
                          })
                        }
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatValue(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // 8. Ranking Bars Model
  const renderRankingBars = () => {
    // Sort categories descending by cycle total
    const ranked = [...categories].sort((a, b) => {
      const totA = categoryTotals[a.category_id || a.id] || 0;
      const totB = categoryTotals[b.category_id || b.id] || 0;
      return totB - totA;
    });

    const maxTot = ranked.length > 0 ? categoryTotals[ranked[0].category_id || ranked[0].id] || 1 : 1;
    const grandCycle = cycleTotal > 0 ? cycleTotal : 1;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 4px' }}>
        {ranked.map((cat, idx) => {
          const cId = cat.category_id || cat.id;
          const tot = categoryTotals[cId] || 0;
          const barPct = (tot / maxTot) * 100;
          const sharePct = (tot / grandCycle) * 100;
          const barColor = categoryPalette[idx % categoryPalette.length];

          return (
            <div
              key={cId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '6px 8px',
                borderRadius: '8px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* Rank Badge */}
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: idx < 3 ? '#5b5bf0' : '#eef1fb',
                  color: idx < 3 ? '#ffffff' : '#6a7392',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '800',
                  flexShrink: 0
                }}
              >
                #{idx + 1}
              </span>

              {/* Category Name */}
              <div style={{ width: '180px', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#141a33' }}>
                  {cat.category_name || cat.name}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div style={{ flex: 1, backgroundColor: '#f1f4fb', borderRadius: '9999px', height: '14px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(2, barPct)}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>

              {/* Value and Share */}
              <div style={{ width: '160px', textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#141a33', fontVariantNumeric: 'tabular-nums' }}>
                  {formatValue(tot)}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6a7392', marginLeft: '6px' }}>
                  ({sharePct.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {chartModel === 'clustered_columns' && renderClusteredColumns()}
      {chartModel === 'stacked_columns' && renderStackedColumns()}
      {chartModel === 'trend_lines' && renderTrendLines()}
      {chartModel === 'stacked_area' && renderStackedArea()}
      {chartModel === 'donut_share' && renderDonutShare()}
      {chartModel === 'radar_profile' && renderRadarProfile()}
      {chartModel === 'heatmap_grid' && renderHeatmapGrid()}
      {chartModel === 'ranking_bars' && renderRankingBars()}

      {/* Interactive Tooltip Card - Follows mouse directly at cursor */}
      {tooltip && (() => {
        const cWidth = tooltip.containerWidth || 800;
        let transformX = '-50%';
        if (tooltip.x < 110) {
          transformX = '10px';
        } else if (tooltip.x > cWidth - 110) {
          transformX = 'calc(-100% - 10px)';
        }

        const isNearTop = tooltip.y < 70;
        const topY = isNearTop ? tooltip.y + 16 : tooltip.y - 12;
        const transformY = isNearTop ? '0%' : '-100%';

        return (
          <div
            style={{
              position: 'absolute',
              left: `${tooltip.x}px`,
              top: `${topY}px`,
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              pointerEvents: 'none',
              zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              transform: `translate(${transformX}, ${transformY})`,
              whiteSpace: 'nowrap',
              border: '1px solid #334155'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              {tooltip.color && (
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: tooltip.color }} />
              )}
              <span>{tooltip.title}</span>
            </div>
            {tooltip.subtitle && (
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                {tooltip.subtitle}
              </div>
            )}
            <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '4px', color: '#38bdf8' }}>
              {tooltip.value}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
