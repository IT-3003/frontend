import React, { useState } from 'react';
import { useApp, Address } from '../context/AppContext';
import { Trash2, ShoppingBag, Plus, Minus, Tag, CreditCard, Receipt, Milestone, ShieldCheck } from 'lucide-react';

interface CartCheckoutProps {
  onNavigate: (page: string) => void;
}

export const CartCheckout: React.FC<CartCheckoutProps> = ({ onNavigate }) => {
  const {
    cart,
    removeFromCart,
    updateCartQty,
    clearCart,
    selectedBranch,
    currentUser,
    applyCoupon,
    activeCoupon,
    placeOrder,
    createPayment,
    updatePaymentStatus,
    showNotification
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH_ON_DELIVERY' | 'MOBILE_WALLET'>('CREDIT_CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [createdPayment, setCreatedPayment] = useState<any | null>(null);

  // Address Selection
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    currentUser && currentUser.addresses.length > 0 ? currentUser.addresses.find(a => a.isDefault)?.id || currentUser.addresses[0].id : ''
  );
  const [isDelivery, setIsDelivery] = useState(false);

  // New Address form fields
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!street || !city || !zipCode) {
      showNotification('Please fill in all address fields', 'error');
      return;
    }
    const newAddr: Address = {
      id: 'addr_' + Math.random().toString(36).substr(2, 9),
      street,
      city,
      zipCode,
      isDefault: currentUser.addresses.length === 0
    };
    currentUser.addresses.push(newAddr);
    setSelectedAddressId(newAddr.id);
    setShowAddAddress(false);
    setStreet('');
    setCity('');
    setZipCode('');
    showNotification('Address added successfully', 'success');
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    applyCoupon(couponCode);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = activeCoupon ? (subtotal * activeCoupon.discountPercent) / 100 : 0;
  const deliveryFee = isDelivery ? 3.99 : 0;
  const total = Number((subtotal - discount + deliveryFee).toFixed(2));

  const handleCheckout = async () => {
    if (!currentUser) {
      showNotification('Please login to place an order', 'error');
      return;
    }
    if (!selectedBranch) {
      showNotification('Please select a branch location', 'error');
      return;
    }
    if (cart.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }

    const deliveryAddress = isDelivery 
      ? currentUser.addresses.find(a => a.id === selectedAddressId) || null 
      : null;

    if (isDelivery && !deliveryAddress) {
      showNotification('Please select or add a delivery address', 'error');
      return;
    }

    setIsProcessing(true);
    showNotification('Processing checkout and reserving inventory...', 'info');

    try {
      // 1. Create order
      const order = placeOrder(deliveryAddress);
      
      // 2. Create payment record
      const payment = createPayment(order.orderId, total, paymentMethod);
      
      setCreatedOrder(order);
      setCreatedPayment(payment);

      // Simulate payment gateway delay
      setTimeout(() => {
        const paymentSuccess = paymentMethod !== 'DEBIT_CARD' || Math.random() > 0.15; // 85% success rate for simulation
        
        if (paymentSuccess) {
          updatePaymentStatus(payment.transactionId, 'COMPLETED');
          showNotification('Payment verified! Order placed successfully.', 'success');
        } else {
          updatePaymentStatus(payment.transactionId, 'FAILED');
          showNotification('Payment transaction failed. Please review your credentials.', 'error');
        }
        setIsProcessing(false);
      }, 2000);

    } catch (err: any) {
      showNotification(err.message || 'Error processing checkout', 'error');
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    clearCart();
    onNavigate('profile'); // Send customer to profile to view orders history
  };

  if (createdOrder && createdPayment) {
    return (
      <div className="glass-panel" style={{ maxWidth: '650px', margin: '2rem auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Receipt Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--border-color)', paddingBottom: '1.5rem' }}>
          <span style={{ fontSize: '3rem' }}>🧾</span>
          <h2 style={{ color: 'var(--color-accent)' }}>Transaction Receipt</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transaction ID: {createdPayment.transactionId}</span>
          <br />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date: {new Date(createdPayment.createdAt).toLocaleString()}</span>
        </div>

        {/* Receipt Status */}
        <div className="glass-panel" style={{ 
          padding: '1rem', 
          textAlign: 'center', 
          backgroundColor: createdPayment.status === 'COMPLETED' ? 'rgba(46, 196, 182, 0.1)' : 'rgba(230, 57, 70, 0.1)',
          borderColor: createdPayment.status === 'COMPLETED' ? 'var(--success)' : 'var(--error)'
        }}>
          <h3 style={{ margin: 0, color: createdPayment.status === 'COMPLETED' ? 'var(--success)' : 'var(--error)' }}>
            {createdPayment.status === 'COMPLETED' ? 'PAYMENT COMPLETED' : 'PAYMENT FAILED / PENDING'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {createdPayment.status === 'COMPLETED' 
              ? 'Your items have been reserved and our staff is preparing your order.'
              : 'Transaction was declined by card issuer. Inventory reservation was rolled back.'}
          </p>
        </div>

        {/* Order Details */}
        <div>
          <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Order Details ({createdOrder.orderId})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {createdOrder.items.map((item: any) => (
              <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>${createdOrder.subtotal.toFixed(2)}</span>
          </div>
          {createdOrder.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
              <span>Discount</span>
              <span>-${createdOrder.discount.toFixed(2)}</span>
            </div>
          )}
          {createdOrder.deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Delivery Fee</span>
              <span>+${createdOrder.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-accent)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span>Total Charge</span>
            <span>${createdOrder.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Branch / Fulfillment Method */}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div><strong>Fulfillment Branch:</strong> {createdOrder.branchName}</div>
          <div><strong>Type:</strong> {createdOrder.deliveryAddress ? `Home Delivery to ${createdOrder.deliveryAddress.street}, ${createdOrder.deliveryAddress.city}` : 'In-Store Pickup'}</div>
          <div><strong>Payment Method:</strong> {createdPayment.paymentMethod.replace('_', ' ')}</div>
        </div>

        {/* Action Button */}
        <button className="btn btn-primary" onClick={handleFinish} style={{ width: '100%', padding: '0.8rem' }}>
          Continue Shopping
        </button>

      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2>Shopping Cart & Checkout</h2>

      {cart.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          
          {/* Cart Items List */}
          <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.map((item) => (
              <div key={item.product.itemId} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }} />
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{item.product.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category: {item.product.category}</span>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-accent)', marginTop: '0.25rem' }}>
                    ${item.product.price.toFixed(2)} each
                  </div>
                </div>

                {/* Quantity Editor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                  <button className="btn btn-secondary btn-icon" onClick={() => updateCartQty(item.product.itemId, item.quantity - 1)} style={{ padding: '0.2rem', border: 'none' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', width: '25px', textAlign: 'center' }}>{item.quantity}</span>
                  <button className="btn btn-secondary btn-icon" onClick={() => updateCartQty(item.product.itemId, item.quantity + 1)} style={{ padding: '0.2rem', border: 'none' }}>
                    <Plus size={14} />
                  </button>
                </div>

                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <button className="btn btn-danger btn-icon" onClick={() => removeFromCart(item.product.itemId)} style={{ borderRadius: '6px', padding: '0.4rem' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button className="btn btn-secondary" onClick={() => onNavigate('catalog')} style={{ alignSelf: 'flex-start' }}>
              <Plus size={16} /> Add More Items
            </button>
          </div>

          {/* Checkout & Summary Panel */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Fulfillment Settings */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3>Fulfillment Option</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn" 
                  onClick={() => setIsDelivery(false)}
                  style={{ flex: 1, background: !isDelivery ? 'var(--color-primary-light)' : 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  In-Store Pickup
                </button>
                <button 
                  className="btn" 
                  onClick={() => setIsDelivery(true)}
                  style={{ flex: 1, background: isDelivery ? 'var(--color-primary-light)' : 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Home Delivery
                </button>
              </div>

              {isDelivery && currentUser && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label className="form-label">Select Delivery Address *</label>
                  {currentUser.addresses.length > 0 ? (
                    <select 
                      className="form-input" 
                      value={selectedAddressId}
                      onChange={e => setSelectedAddressId(e.target.value)}
                    >
                      {currentUser.addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.street}, {addr.city} ({addr.zipCode})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No saved delivery addresses.</div>
                  )}

                  {!showAddAddress ? (
                    <button className="btn btn-secondary" onClick={() => setShowAddAddress(true)} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                      + Add New Address
                    </button>
                  ) : (
                    <form onSubmit={handleAddAddress} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
                      <input type="text" placeholder="Street Address *" className="form-input" required value={street} onChange={e => setStreet(e.target.value)} />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" placeholder="City *" className="form-input" required value={city} onChange={e => setCity(e.target.value)} />
                        <input type="text" placeholder="Zip Code *" className="form-input" required value={zipCode} onChange={e => setZipCode(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>Save</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowAddAddress(false)} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* 2. Promo Code / Coupons */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Promotional Coupon</h4>
              <form onSubmit={handleCouponSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="e.g. SAVE10" 
                  className="form-input" 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  disabled={!!activeCoupon}
                />
                <button type="submit" className="btn btn-secondary" disabled={!!activeCoupon}>
                  <Tag size={16} /> Apply
                </button>
              </form>
              {activeCoupon && (
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(46,196,182,0.1)', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--success)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold' }}>
                    Coupon ({activeCoupon.code}) Applied: {activeCoupon.discountPercent}% Off!
                  </span>
                </div>
              )}
            </div>

            {/* 3. Payment Method Selection */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3>Payment Method</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="btn" style={{ justifyContent: 'flex-start', background: paymentMethod === 'CREDIT_CARD' ? 'var(--color-primary-light)' : 'var(--bg-input)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input type="radio" name="paymethod" checked={paymentMethod === 'CREDIT_CARD'} onChange={() => setPaymentMethod('CREDIT_CARD')} style={{ marginRight: '0.75rem' }} />
                  <CreditCard size={18} style={{ marginRight: '0.5rem' }} /> Credit Card (Simulate Gateway)
                </label>
                <label className="btn" style={{ justifyContent: 'flex-start', background: paymentMethod === 'DEBIT_CARD' ? 'var(--color-primary-light)' : 'var(--bg-input)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input type="radio" name="paymethod" checked={paymentMethod === 'DEBIT_CARD'} onChange={() => setPaymentMethod('DEBIT_CARD')} style={{ marginRight: '0.75rem' }} />
                  <CreditCard size={18} style={{ marginRight: '0.5rem' }} /> Debit Card (Simulate Failure)
                </label>
                <label className="btn" style={{ justifyContent: 'flex-start', background: paymentMethod === 'CASH_ON_DELIVERY' ? 'var(--color-primary-light)' : 'var(--bg-input)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input type="radio" name="paymethod" checked={paymentMethod === 'CASH_ON_DELIVERY'} onChange={() => setPaymentMethod('CASH_ON_DELIVERY')} style={{ marginRight: '0.75rem' }} />
                  <Milestone size={18} style={{ marginRight: '0.5rem' }} /> Cash on Delivery
                </label>
              </div>
            </div>

            {/* 4. Total Summary */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3>Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal ({cart.length} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
                  <span>Coupon Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              {isDelivery && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Delivery Fee</span>
                  <span>+$3.99</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--color-accent)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span>Order Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleCheckout} 
                disabled={isProcessing}
                style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', gap: '0.5rem' }}
              >
                <ShieldCheck size={18} /> {isProcessing ? 'Processing Order...' : 'Pay & Finalize Purchase'}
              </button>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <ShoppingBag size={48} style={{ color: 'var(--color-accent)', marginBottom: '1rem' }} />
          <h3>Your shopping cart is currently empty</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Select products from the catalog to build your order.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('catalog')} style={{ marginTop: '1.5rem' }}>
            Browse Catalog
          </button>
        </div>
      )}
    </div>
  );
};
