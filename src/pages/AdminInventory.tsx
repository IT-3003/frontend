import React, { useState } from 'react';
import { useApp, Product } from '../context/AppContext';
import { Plus, Edit3, Trash2, Layers } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const { products, addProduct, updateProduct, discontinueProduct, branches } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [stockQuantities, setStockQuantities] = useState<{ [branchId: string]: number }>({});

  const categories = Array.from(new Set(products.map(p => p.category)));

  const openAddModal = () => {
    setEditingProd(null);
    setName('');
    setSku('');
    setCategory(categories[0] || 'Produce');
    setDescription('');
    setPrice(0);
    setImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?w=500');
    
    const initialStocks: { [branchId: string]: number } = {};
    branches.forEach(b => { initialStocks[b.branchId] = 50; });
    setStockQuantities(initialStocks);
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProd(prod);
    setName(prod.name);
    setSku(prod.sku);
    setCategory(prod.category);
    setDescription(prod.description);
    setPrice(prod.price);
    setImageUrl(prod.imageUrl);
    setStockQuantities({ ...prod.branchStock });
    setShowModal(true);
  };

  const handleStockChange = (branchId: string, val: number) => {
    setStockQuantities(prev => ({
      ...prev,
      [branchId]: Math.max(0, val)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProd) {
      updateProduct(editingProd.itemId, {
        name,
        sku,
        category,
        description,
        price: Number(price),
        imageUrl,
        branchStock: stockQuantities
      });
    } else {
      addProduct({
        name,
        sku,
        category,
        description,
        price: Number(price),
        imageUrl,
        branchStock: stockQuantities
      });
    }
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Product Catalog & Inventory</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add products to store-wide catalog, update local stock levels and revise pricing.</span>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Grid of Catalog Items */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem' }}>Product</th>
                <th style={{ padding: '0.75rem' }}>SKU</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Price</th>
                <th style={{ padding: '0.75rem' }}>Branch Stocks</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod.itemId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: prod.isDiscontinued ? 0.5 : 1 }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={prod.imageUrl} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ fontWeight: 'bold' }}>{prod.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{prod.sku}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-info">{prod.category}</span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>${prod.price.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
                      {branches.filter(b => b.isActive).map(b => (
                        <div key={b.branchId}>
                          {b.name}: <strong>{prod.branchStock[b.branchId] || 0} units</strong>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${prod.isDiscontinued ? 'badge-danger' : 'badge-success'}`}>
                      {prod.isDiscontinued ? 'Discontinued' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-icon" onClick={() => openEditModal(prod)} title="Edit Item Details">
                        <Edit3 size={14} />
                      </button>
                      {!prod.isDiscontinued && (
                        <button className="btn btn-danger btn-icon" onClick={() => discontinueProduct(prod.itemId)} title="Discontinue Product">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>
              {editingProd ? 'Edit Product Item' : 'Add New Supermarket Item'}
            </h3>
            <form onSubmit={handleSubmit}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Product Name *</label>
                  <input type="text" required className="form-input" placeholder="e.g. Honey Crisp Apples" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">SKU Code *</label>
                  <input type="text" required className="form-input" placeholder="e.g. SKU-10293" value={sku} onChange={e => setSku(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category *</label>
                  <input type="text" required className="form-input" placeholder="e.g. Bakery" value={category} onChange={e => setCategory(e.target.value)} list="categories-list" />
                  <datalist id="categories-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit Price ($) *</label>
                  <input type="number" step="0.01" required className="form-input" placeholder="0.00" value={price} onChange={e => setPrice(Number(e.target.value))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="text" className="form-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="Item details, packaging..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
              </div>

              {/* Branch Stock Levels Edit */}
              <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <Layers size={16} /> Edit Branch Stock Counts
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {branches.filter(b => b.isActive).map(b => (
                    <div key={b.branchId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem' }}>{b.name}</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '100px', padding: '0.3rem 0.5rem' }} 
                        value={stockQuantities[b.branchId] ?? 0}
                        onChange={e => handleStockChange(b.branchId, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingProd ? 'Update Product' : 'Add Product'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
