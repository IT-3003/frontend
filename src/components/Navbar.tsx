import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, User as UserIcon, Store, LogOut, ChevronDown, ShieldAlert, Sparkles, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activePage }) => {
  const {
    currentUser,
    currentRole,
    selectedBranch,
    branches,
    setSelectedBranch,
    setCurrentUser,
    setCurrentRole,
    users,
    cart,
    showNotification,
    registerUser
  } = useApp();

  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Login modal fields
  const [email, setEmail] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Dark/Light Mode state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (!email || !firstName || !lastName) {
        showNotification('Please fill in required fields', 'error');
        return;
      }
      const existing = users.find(u => u.email === email);
      if (existing) {
        showNotification('User already exists. Logging in instead.', 'info');
        setCurrentUser(existing);
        setCurrentRole(existing.role);
      } else {
        registerUser({
          email,
          firstName,
          lastName,
          phone,
          role: 'CUSTOMER' as const
        });
      }
      showNotification('Signed up successfully!', 'success');
      setIsRegister(false);
    } else {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        if (user.status === 'INACTIVE') {
          showNotification('This account is deactivated', 'error');
          return;
        }
        setCurrentUser(user);
        setCurrentRole(user.role);
        showNotification(`Welcome back, ${user.firstName}!`, 'success');
      } else {
        showNotification('User not found. Try john.doe@gmail.com', 'error');
        return;
      }
    }
    setShowLoginModal(false);
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
  };

  const handleRoleChange = (role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN') => {
    setCurrentRole(role);
    // Find matching user role or clear user
    const matchingUser = users.find(u => u.role === role);
    if (matchingUser) {
      setCurrentUser(matchingUser);
    } else {
      setCurrentUser(null);
    }
    setShowRoleSelect(false);
    showNotification(`Switched persona to ${role}`, 'info');
    if (role === 'ADMIN' || role === 'EMPLOYEE') {
      onNavigate('admin-dashboard');
    } else {
      onNavigate('home');
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '1rem', zIndex: 100 }}>
        {/* Brand Logo */}
        <div onClick={() => onNavigate(currentRole === 'CUSTOMER' ? 'home' : 'admin-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <span style={{ fontSize: '2rem' }}>🛒</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              FreshCart <Sparkles size={16} />
            </h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Supermarket Chain</span>
          </div>
        </div>

        {/* Navigation Elements */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Branch Locator Dropdown (For Customer & Staff) */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={() => setShowBranchSelect(!showBranchSelect)} style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <Store size={18} />
              <span>{selectedBranch ? selectedBranch.name : 'Select Store Location'}</span>
              <ChevronDown size={14} />
            </button>
            {showBranchSelect && (
              <div className="glass-panel" style={{ position: 'absolute', top: '110%', left: 0, width: '280px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', zIndex: 150 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', padding: '0.5rem' }}>PICK YOUR CLOSEST STORE</span>
                {branches.filter(b => b.isActive).map(b => (
                  <button 
                    key={b.branchId} 
                    className="btn" 
                    onClick={() => { setSelectedBranch(b); setShowBranchSelect(false); showNotification(`Shopping branch: ${b.name}`); }}
                    style={{ 
                      justifyContent: 'flex-start', 
                      background: selectedBranch?.branchId === b.branchId ? 'var(--color-primary-light)' : 'transparent',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      padding: '0.5rem 0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{b.name}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{b.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* API Playground Link */}
          <button 
            className="btn" 
            onClick={() => onNavigate('playground')} 
            style={{ 
              background: 'transparent', 
              color: activePage === 'playground' ? 'var(--color-accent)' : 'var(--text-primary)', 
              fontWeight: activePage === 'playground' ? 'bold' : 'normal' 
            }}
          >
            API Playground
          </button>

          {/* Customer Specific Links */}
          {currentRole === 'CUSTOMER' && (
            <>
              <button 
                className="btn" 
                onClick={() => onNavigate('catalog')} 
                style={{ 
                  background: 'transparent', 
                  color: activePage === 'catalog' ? 'var(--color-accent)' : 'var(--text-primary)', 
                  fontWeight: activePage === 'catalog' ? 'bold' : 'normal' 
                }}
              >
                Products
              </button>
            </>
          )}

          {/* Persona Switcher Switch (Highly interactive demo utility) */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn" 
              onClick={() => setShowRoleSelect(!showRoleSelect)} 
              style={{ 
                background: 'rgba(212, 175, 55, 0.1)', 
                border: '1px solid var(--color-accent)', 
                color: 'var(--color-accent)',
                fontSize: '0.8rem',
                padding: '0.4rem 0.8rem',
                gap: '0.4rem'
              }}
            >
              <ShieldAlert size={14} />
              <span>Role: {currentRole}</span>
              <ChevronDown size={12} />
            </button>
            {showRoleSelect && (
              <div className="glass-panel" style={{ position: 'absolute', top: '110%', right: 0, width: '160px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', zIndex: 150 }}>
                <button className="btn" onClick={() => handleRoleChange('CUSTOMER')} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.5rem', background: currentRole === 'CUSTOMER' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)' }}>Customer View</button>
                <button className="btn" onClick={() => handleRoleChange('EMPLOYEE')} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.5rem', background: currentRole === 'EMPLOYEE' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)' }}>Employee View</button>
                <button className="btn" onClick={() => handleRoleChange('ADMIN')} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.5rem', background: currentRole === 'ADMIN' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)' }}>Admin View</button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button className="btn btn-secondary btn-icon" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Cart Widget (For Customer) */}
          {currentRole === 'CUSTOMER' && (
            <button className="btn btn-primary" onClick={() => onNavigate('cart')} style={{ position: 'relative', gap: '0.5rem' }}>
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartItemsCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  background: 'var(--error)', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}>
                  {cartItemsCount}
                </span>
              )}
            </button>
          )}

          {/* Profile / Auth Widget */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => onNavigate(currentRole === 'CUSTOMER' ? 'profile' : 'admin-dashboard')}
                style={{ gap: '0.5rem', display: 'flex', alignItems: 'center', padding: '0.5rem 0.8rem' }}
              >
                <UserIcon size={16} />
                <span style={{ fontSize: '0.85rem' }}>{currentUser.firstName}</span>
              </button>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => { setCurrentUser(null); setCurrentRole('CUSTOMER'); onNavigate('home'); showNotification('Logged out successfully'); }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={() => { setIsRegister(false); setShowLoginModal(true); }} style={{ gap: '0.5rem' }}>
              <UserIcon size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      {/* LOGIN / SIGNUP MODAL */}
      {showLoginModal && (
        <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>
              {isRegister ? 'Create FreshCart Account' : 'Sign In to FreshCart'}
            </h3>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  placeholder="e.g. john.doe@gmail.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {isRegister && (
                <>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        placeholder="John" 
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        placeholder="Doe" 
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="+1234567890" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  placeholder="••••••••" 
                />
                {!isRegister && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Try logging in with: <strong>john.doe@gmail.com</strong>
                  </span>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {isRegister ? 'Sign Up' : 'Login'}
              </button>

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsRegister(!isRegister)} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  {isRegister ? 'Login' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
