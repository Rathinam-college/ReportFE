import React from 'react';
import { ShoppingCart, SlidersHorizontal } from 'lucide-react';

export default function PurchaseMasterManager() {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      border: '1px solid #E1E6F2',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        padding: '18px 24px',
        backgroundColor: '#14245C',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#F5A524',
            color: '#14245C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingCart size={19} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
              Purchase Master Parameters &amp; Metrics
            </h2>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0 0' }}>
              Configure Purchase parameter rows, sections, and formulas
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '36px 24px', textAlign: 'center' }}>
        <SlidersHorizontal size={28} color="#94a3b8" style={{ margin: '0 auto 10px auto', display: 'block' }} />
        <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#14245C', margin: '0 0 6px 0' }}>
          Purchase Master Data Ready
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
          Once your Purchase parameter structure and database table are connected, you can add, edit, and reorder Purchase parameters here.
        </p>
      </div>
    </div>
  );
}
