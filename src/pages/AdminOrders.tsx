import React, { useState } from 'react';
import { useApp, Order } from '../context/AppContext';
import { ClipboardList, ArrowRight, XCircle, DollarSign, Calendar, MapPin, ShieldCheck, Edit, Save } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const {
    orders,
    payments,
    updateOrderStatus,
    updateOrder,
    cancelOrder,
    refundPayment,
    showNotification
  } = useApp();

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editTotal, setEditTotal] = useState<string>('');
  const [editSubtotal, setEditSubtotal] = useState<string>('');
  const [editStatus, setEditStatus] = useState<Order['status']>('PROCESSING');
  const [editCoupon, setEditCoupon] = useState<string>('');

  const handleStatusTransition = (order: Order) => {
    let nextStatus: Order['status'] = 'PROCESSING';
    
    if (order.status === 'PROCESSING') {
      nextStatus = order.deliveryAddress ? 'OUT_FOR_DELIVERY' : 'READY_FOR_PICKUP';
    } else if (order.status === 'READY_FOR_PICKUP' || order.status === 'OUT_FOR_DELIVERY') {
      nextStatus = 'DELIVERED';
    } else {
      return; // Already delivered or cancelled
    }

    updateOrderStatus(order.orderId, nextStatus);
  };

  const handleRefund = (orderId: string) => {
    const payment = payments.find(p => p.orderId === orderId);
    if (!payment) {
      showNotification('No payment record found for this order', 'error');
      return;
    }
    
    if (payment.status === 'REFUNDED') {
      showNotification('Payment has already been refunded', 'info');
      return;
    }

    if (window.confirm('Are you sure you want to refund this payment? This will void the payment transaction and cancel the order.')) {
      refundPayment(payment.transactionId);
    }
  };

  const startEdit = (order: Order) => {
    setEditingOrder(order);
    setEditTotal(String(order.total));
    setEditSubtotal(String(order.subtotal || order.total));
    setEditStatus(order.status);
    setEditCoupon(order.couponCode || '');
  };

  const saveEdit = async () => {
    if (!editingOrder) return;
    try {
      const parsedTotal = parseFloat(editTotal);
      const parsedSubtotal = parseFloat(editSubtotal);
      if (isNaN(parsedTotal) || isNaN(parsedSubtotal)) {
        showNotification('Please enter valid numeric amounts', 'error');
        return;
      }
      await updateOrder(editingOrder.orderId, {
        total: parsedTotal,
        subtotal: parsedSubtotal,
        status: editStatus,
        couponCode: editCoupon
      });
      setEditingOrder(null);
    } catch (err) {
      // Error handles in context
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div>
        <h2>Master Orders & Fulfillment Queue</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Track incoming orders, update shipping/pickup pipeline state, and process transaction refunds.</span>
      </div>

      {/* Orders Table Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClipboardList size={20} /> Active Pipeline
        </h3>

        {orders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem' }}>Store / Type</th>
                  <th style={{ padding: '0.75rem' }}>Items Ordered</th>
                  <th style={{ padding: '0.75rem' }}>Total Charge</th>
                  <th style={{ padding: '0.75rem' }}>Fulfillment Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Logistics Controls</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const payment = payments.find(p => p.orderId === order.orderId);
                  
                  return (
                    <tr key={order.orderId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'top' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{order.orderId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                          <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>{order.userName}</div>
                        {order.deliveryAddress && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                            <MapPin size={12} /> {order.deliveryAddress.street}, {order.deliveryAddress.city}
                          </div>
                        )}
                      </td>
                      
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>{order.branchName}</div>
                        <span className={`badge ${order.deliveryAddress ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                          {order.deliveryAddress ? 'Delivery' : 'Pickup'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.8rem' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx}>
                              • {item.name} <strong>x {item.quantity}</strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>${order.total.toFixed(2)}</div>
                        {payment && (
                          <div style={{ fontSize: '0.7rem', color: payment.status === 'COMPLETED' ? 'var(--success)' : payment.status === 'REFUNDED' ? 'var(--info)' : 'var(--error)' }}>
                            Pay: {payment.status} ({payment.paymentMethod.replace('_', ' ')})
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span className={`badge ${
                          order.status === 'DELIVERED' ? 'badge-success' : 
                          order.status === 'CANCELLED' ? 'badge-danger' : 
                          order.status === 'PROCESSING' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Edit Action */}
                          <button className="btn btn-secondary btn-icon" onClick={() => startEdit(order)} title="Edit Order Details">
                            <Edit size={14} />
                          </button>

                          {/* Fulfillment Actions */}
                          {order.status === 'PROCESSING' && (
                            <button className="btn btn-primary" onClick={() => handleStatusTransition(order)} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', gap: '0.25rem' }}>
                              Next Stage <ArrowRight size={12} />
                            </button>
                          )}
                          {(order.status === 'READY_FOR_PICKUP' || order.status === 'OUT_FOR_DELIVERY') && (
                            <button className="btn btn-primary" onClick={() => handleStatusTransition(order)} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', gap: '0.25rem' }}>
                              Mark Delivered <ShieldCheck size={12} />
                            </button>
                          )}

                          {/* Cancellation Actions */}
                          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                            <button className="btn btn-danger btn-icon" onClick={() => cancelOrder(order.orderId)} title="Cancel Order & Release Inventory">
                              <XCircle size={14} />
                            </button>
                          )}

                          {/* Refund Actions */}
                          {payment && payment.status === 'COMPLETED' && (
                            <button className="btn btn-secondary" onClick={() => handleRefund(order.orderId)} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', gap: '0.25rem', color: 'var(--info)', borderColor: 'var(--info)' }}>
                              <DollarSign size={12} /> Refund Payment
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No supermarket orders have been placed yet.
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3>Edit Order: {editingOrder.orderId}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fulfillment Status</label>
              <select 
                value={editStatus} 
                onChange={(e) => setEditStatus(e.target.value as Order['status'])}
                style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="PROCESSING" style={{ color: '#000000' }}>PROCESSING</option>
                <option value="READY_FOR_PICKUP" style={{ color: '#000000' }}>READY_FOR_PICKUP</option>
                <option value="OUT_FOR_DELIVERY" style={{ color: '#000000' }}>OUT_FOR_DELIVERY</option>
                <option value="DELIVERED" style={{ color: '#000000' }}>DELIVERED</option>
                <option value="CANCELLED" style={{ color: '#000000' }}>CANCELLED</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Amount ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={editTotal} 
                onChange={(e) => setEditTotal(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subtotal ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={editSubtotal} 
                onChange={(e) => setEditSubtotal(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Coupon Code</label>
              <input 
                type="text" 
                value={editCoupon} 
                onChange={(e) => setEditCoupon(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditingOrder(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
