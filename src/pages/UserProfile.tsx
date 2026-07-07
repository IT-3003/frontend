import React, { useState } from 'react';
import { useApp, Address } from '../context/AppContext';
import { User, Key, MapPin, Trash2, ShieldX, Package } from 'lucide-react';

interface UserProfileProps {
  onNavigate: (page: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const {
    currentUser,
    updateUser,
    deactivateUser,
    orders,
    cancelOrder,
    payments,
    showNotification
  } = useApp();

  // Basic Info Form
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Password Form
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Address Form
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  if (!currentUser) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '3rem auto' }}>
        <h3>Access Denied</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Please log in to view your profile settings.</p>
      </div>
    );
  }

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      showNotification('First name and last name are required', 'error');
      return;
    }
    updateUser(currentUser.userId, { firstName, lastName, phone });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !newPassword) {
      showNotification('Please fill in both fields', 'error');
      return;
    }
    showNotification('Password updated successfully (simulated hash update)', 'success');
    setPassword('');
    setNewPassword('');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
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
    const updatedAddresses = [...currentUser.addresses, newAddr];
    updateUser(currentUser.userId, { addresses: updatedAddresses });
    setStreet('');
    setCity('');
    setZipCode('');
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (id: string) => {
    const updatedAddresses = currentUser.addresses.filter(a => a.id !== id);
    updateUser(currentUser.userId, { addresses: updatedAddresses });
  };

  const handleDeactivate = () => {
    if (window.confirm('Are you sure you want to deactivate your account? This action can only be reversed by a store administrator.')) {
      deactivateUser(currentUser.userId);
      onNavigate('home');
    }
  };

  // Filter orders for current customer
  const customerOrders = orders.filter(o => o.userId === currentUser.userId);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
      
      {/* Sidebar Profile Settings */}
      <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* 1. Account Settings */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-accent)' }}>
            <User size={20} /> Personal Profile
          </h3>
          <form onSubmit={handleUpdateInfo}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input type="email" className="form-input" value={currentUser.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Profile</button>
          </form>
        </div>

        {/* 2. Change Password */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-accent)' }}>
            <Key size={20} /> Change Password
          </h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" placeholder="••••••••" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" placeholder="••••••••" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Change Password</button>
          </form>
        </div>

        {/* 3. Address Management */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-accent)' }}>
            <MapPin size={20} /> Delivery Addresses
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {currentUser.addresses.map(addr => (
              <div key={addr.id} className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{addr.street}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{addr.city}, {addr.zipCode} {addr.isDefault && <span className="badge badge-success" style={{ transform: 'scale(0.85)' }}>Default</span>}</div>
                </div>
                <button className="btn btn-danger btn-icon" onClick={() => handleDeleteAddress(addr.id)} style={{ padding: '0.3rem', borderRadius: '4px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {!showAddAddress ? (
            <button className="btn btn-secondary" onClick={() => setShowAddAddress(true)} style={{ width: '100%' }}>Add New Address</button>
          ) : (
            <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

        {/* 4. Deactivate Account */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid var(--error)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--error)' }}>
            <ShieldX size={20} /> Close Account
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Request account deactivation. All personal data will be hidden, and authentication credentials will be locked.
          </p>
          <button className="btn btn-danger" onClick={handleDeactivate} style={{ width: '100%' }}>Deactivate My Account</button>
        </div>

      </div>

      {/* Main Order History Section */}
      <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <Package size={22} /> Order History & Tracking
          </h3>

          {customerOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {customerOrders.map(order => {
                const orderPayment = payments.find(p => p.orderId === order.orderId);
                return (
                  <div key={order.orderId} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Order ID: {order.orderId}</span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Placed on: {new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${
                          order.status === 'DELIVERED' ? 'badge-success' : 
                          order.status === 'CANCELLED' ? 'badge-danger' : 
                          order.status === 'PROCESSING' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {order.status}
                        </span>
                        {orderPayment && (
                          <span className={`badge ${
                            orderPayment.status === 'COMPLETED' ? 'badge-success' : 
                            orderPayment.status === 'REFUNDED' ? 'badge-info' : 'badge-danger'
                          }`} style={{ fontSize: '0.7rem' }}>
                            Payment: {orderPayment.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {order.items.map(item => (
                        <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>{item.name} x {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fulfillment Store: {order.branchName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fulfillment Method: {order.deliveryAddress ? 'Home Delivery' : 'In-Store Pickup'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Grand Total:</span>
                        <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                          ${order.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Trigger */}
                    {order.status === 'PROCESSING' && (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => cancelOrder(order.orderId)}
                        style={{ alignSelf: 'flex-start', padding: '0.4rem 1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}
                      >
                        Cancel Order & Release Inventory
                      </button>
                    )}

                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              You haven't placed any supermarket orders yet.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
