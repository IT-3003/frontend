import React, { useState } from 'react';
import { useApp, Product } from '../context/AppContext';
import { Search, ChevronLeft, ChevronRight, Star, ShoppingBag, ArrowRight } from 'lucide-react';

interface CustomerHomeProps {
  onNavigate: (page: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ onNavigate, onSelectProduct }) => {
  const { promotions, products, selectedBranch, addToCart, reviews } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const activeBanners = promotions.filter(p => p.isActive && p.type === 'BANNER' && (!p.targetBranchId || p.targetBranchId === selectedBranch?.branchId));

  const handleNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Get average rating for a product
  const getProductRating = (productId: string) => {
    const prodReviews = reviews.filter(r => r.itemId === productId && !r.isFlagged);
    if (prodReviews.length === 0) return { avg: 0, count: 0 };
    const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: Number((sum / prodReviews.length).toFixed(1)), count: prodReviews.length };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* 1. HERO PROMOTION BANNER CAROUSEL */}
      {activeBanners.length > 0 ? (
        <div className="hero-carousel" style={{ position: 'relative', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="hero-slide-content" style={{ 
            width: '100%', 
            height: '100%', 
            backgroundImage: `linear-gradient(to right, rgba(11,19,14,0.9) 30%, rgba(11,19,14,0.3)), url(${activeBanners[activeBannerIndex].bannerImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            transition: 'background-image 0.5s ease-in-out'
          }}>
            <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>PROMO CODE: {activeBanners[activeBannerIndex].code}</span>
              <h1 className="hero-slide-title" style={{ color: 'var(--text-primary)', textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>
                Save {activeBanners[activeBannerIndex].discountPercent}% Today!
              </h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                {activeBanners[activeBannerIndex].description}
              </p>
              <button className="btn btn-primary" onClick={() => onNavigate('catalog')} style={{ alignSelf: 'flex-start', marginTop: '1rem', padding: '0.8rem 1.6rem', fontSize: '1rem' }}>
                Shop Fresh Deals <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {activeBanners.length > 1 && (
            <>
              <button onClick={handlePrevBanner} className="btn btn-secondary btn-icon" style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', borderRadius: '50%', background: 'rgba(20, 34, 26, 0.7)' }}>
                <ChevronLeft size={24} />
              </button>
              <button onClick={handleNextBanner} className="btn btn-secondary btn-icon" style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', borderRadius: '50%', background: 'rgba(20, 34, 26, 0.7)' }}>
                <ChevronRight size={24} />
              </button>
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem' }}>
                {activeBanners.map((_, idx) => (
                  <div key={idx} onClick={() => setActiveBannerIndex(idx)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === activeBannerIndex ? 'var(--color-accent)' : 'var(--text-muted)', cursor: 'pointer' }} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          <div>
            <h1 style={{ color: 'var(--color-accent)' }}>Welcome to FreshCart</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Choose your branch store to see local active offers and pricing.</p>
          </div>
        </div>
      )}

      {/* 2. SEARCH & QUICK FILTERS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            placeholder="Search fresh groceries, dairy, bakery items..." 
            className="form-input" 
            style={{ paddingLeft: '2.8rem', borderRadius: '9999px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                onNavigate(`catalog?search=${encodeURIComponent(searchTerm)}`);
              }
            }}
          />
          {searchTerm && (
            <button className="btn btn-primary" onClick={() => onNavigate(`catalog?search=${encodeURIComponent(searchTerm)}`)} style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', padding: '0.4rem 1.2rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
              Search
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.2rem' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('catalog')} style={{ borderRadius: '9999px' }}>All Products</button>
          {categories.slice(0, 4).map(cat => (
            <button 
              key={cat} 
              className="btn btn-secondary" 
              onClick={() => onNavigate(`catalog?category=${encodeURIComponent(cat)}`)} 
              style={{ borderRadius: '9999px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BRANCH WARNING IF NOT SET */}
      {!selectedBranch && (
        <div className="glass-panel" style={{ borderLeft: '5px solid var(--warning)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ color: 'var(--warning)', margin: 0 }}>Select Store Branch</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You are currently viewing general pricing. Select your branch location at the top to check stock levels.</span>
          </div>
        </div>
      )}

      {/* 4. FEATURED PRODUCTS SECTION */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Featured Fresh Picks</h2>
          <button className="btn" onClick={() => onNavigate('catalog')} style={{ color: 'var(--color-accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none' }}>
            View Full Catalog <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {products.filter(p => !p.isDiscontinued).slice(0, 4).map(prod => {
            const { avg, count } = getProductRating(prod.itemId);
            const stock = selectedBranch ? prod.branchStock[selectedBranch.branchId] || 0 : 0;
            return (
              <div key={prod.itemId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', position: 'relative' }}>
                
                {/* Product Image */}
                <div 
                  onClick={() => onSelectProduct(prod)}
                  style={{ height: '180px', overflow: 'hidden', background: '#000', cursor: 'pointer', position: 'relative' }}
                >
                  <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} className="product-img-hover" />
                  <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.75rem', background: 'rgba(11,19,14,0.85)', padding: '0.25rem 0.5rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    {prod.category}
                  </span>
                </div>

                {/* Card Details */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.5rem' }}>
                  <h4 onClick={() => onSelectProduct(prod)} style={{ cursor: 'pointer', margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prod.name}
                  </h4>
                  
                  {/* Reviews Summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                    {avg > 0 ? (
                      <>
                        <Star size={14} fill="var(--color-accent)" color="var(--color-accent)" />
                        <span style={{ fontWeight: 'bold' }}>{avg}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({count})</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No reviews yet</span>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>${prod.price.toFixed(2)}</span>
                      {selectedBranch && (
                        <div style={{ fontSize: '0.7rem', color: stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </div>
                      )}
                    </div>

                    <button 
                      className="btn btn-primary btn-icon" 
                      onClick={() => addToCart(prod)}
                      disabled={!!(selectedBranch && stock <= 0)}
                      style={{ 
                        borderRadius: '8px', 
                        padding: '0.5rem',
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
      </div>

    </div>
  );
};
