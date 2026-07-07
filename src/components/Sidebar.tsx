import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Store, ClipboardList, CreditCard, Tag, MessageSquare, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activePage }) => {
  const { currentRole } = useApp();

  const menuItems = [
    { id: 'admin-dashboard', label: 'Overview', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'EMPLOYEE'] },
    { id: 'admin-branches', label: 'Branches', icon: <Store size={18} />, roles: ['ADMIN'] },
    { id: 'admin-inventory', label: 'Inventory', icon: <ClipboardList size={18} />, roles: ['ADMIN', 'EMPLOYEE'] },
    { id: 'admin-orders', label: 'Orders', icon: <ClipboardList size={18} />, roles: ['ADMIN', 'EMPLOYEE'] },
    { id: 'admin-promotions', label: 'Promotions', icon: <Tag size={18} />, roles: ['ADMIN'] },
    { id: 'admin-reviews', label: 'Feedback Moderation', icon: <MessageSquare size={18} />, roles: ['ADMIN', 'EMPLOYEE'] },
  ];

  return (
    <aside className="glass-panel" style={{ width: '260px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 8rem)', position: 'sticky', top: '7rem', marginLeft: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <ShieldAlert style={{ color: 'var(--color-accent)' }} size={20} />
        <div>
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Control Panel</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged in as {currentRole}</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
        {menuItems
          .filter((item) => item.roles.includes(currentRole))
          .map((item) => (
            <button
              key={item.id}
              className="btn"
              onClick={() => onNavigate(item.id)}
              style={{
                justifyContent: 'flex-start',
                background: activePage === item.id ? 'var(--color-primary-light)' : 'transparent',
                color: activePage === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activePage === item.id ? 'bold' : 'normal',
                padding: '0.75rem 1rem',
                width: '100%',
                gap: '0.75rem',
                border: 'none',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
      </nav>
    </aside>
  );
};
