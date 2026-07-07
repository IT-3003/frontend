import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, ShoppingBag, DollarSign, Store } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    orders,
    branches,
    products,
    registerUser,
    updateUser,
    deactivateUser,
    showNotification
  } = useApp();

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  // Compute stats
  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === 'PROCESSING').length;

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      showNotification('A user with this email already exists', 'error');
      return;
    }

    registerUser({
      email,
      firstName,
      lastName,
      phone,
      role
    });

    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setRole('EMPLOYEE');
    setShowAddEmployee(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Supermarket Operations Overview</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chain-wide real-time logistics, analytics and employee permissions.</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-accent)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Gross Revenue</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>${totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(46, 196, 182, 0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Fulfillment Queue</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{pendingOrders} Pending</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(0, 180, 216, 0.1)', color: 'var(--info)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)' }}>
            <Store size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Branches</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{branches.filter(b => b.isActive).length} Locations</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-accent)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Catalog</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{products.filter(p => !p.isDiscontinued).length} Items</div>
          </div>
        </div>

      </div>

      {/* User Management Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        
        {/* User Accounts List */}
        <div className="glass-panel" style={{ flex: '2 1 600px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> User Accounts Directory</h3>
            <button className="btn btn-primary" onClick={() => setShowAddEmployee(true)}>
              <UserPlus size={16} /> Register Employee
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{user.firstName} {user.lastName}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${
                        user.role === 'ADMIN' ? 'badge-danger' : 
                        user.role === 'EMPLOYEE' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {user.status === 'ACTIVE' ? (
                        <button className="btn btn-secondary" onClick={() => deactivateUser(user.userId)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--error)' }}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="btn btn-secondary" onClick={() => updateUser(user.userId, { status: 'ACTIVE' })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Employee Form Drawer / Section */}
        {showAddEmployee && (
          <div className="modal-backdrop" onClick={() => setShowAddEmployee(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>Register New Staff Member</h3>
              <form onSubmit={handleAddEmployee}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" required className="form-input" placeholder="name@freshcart.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">First Name *</label>
                    <input type="text" required className="form-input" placeholder="e.g. Sarah" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Last Name *</label>
                    <input type="text" required className="form-input" placeholder="e.g. Connor" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" placeholder="+15551234" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Staff Role *</label>
                  <select className="form-input" value={role} onChange={e => setRole(e.target.value as any)}>
                    <option value="EMPLOYEE">Store Employee (Logistics/Inventory)</option>
                    <option value="ADMIN">Supermarket Chain Admin (Manager)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  Register Employee
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
