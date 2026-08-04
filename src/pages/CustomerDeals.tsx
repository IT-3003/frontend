import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ticket, Sparkles, Copy, Check, ShoppingBag, Store } from 'lucide-react';

interface CustomerDealsProps {
  onNavigate: (page: string) => void;
}

export const CustomerDeals: React.FC<CustomerDealsProps> = ({ onNavigate }) => {
  const { promotions, selectedBranch, showNotification } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'coupon' | 'banner'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter promotions based on type, branch, and active status
  const activePromos = promotions.filter(p => {
    if (!p.isActive) return false;
    
    // Filter by branch: either global (null) or matches selected branch
    if (p.targetBranchId) {
      const branchId = selectedBranch?.branchId;
      if (!branchId || (p.targetBranchId !== branchId && p.targetBranchId !== branchId.replace('br_', ''))) {
        return false;
      }
    }

    if (filterType === 'coupon') return p.type === 'COUPON';
    if (filterType === 'banner') return p.type === 'BANNER';
    return true;
  });

  const handleCopyCode = (code: string, promoId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(promoId);
    showNotification(`Promo code "${code}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ 
        padding: '2.5rem', 
        borderRadius: 'var(--border-radius-lg)', 
        background: 'linear-gradient(135deg, rgba(46, 196, 182, 0.15) 0%, rgba(20, 34, 26, 0.4) 100%)',
        border: '1px solid rgba(46, 196, 182, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles style={{ color: 'var(--color-accent)' }} size={28} />
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Deals & Special Offers</h1>
        </div>
        <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '650px' }}>
          Unlock maximum savings! Explore our seasonal discounts, exclusive promo codes, and special branch deals. Copy codes to use at checkout.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setFilterType('all')} 
          className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem' }}
        >
          All Offers ({promotions.filter(p => p.isActive).length})
        </button>
        <button 
          onClick={() => setFilterType('coupon')} 
          className={`btn ${filterType === 'coupon' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem' }}
        >
          Checkout Coupons
        </button>
        <button 
          onClick={() => setFilterType('banner')} 
          className={`btn ${filterType === 'banner' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem' }}
        >
          Featured Deals
        </button>
      </div>

      {/* Deals Grid */}
      {activePromos.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {activePromos.map((promo) => (
            <div key={promo.promoId} className="glass-panel card-hover" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem', 
              padding: '1.75rem',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Badge Overlay */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${promo.type === 'COUPON' ? 'badge-primary' : 'badge-success'}`}>
                  {promo.type === 'COUPON' ? 'COUPON CODE' : 'FEATURED DEAL'}
                </span>
                {promo.targetBranchId ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Store size={12} /> Local Branch Offer
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Universal Offer</span>
                )}
              </div>

              {/* Discount Amount */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-accent)', lineHeight: 1 }}>
                  {promo.discountPercent}%
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>OFF</span>
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{promo.code}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {promo.description}
                </p>
              </div>

              {/* Copy Code Area */}
              <div style={{ 
                display: 'flex', 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.5rem 0.75rem',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem'
              }}>
                <code style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                  {promo.code}
                </code>
                <button 
                  onClick={() => handleCopyCode(promo.code, promo.promoId)}
                  className="btn btn-secondary btn-icon"
                  style={{ padding: '0.25rem', minWidth: 'auto', minHeight: 'auto', background: 'transparent' }}
                  title="Copy code to clipboard"
                >
                  {copiedId === promo.promoId ? (
                    <Check size={16} style={{ color: 'var(--success)' }} />
                  ) : (
                    <Copy size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => onNavigate('catalog')}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              >
                <ShoppingBag size={16} />
                <span>Shop Qualified Items</span>
              </button>

              {/* Expiry */}
              {promo.expiryDate && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)', 
                  textAlign: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.5rem',
                  marginTop: '0.25rem'
                }}>
                  Expires: {new Date(promo.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <Ticket size={48} style={{ color: 'var(--text-muted)' }} />
          <div>
            <h3 style={{ margin: 0 }}>No active promotions found</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              We couldn't find any active offers for your selected branch. Try changing your branch selection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
