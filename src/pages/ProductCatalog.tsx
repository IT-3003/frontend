import React, { useState, useEffect } from 'react';
import { useApp, Product, Review } from '../context/AppContext';
import { Search, Star, ShoppingBag, ArrowLeft, Send, Check } from 'lucide-react';

interface ProductCatalogProps {
  initialSearch?: string;
  initialCategory?: string;
  selectedProduct: Product | null;
  onClearSelectedProduct: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ 
  initialSearch = '', 
  initialCategory = '',
  selectedProduct,
  onClearSelectedProduct
}) => {
  const { 
    products, 
    selectedBranch, 
    addToCart, 
    reviews, 
    addReview, 
    currentUser, 
    showNotification 
  } = useApp();

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  
  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  
  // Selected detail modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      setDetailProduct(selectedProduct);
    }
  }, [selectedProduct]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    if (p.isDiscontinued) return false;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? p.category === category : true;
    return matchesSearch && matchesCategory;
  });

  const getProductRating = (productId: string) => {
    const prodReviews = reviews.filter(r => r.itemId === productId && !r.isFlagged);
    if (prodReviews.length === 0) return { avg: 0, count: 0 };
    const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: Number((sum / prodReviews.length).toFixed(1)), count: prodReviews.length };
  };

  const handleReviewSubmit = (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    if (!currentUser) {
      showNotification('Please log in to leave a review', 'error');
      return;
    }
    if (!newComment.trim()) {
      showNotification('Review comment cannot be empty', 'error');
      return;
    }
    addReview(itemId, newRating, newComment);
    setNewComment('');
    setNewRating(5);
  };

  const activeProduct = detailProduct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Search Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Product Catalog</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name, SKU or keyword..." 
              className="form-input" 
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="form-input" 
            style={{ width: '200px' }}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredProducts.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map(prod => {
            const { avg, count } = getProductRating(prod.itemId);
            const stock = selectedBranch ? prod.branchStock[selectedBranch.branchId] || 0 : 0;
            return (
              <div key={prod.itemId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                <div 
                  onClick={() => setDetailProduct(prod)}
                  style={{ height: '180px', overflow: 'hidden', background: '#000', cursor: 'pointer' }}
                >
                  <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{prod.category}</span>
                  <h4 onClick={() => setDetailProduct(prod)} style={{ cursor: 'pointer', margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prod.name}
                  </h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                    {avg > 0 ? (
                      <>
                        <Star size={14} fill="var(--color-accent)" color="var(--color-accent)" />
                        <span style={{ fontWeight: 'bold' }}>{avg}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({count} reviews)</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No reviews yet</span>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>${prod.price.toFixed(2)}</span>
                      {selectedBranch && (
                        <div style={{ fontSize: '0.7rem', color: stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </div>
                      )}
                    </div>
                    <button 
                      className="btn btn-primary btn-icon" 
                      onClick={() => addToCart(prod)}
                      disabled={selectedBranch && stock <= 0}
                      style={{ 
                        borderRadius: '8px',
                        opacity: selectedBranch && stock <= 0 ? 0.5 : 1,
                        cursor: selectedBranch && stock <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3>No products match your search</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try clearing filters or looking up another item.</p>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL & REVIEWS */}
      {activeProduct && (
        <div className="modal-backdrop" onClick={() => { setDetailProduct(null); onClearSelectedProduct(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Back Header */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <button className="btn btn-secondary btn-icon" onClick={() => { setDetailProduct(null); onClearSelectedProduct(); }}>
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 style={{ margin: 0 }}>Product details</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {activeProduct.sku}</span>
              </div>
            </div>

            {/* Product Body */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
              <div style={{ flex: '1 1 280px', height: '240px', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
                <img src={activeProduct.imageUrl} alt={activeProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: '1 2 320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <span className="badge badge-info" style={{ alignSelf: 'flex-start' }}>{activeProduct.category}</span>
                <h2 style={{ margin: 0 }}>{activeProduct.name}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{activeProduct.description}</p>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                  ${activeProduct.price.toFixed(2)}
                </div>

                {selectedBranch && (
                  <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Availability ({selectedBranch.name}):</span>
                    <span style={{ fontWeight: 'bold', color: (activeProduct.branchStock[selectedBranch.branchId] || 0) > 0 ? 'var(--success)' : 'var(--error)' }}>
                      {(activeProduct.branchStock[selectedBranch.branchId] || 0) > 0 ? `${activeProduct.branchStock[selectedBranch.branchId]} units` : 'Out of stock'}
                    </span>
                  </div>
                )}

                <button 
                  className="btn btn-primary" 
                  onClick={() => addToCart(activeProduct)}
                  disabled={selectedBranch && (activeProduct.branchStock[selectedBranch.branchId] || 0) <= 0}
                  style={{ width: '100%', padding: '0.8rem', gap: '0.5rem' }}
                >
                  <ShoppingBag size={18} /> Add to Shopping Cart
                </button>
              </div>
            </div>

            {/* Reviews Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Customer Feedback</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getProductRating(activeProduct.itemId).avg > 0 ? (
                    <>
                      <Star size={18} fill="var(--color-accent)" color="var(--color-accent)" />
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{getProductRating(activeProduct.itemId).avg}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({getProductRating(activeProduct.itemId).count} reviews)</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reviews yet</span>
                  )}
                </div>
              </div>

              {/* Review Input */}
              {currentUser ? (
                <form onSubmit={(e) => handleReviewSubmit(e, activeProduct.itemId)} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Your Rating:</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          type="button" 
                          onClick={() => setNewRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Star size={20} fill={star <= newRating ? 'var(--color-accent)' : 'none'} color={star <= newRating ? 'var(--color-accent)' : 'var(--text-muted)'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Share your thoughts about this product..." 
                      className="form-input" 
                      style={{ paddingRight: '3.5rem' }}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-icon" style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', borderRadius: '6px', padding: '0.4rem' }}>
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Please login to share your rating and review feedback.
                </div>
              )}

              {/* Review List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {reviews.filter(r => r.itemId === activeProduct.itemId && !r.isFlagged).length > 0 ? (
                  reviews
                    .filter(r => r.itemId === activeProduct.itemId && !r.isFlagged)
                    .map(rev => (
                      <div key={rev.reviewId} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{rev.userName}</span>
                          <div style={{ display: 'flex', gap: '0.1rem' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={12} fill={s <= rev.rating ? 'var(--color-accent)' : 'none'} color={s <= rev.rating ? 'var(--color-accent)' : 'transparent'} />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rev.comment}</p>
                      </div>
                    ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Be the first to review this product!
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
