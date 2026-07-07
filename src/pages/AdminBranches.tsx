import React, { useState } from 'react';
import { useApp, Branch } from '../context/AppContext';
import { Store, Plus, Edit3, Trash2, Clock, MapPin, UserCheck } from 'lucide-react';

export const AdminBranches: React.FC = () => {
  const { branches, addBranch, updateBranch, deleteBranch, users } = useApp();
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [managerId, setManagerId] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  const staffUsers = users.filter(u => u.role === 'EMPLOYEE' || u.role === 'ADMIN');

  const openAddModal = () => {
    setEditingBranch(null);
    setName('');
    setAddress('');
    setManagerId(staffUsers[0]?.userId || '');
    setOpeningHours('08:00 AM - 10:00 PM');
    setShowFormModal(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address);
    setManagerId(branch.managerId);
    setOpeningHours(branch.openingHours);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const managerName = staffUsers.find(u => u.userId === managerId)?.firstName || 'Staff';
    
    if (editingBranch) {
      updateBranch(editingBranch.branchId, {
        name,
        address,
        managerId,
        managerName,
        openingHours
      });
    } else {
      addBranch({
        name,
        address,
        managerId,
        managerName,
        openingHours,
        isActive: true
      });
    }
    setShowFormModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Physical Store Branches</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure brick-and-mortar retail locations, assignment of managers, and hours.</span>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add New Branch
        </button>
      </div>

      {/* Branches List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {branches.map(branch => (
          <div key={branch.branchId} className="glass-card" style={{ padding: '1.5rem', opacity: branch.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={22} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{branch.name}</h3>
              </div>
              <span className={`badge ${branch.isActive ? 'badge-success' : 'badge-danger'}`}>
                {branch.isActive ? 'Active' : 'Archived'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} />
                <span>{branch.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} />
                <span>{branch.openingHours}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={16} />
                <span>Manager: <strong>{branch.managerName}</strong></span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-icon" onClick={() => openEditModal(branch)} title="Edit Branch">
                <Edit3 size={14} />
              </button>
              {branch.isActive && (
                <button className="btn btn-danger btn-icon" onClick={() => deleteBranch(branch.branchId)} title="Archive/Delete Branch">
                  <Trash2 size={14} />
                </button>
              )}
              {!branch.isActive && (
                <button className="btn btn-secondary" onClick={() => updateBranch(branch.branchId, { isActive: true })} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                  Restore Location
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FORM MODAL */}
      {showFormModal && (
        <div className="modal-backdrop" onClick={() => setShowFormModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>
              {editingBranch ? 'Edit Store Branch' : 'Add Physical Store Location'}
            </h3>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Branch Name *</label>
                <input type="text" required className="form-input" placeholder="e.g. Springfield East" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Store Address *</label>
                <input type="text" required className="form-input" placeholder="e.g. 100 Plaza Road, Springfield" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Branch Manager *</label>
                <select className="form-input" value={managerId} onChange={e => setManagerId(e.target.value)}>
                  {staffUsers.map(staff => (
                    <option key={staff.userId} value={staff.userId}>
                      {staff.firstName} {staff.lastName} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Opening Operational Hours *</label>
                <input type="text" required className="form-input" placeholder="e.g. 08:00 AM - 10:00 PM" value={openingHours} onChange={e => setOpeningHours(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {editingBranch ? 'Update Details' : 'Add Branch Location'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
