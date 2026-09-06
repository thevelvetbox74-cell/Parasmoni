/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Staff Portal Access Management (Admin Users)
 */

import React, { useState, useEffect } from 'react';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  Unlock, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Check, 
  Key, 
  Mail, 
  User, 
  RefreshCw,
  Search
} from 'lucide-react';
import { Admin } from '../types';

export function AdminUsers(): React.JSX.Element {
  const { adminProfile, user: currentUser } = useAuth();
  
  // States
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Form states for creating new admin
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'editor' as 'super_admin' | 'editor',
    password: '',
  });

  // Newly created admin credentials modal/box
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    pass: string;
    name: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load admins list
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      if (!isFirebaseConfigured || !db) {
        // Fallback mock admins
        const mockAdminsLocal = localStorage.getItem('parasmoni_mock_admins');
        if (mockAdminsLocal) {
          setAdmins(JSON.parse(mockAdminsLocal));
        } else {
          const initialMockAdmins: Admin[] = [
            {
              id: 'mock-super-admin',
              name: 'Sovereign Super Admin',
              email: 'thevelvetbox74@gmail.com',
              role: 'super_admin',
              isActive: true,
              createdAt: '2026-01-10T12:00:00Z',
              lastLogin: '2026-08-25T05:30:00Z',
            },
            {
              id: 'mock-editor-1',
              name: 'Amit Mukherjee (Studio Designer)',
              email: 'amit.designer@parasmoni.in',
              role: 'editor',
              isActive: true,
              createdAt: '2026-03-15T09:45:00Z',
              lastLogin: '2026-08-24T18:15:00Z',
            },
            {
              id: 'mock-editor-2',
              name: 'Joydeep Sen (Showroom Assistant)',
              email: 'joydeep.assistant@parasmoni.in',
              role: 'editor',
              isActive: false,
              createdAt: '2026-05-20T14:30:00Z',
              lastLogin: '2026-07-15T11:20:00Z',
            }
          ];
          localStorage.setItem('parasmoni_mock_admins', JSON.stringify(initialMockAdmins));
          setAdmins(initialMockAdmins);
        }
        setLoading(false);
        return;
      }

      // Fetch from Firestore
      const adminsCol = collection(db, 'admins');
      const snapshot = await getDocs(adminsCol);
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Admin[];

      // Sort by creation date
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAdmins(items);
    } catch (err: any) {
      console.error('Error fetching administrators list:', err);
      setErrorMsg('Failed to load system administrators: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enforce security restriction first
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-6" id="admin-users-unauthorized">
        <div className="inline-flex h-16 w-16 rounded-full bg-red-950/20 border border-red-500/10 items-center justify-center text-red-500">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-stone-200">Access Restricted</h2>
          <p className="text-stone-400 text-xs leading-relaxed font-sans">
            Staff directory audits, user creations, and administrative credential access controls are locked to high-level **Super-Administrators** only. Your account is currently authorized as an editor.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 bg-red-500/5 border border-red-500/10 rounded px-3 py-1.5 text-[10px] text-red-400 font-bold uppercase tracking-wider">
            <span>Editor Role Cleared for Catalog Management only</span>
          </span>
        </div>
      </div>
    );
  }

  // Toggle admin account state (Active/Disabled)
  const handleToggleActiveState = async (adminId: string, currentStatus: boolean, email: string) => {
    if (adminId === currentUser?.uid || adminId === 'mock-super-admin' || email === currentUser?.email) {
      setErrorMsg('Self-locking protection: You are forbidden from disabling your own security clearance session.');
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const newStatus = !currentStatus;

      if (!isFirebaseConfigured || !db) {
        // Offline toggle
        const updated = admins.map(a => {
          if (a.id === adminId) {
            return { ...a, isActive: newStatus };
          }
          return a;
        });
        localStorage.setItem('parasmoni_mock_admins', JSON.stringify(updated));
        setAdmins(updated);
        setSuccessMsg(`Administrator credentials ${newStatus ? 'activated' : 'disabled'} successfully.`);
        setLoading(false);
        return;
      }

      // Live Firestore update
      const docRef = doc(db, 'admins', adminId);
      await updateDoc(docRef, {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });

      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, isActive: newStatus } : a));
      setSuccessMsg(`Administrator access permissions ${newStatus ? 're-enabled' : 'temporarily suspended'} successfully.`);
    } catch (err: any) {
      console.error('Error toggling admin state:', err);
      setErrorMsg('Failed to alter credentials status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Completely delete an admin user profile (Revoke Access)
  const handleDeleteAdmin = async (adminId: string, email: string) => {
    if (adminId === currentUser?.uid || adminId === 'mock-super-admin' || email === currentUser?.email) {
      setErrorMsg('Self-deletion protection: You cannot delete your active supervisor profile.');
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    const confirmAction = window.confirm(`Are you absolutely sure you want to revoke all clearance and permanently delete administrative profile of "${email}"? This action cannot be undone.`);
    if (!confirmAction) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!isFirebaseConfigured || !db) {
        // Offline delete
        const updated = admins.filter(a => a.id !== adminId);
        localStorage.setItem('parasmoni_mock_admins', JSON.stringify(updated));
        setAdmins(updated);
        setSuccessMsg(`Administrator profile permanently removed.`);
        setLoading(false);
        return;
      }

      // Live Firestore delete
      const docRef = doc(db, 'admins', adminId);
      await deleteDoc(docRef);

      setAdmins(prev => prev.filter(a => a.id !== adminId));
      setSuccessMsg(`Administrator clearance permanently terminated.`);
    } catch (err: any) {
      console.error('Error deleting admin profile:', err);
      setErrorMsg('Failed to delete credentials: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add / Invite new administrator
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setErrorMsg('All credential parameters including password are required.');
      return;
    }

    if (newAdmin.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const generatedUid = 'admin-' + Math.floor(100000 + Math.random() * 900000);

      if (!isFirebaseConfigured || !auth) {
        // Mock offline simulation
        const newRecord: Admin = {
          id: generatedUid,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        const currentList = [...admins, newRecord];
        localStorage.setItem('parasmoni_mock_admins', JSON.stringify(currentList));
        setAdmins(currentList);
        
        setCreatedCredentials({
          email: newAdmin.email,
          pass: newAdmin.password,
          name: newAdmin.name,
          role: newAdmin.role === 'super_admin' ? 'Super Administrator' : 'Editor'
        });

        setSuccessMsg(`Account "${newAdmin.name}" provisioned successfully in local emulator mode!`);
        setShowAddForm(false);
        setNewAdmin({ name: '', email: '', role: 'editor', password: '' });
        setSubmitting(false);
        return;
      }

      // --- HIGH FIDELITY FIREBASE PROVISIONING ---
      // We leverage the multi-app framework pattern to initialize a secondary, independent
      // Firebase instance, ensuring we create the user account without corrupting or signing out
      // the Super Admin's active session!
      const config = auth.app.options;
      const secondaryAppName = `adminCreationApp-${Date.now()}`;
      const secondaryApp = initializeApp(config, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // Create credential
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newAdmin.email,
        newAdmin.password
      );

      const uid = userCredential.user.uid;

      // Save admin document profile
      await setDoc(doc(db, 'admins', uid), {
        name: newAdmin.name,
        email: newAdmin.email.toLowerCase(),
        role: newAdmin.role,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      // Tear down secondary app context
      await deleteApp(secondaryApp);

      // Refresh local view list
      await loadAdmins();

      setCreatedCredentials({
        email: newAdmin.email,
        pass: newAdmin.password,
        name: newAdmin.name,
        role: newAdmin.role === 'super_admin' ? 'Super Administrator' : 'Editor'
      });

      setSuccessMsg(`Administrator credentials successfully registered inside Cloud Directory!`);
      setShowAddForm(false);
      setNewAdmin({ name: '', email: '', role: 'editor', password: '' });
    } catch (err: any) {
      console.error('Error creating new administrator account:', err);
      setErrorMsg('Failed to register administrator: ' + (err.message || err.toString()));
    } finally {
      setSubmitting(false);
    }
  };

  // Generate random robust passwords for convenience
  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAdmin(prev => ({ ...prev, password: generated }));
  };

  // Copy created credentials
  const copyToClipboard = () => {
    if (!createdCredentials) return;
    const text = `PARASMONI JEWELLERS - STAFF PORTAL\n` +
                 `Name: ${createdCredentials.name}\n` +
                 `Email: ${createdCredentials.email}\n` +
                 `Temporary Password: ${createdCredentials.pass}\n` +
                 `Assigned Role: ${createdCredentials.role}\n` +
                 `Portal: ${window.location.origin}/admin`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter admins list based on search and roles
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6" id="admin-users-panel">
      
      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded flex items-start gap-3 text-xs" id="users-error-banner">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded flex items-start gap-3 text-xs" id="users-success-banner">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
          <p className="leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* Header and Add Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100 flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-amber-500" />
            <span>Staff Clearance Registry</span>
          </h2>
          <p className="text-[10px] text-stone-500 font-sans mt-0.5">Invite, monitor, and configure role levels for jewelry showroom CMS managers.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setCreatedCredentials(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase rounded cursor-pointer transition-all tracking-wider"
            id="btn-add-staff-trigger"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Workspace' : 'Invite Staff Admin'}</span>
          </button>
        </div>
      </div>

      {/* Credentials Delivery Board */}
      {createdCredentials && (
        <div className="p-5 bg-amber-500/5 border border-amber-500/25 rounded space-y-4 max-w-xl animate-fade-in" id="credentials-delivery-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500">
              <Key className="w-4 h-4 animate-bounce" />
              <span className="font-serif font-bold text-xs uppercase tracking-wider">Access Clearance Key Generated</span>
            </div>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-800 hover:bg-stone-800 rounded text-[9px] font-bold text-stone-300 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Credentials Package</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-stone-400 leading-relaxed font-sans">
            Please copy these secure credentials now. The temporary password is encrypted on submission and cannot be retrieved later.
          </p>
          <div className="bg-stone-950 border border-stone-850 p-3.5 rounded font-mono text-[11px] space-y-1.5 text-stone-300">
            <div><span className="text-stone-500">Full Name :</span> <span className="text-stone-200 font-bold">{createdCredentials.name}</span></div>
            <div><span className="text-stone-500">Username  :</span> <span className="text-stone-200 font-bold">{createdCredentials.email}</span></div>
            <div><span className="text-stone-500">Password  :</span> <span className="text-amber-400 font-bold tracking-wide">{createdCredentials.pass}</span></div>
            <div><span className="text-stone-500">Authority :</span> <span className="text-stone-200 uppercase tracking-widest">{createdCredentials.role}</span></div>
            <div><span className="text-stone-500">CMS URL   :</span> <span className="text-stone-400 underline text-[10px]">{window.location.origin}/admin</span></div>
          </div>
        </div>
      )}

      {/* WORKSPACE: Invite New Administrator Form */}
      {showAddForm && (
        <form onSubmit={handleCreateAdmin} className="bg-stone-900 border border-stone-800 rounded p-5 space-y-4 max-w-xl animate-fade-in" id="add-staff-form">
          <div className="border-b border-stone-850 pb-2">
            <h3 className="font-serif font-bold text-stone-100 text-xs flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-500" />
              <span>Invite New Showroom Controller</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="space-y-1.5 text-xs">
              <label htmlFor="staff-name" className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Administrator Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-600">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="staff-name"
                  required
                  placeholder="e.g. Priyanath Roy"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600"
                />
              </div>
            </div>

            {/* Email Username */}
            <div className="space-y-1.5 text-xs">
              <label htmlFor="staff-email" className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Official Email Username *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-600">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="staff-email"
                  required
                  placeholder="e.g. roy@parasmoni.in"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                />
              </div>
            </div>

            {/* Clearances / Role */}
            <div className="space-y-1.5 text-xs">
              <label htmlFor="staff-role" className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Security Clearance Role</label>
              <select
                id="staff-role"
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as any })}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-300 font-medium cursor-pointer"
              >
                <option value="editor">Editor (Catalogue & Prices only)</option>
                <option value="super_admin">Super Admin (All modules & Staff list)</option>
              </select>
            </div>

            {/* Temporary Passcode */}
            <div className="space-y-1.5 text-xs">
              <label htmlFor="staff-password" className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Temporary Password (min 6 chars) *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="staff-password"
                  required
                  placeholder="e.g. StaffPjSecret12"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="flex-1 px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-mono"
                />
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="px-2.5 py-2 bg-stone-950 border border-stone-800 hover:bg-stone-800 hover:border-stone-700 text-stone-300 rounded font-serif text-[10px] uppercase font-bold tracking-wide transition-colors cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="border-t border-stone-850 pt-3 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 border border-stone-800 hover:bg-stone-950 text-stone-400 hover:text-stone-200 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
              id="btn-save-staff"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authorize Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* FILTER SEARCH CRITERIA */}
      <div className="bg-stone-950 border border-stone-800/80 rounded p-4 flex flex-col md:flex-row gap-4 items-center justify-between" id="users-search-filter">
        <div className="relative w-full md:max-w-xs text-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-600">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by staff name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800/60 focus:border-amber-600 focus:outline-hidden rounded text-stone-200 placeholder-stone-600"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto text-xs">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-stone-900 border border-stone-800/60 focus:border-amber-600 focus:outline-hidden rounded text-stone-300 font-medium cursor-pointer"
          >
            <option value="all">All Clearance Levels</option>
            <option value="super_admin">Super Admins</option>
            <option value="editor">Editors Only</option>
          </select>

          <button
            onClick={loadAdmins}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded border border-stone-800 transition-colors cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LIST: STAFF DIRECTORY */}
      {loading ? (
        <div className="py-12 text-center text-stone-500 text-xs" id="users-loader">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Auditing user records...</span>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="py-12 text-center bg-stone-900/30 border border-stone-800 rounded p-6 text-stone-500 text-xs">
          <Users className="w-8 h-8 text-stone-700 mx-auto mb-2" />
          <p>No administrator accounts found matching query criteria.</p>
        </div>
      ) : (
        <div className="bg-stone-950 border border-stone-800/80 rounded overflow-x-auto" id="staff-table-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/40 text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                <th className="py-3.5 px-4">Administrator / Email</th>
                <th className="py-3.5 px-4 text-center">Clearance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Created On</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-850 text-stone-300">
              {filteredAdmins.map((admin) => {
                const isSelf = admin.id === currentUser?.uid || admin.email === currentUser?.email;
                const isSystemSeed = admin.id === 'mock-super-admin';
                
                return (
                  <tr 
                    key={admin.id} 
                    className={`hover:bg-stone-900/40 transition-colors ${
                      !admin.isActive ? 'opacity-60 bg-stone-950/10' : ''
                    }`}
                  >
                    
                    {/* Identity */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-100">{admin.name}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase bg-amber-600 text-stone-950 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <span className="block font-mono text-stone-500 text-[10px]">{admin.email}</span>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        admin.role === 'super_admin'
                          ? 'bg-amber-500/5 text-amber-400 border-amber-500/15'
                          : 'bg-stone-900 text-stone-400 border-stone-800'
                      }`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                      </span>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        admin.isActive
                          ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                          : 'bg-red-500/5 text-red-400 border-red-500/10'
                      }`}>
                        {admin.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 text-stone-400 font-mono text-[10px]">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-stone-400 font-mono text-[10px]">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Never'}
                    </td>

                    {/* Operations */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Status Lock/Unlock */}
                        <button
                          onClick={() => handleToggleActiveState(admin.id, admin.isActive, admin.email)}
                          disabled={isSelf || isSystemSeed}
                          className={`p-1.5 bg-stone-900 border rounded transition-colors cursor-pointer ${
                            isSelf || isSystemSeed
                              ? 'border-stone-850 opacity-20 cursor-not-allowed text-stone-600'
                              : admin.isActive
                                ? 'border-stone-800 hover:border-amber-600 hover:bg-amber-950/10 text-stone-400 hover:text-amber-500'
                                : 'border-stone-800 hover:border-emerald-600 hover:bg-emerald-950/10 text-stone-400 hover:text-emerald-500'
                          }`}
                          title={isSelf ? 'Self lock disabled' : admin.isActive ? 'Suspend access' : 'Activate access'}
                        >
                          {admin.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Terminate Profile */}
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          disabled={isSelf || isSystemSeed}
                          className={`p-1.5 bg-stone-900 border rounded transition-colors cursor-pointer ${
                            isSelf || isSystemSeed
                              ? 'border-stone-850 opacity-20 cursor-not-allowed text-stone-600'
                              : 'border-stone-800 hover:border-red-900 hover:bg-red-950/10 text-stone-500 hover:text-red-400'
                          }`}
                          title="Terminate clearance profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
