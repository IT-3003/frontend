import React, { useState } from 'react';
import { useApp, Promotion } from '../context/AppContext';
import { Tag, Plus, Edit3, Trash2, Calendar, Store } from 'lucide-react';

export const AdminPromotions: React.FC = () => {
  const { promotions, addPromotion, updatePromotion, deletePromotion, branches } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'COUPON' | 'BANNER'>('COUPON');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [targetBranchId, setTargetBranchId] = useState<string>('');

  const openAddModal = () => {
    setEditingPromo(null);
    setCode('');
    setDiscountPercent(10);
    setDescription('');
    setType('COUPON');
    setBannerImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200');
    setExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days expiry
    setTargetBranchId('');
    setShowModal(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setCode(promo.code);
    setDiscountPercent(promo.discountPercent);
    setDescription(promo.description);
    setType(promo.type);
    setBannerImageUrl(promo.bannerImageUrl);
    setExpiryDate(promo.expiryDate.split('T')[0]);
    setTargetBranchId(promo.targetBranchId || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const branchVal = targetBranchId === '' ? null : targetBranchId;
    const formattedExpiry = new Date(expiryDate).toISOString();

    if (editingPromo) {
      updatePromotion(editingPromo.promoId, {
        code,
        discountPercent: Number(discountPercent),
        description,
        type,
        bannerImageUrl,
        expiryDate: formattedExpiry,
        targetBranchId: branchVal
      });
    } else {
      addPromotion({
        code,
        discountPercent: Number(discountPercent),
        description,
        type,
        bannerImageUrl,
        expiryDate: formattedExpiry,
        targetBranchId: branchVal,
        isActive: true
      });
    }
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Promotions & Coupons Management</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Launch promotional banners for the homepage, or configure coupon discount codes.</span>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Launch Promotion
        </button>
      </div>

      {/* Promotions List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {promotions.map(promo => (
          <div key={promo.promoId} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Promo Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={20} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{promo.code}</h3>
              </div>
              <span className={`badge ${promo.isActive ? 'badge-success' : 'badge-danger'}`}>
                {promo.type}
              </span>
            </div>

            {/* Banner Thumbnail (If BANNER) */}
            {promo.type === 'BANNER' && promo.bannerImageUrl && (
              <div style={{ height: '100px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={promo.bannerImageUrl} alt={promo.code} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Description */}
            <div style={{ flexGrow: 1, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {promo.discountPercent}% Discount
              </div>
              <p>{promo.description}</p>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} /> Exp: {new Date(promo.expiryDate).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Store size={14} /> Branch constraint: {promo.targetBranchId ? branches.find(b => b.branchId === promo.targetBranchId)?.name : 'Chain-wide (All Stores)'}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto' }}>
              <button className="btn btn-secondary btn-icon" onClick={() => openEditModal(promo)} title="Edit Promo Details">
                <Edit3 size={14} />
              </button>
              <button className="btn btn-secondary" onClick={() => updatePromotion(promo.promoId, { isActive: !promo.isActive })} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                {promo.isActive ? 'Pause Campaign' : 'Resume Campaign'}
              </button>
              <button className="btn btn-danger btn-icon" onClick={() => deletePromotion(promo.promoId)} title="Permanently Delete">
                <Trash2 size={14} />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>
              {editingPromo ? 'Edit Promotion Campaign' : 'Launch New Promotion'}
            </h3>
            <form onSubmit={handleSubmit}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Discount Percentage (%) *</label>
                  <input type="number" min="1" max="100" required className="form-input" value={discountPercent} onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Promo / Coupon Code *</label>
                  <input type="text" required className="form-input" placeholder="e.g. SAVE20" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Promotion Type *</label>
                <select className="form-input" value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="COUPON">Checkout Coupon Code (Input at checkout)</option>
                  <option value="BANNER">Homepage Promotion Banner (Displays in Carousel)</option>
                </select>
              </div>

              {type === 'BANNER' && (
                <div className="form-group">
                  <label className="form-label">Banner Image URL *</label>
                  <input type="text" required className="form-input" placeholder="https://..." value={bannerImageUrl} onChange={e => setBannerImageUrl(e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Description / Campaign Subtitle *</label>
                <textarea required className="form-input" rows={2} placeholder="Brief promo details..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Expiration Date *</label>
                  <input type="date" required className="form-input" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Target Branch Store</label>
                  <select className="form-input" value={targetBranchId} onChange={e => setTargetBranchId(e.target.value)}>
                    <option value="">Chain-wide (All Stores)</option>
                    {branches.filter(b => b.isActive).map(b => (
                      <option key={b.branchId} value={b.branchId}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {editingPromo ? 'Update Campaign' : 'Publish Promotion'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
