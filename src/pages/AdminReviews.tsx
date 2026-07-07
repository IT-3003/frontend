import React from 'react';
import { useApp, Review } from '../context/AppContext';
import { MessageSquare, ShieldAlert, ShieldCheck, Trash2, Star } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const { reviews, updateReview, deleteReview, products } = useApp();

  const handleToggleFlag = (rev: Review) => {
    updateReview(rev.reviewId, { isFlagged: !rev.isFlagged });
  };

  const getProductName = (itemId: string) => {
    return products.find(p => p.itemId === itemId)?.name || 'Unknown Product';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div>
        <h2>Customer Reviews & Feedback Moderation</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Review product ratings, inspect customer comments, hide spam or abusive feedback, and delete reviews.</span>
      </div>

      {/* Moderation Directory */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={20} /> Review Directory
        </h3>

        {reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map(rev => (
              <div 
                key={rev.reviewId} 
                className="glass-card" 
                style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderLeft: rev.isFlagged ? '5px solid var(--error)' : '1px solid var(--border-color)',
                  background: rev.isFlagged ? 'rgba(230, 57, 70, 0.03)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{rev.userName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      on <strong>{getProductName(rev.itemId)}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.1rem' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} fill={s <= rev.rating ? 'var(--color-accent)' : 'none'} color={s <= rev.rating ? 'var(--color-accent)' : 'var(--text-muted)'} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>
                  "{rev.comment}"
                </p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {rev.isFlagged && (
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                        Hidden from Storefront (Flagged)
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn" 
                      onClick={() => handleToggleFlag(rev)}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.3rem 0.75rem', 
                        color: rev.isFlagged ? 'var(--success)' : 'var(--warning)',
                        borderColor: rev.isFlagged ? 'var(--success)' : 'var(--warning)',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {rev.isFlagged ? (
                        <>
                          <ShieldCheck size={14} /> Approve Review
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} /> Flag & Hide Spam
                        </>
                      )}
                    </button>
                    <button className="btn btn-danger btn-icon" onClick={() => deleteReview(rev.reviewId)} title="Permanently Delete Review" style={{ padding: '0.3rem', borderRadius: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No customer reviews have been submitted yet.
          </div>
        )}
      </div>

    </div>
  );
};
