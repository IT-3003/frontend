import React from 'react';
import { useApp, Order } from '../context/AppContext';
import { ClipboardList, ArrowRight, XCircle, RefreshCw, DollarSign, Calendar, MapPin, PackageOpen } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const {
    orders,
    payments,
    updateOrderStatus,
    cancelOrder,
    refundPayment,
    showNotification
  } = useApp();

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

    </div>
  );
};
