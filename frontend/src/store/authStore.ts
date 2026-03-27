import { create } from 'zustand';
import type { AuthResponse, UserRole } from '../types';
import { userApi } from '../api/services';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: number | null;
  fullName: string | null;
  email: string | null;
  role: UserRole | null;
  department: string | null;
  profilePicture: string | null;
  hospitalId: number | null;
  hospitalName: string | null;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  login: (data: AuthResponse) => void;
  impersonate: (data: AuthResponse) => void;
  exitImpersonation: () => AuthResponse | null;
  logout: () => void;
  fetchDepartment: () => Promise<void>;
  setProfilePicture: (src: string | null) => void;
}

const getStoredPicture = () => {
  const uid = localStorage.getItem('userId');
  return uid ? localStorage.getItem(`profilePicture_${uid}`) : null;
};

const applySession = (data: AuthResponse) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', String(data.userId));
  localStorage.setItem('fullName', data.fullName);
  localStorage.setItem('email', data.email);
  localStorage.setItem('role', data.role);
  if (data.hospitalId != null) localStorage.setItem('hospitalId', String(data.hospitalId));
  else localStorage.removeItem('hospitalId');
  if (data.hospitalName) localStorage.setItem('hospitalName', data.hospitalName);
  else localStorage.removeItem('hospitalName');
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  fullName: localStorage.getItem('fullName'),
  email: localStorage.getItem('email'),
  role: localStorage.getItem('role') as UserRole | null,
  department: localStorage.getItem('department'),
  profilePicture: getStoredPicture(),
  hospitalId: localStorage.getItem('hospitalId') ? Number(localStorage.getItem('hospitalId')) : null,
  hospitalName: localStorage.getItem('hospitalName'),
  isAuthenticated: !!localStorage.getItem('token'),
  isImpersonating: !!localStorage.getItem('adminSession'),

  login: (data) => {
    applySession(data);
    set({
      token: data.token,
      refreshToken: data.refreshToken,
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      hospitalId: data.hospitalId ?? null,
      hospitalName: data.hospitalName ?? null,
      isAuthenticated: true,
      isImpersonating: false,
    });
    setTimeout(() => get().fetchDepartment(), 0);
  },

  /** Save current SUPER_ADMIN session, then switch to tenant session */
  impersonate: (data) => {
    const current = get();
    const adminSnapshot: AuthResponse = {
      token: current.token!,
      refreshToken: current.refreshToken!,
      userId: current.userId!,
      fullName: current.fullName!,
      email: current.email!,
      role: current.role!,
      hospitalId: current.hospitalId ?? null,
      hospitalName: current.hospitalName ?? null,
    };
    localStorage.setItem('adminSession', JSON.stringify(adminSnapshot));
    applySession(data);
    set({
      token: data.token,
      refreshToken: data.refreshToken,
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      hospitalId: data.hospitalId ?? null,
      hospitalName: data.hospitalName ?? null,
      isAuthenticated: true,
      isImpersonating: true,
    });
    setTimeout(() => get().fetchDepartment(), 0);
  },

  /** Restore the saved SUPER_ADMIN session and return it (caller navigates) */
  exitImpersonation: () => {
    const raw = localStorage.getItem('adminSession');
    if (!raw) return null;
    const adminData: AuthResponse = JSON.parse(raw);
    localStorage.removeItem('adminSession');
    applySession(adminData);
    set({
      token: adminData.token,
      refreshToken: adminData.refreshToken,
      userId: adminData.userId,
      fullName: adminData.fullName,
      email: adminData.email,
      role: adminData.role,
      hospitalId: adminData.hospitalId ?? null,
      hospitalName: adminData.hospitalName ?? null,
      isAuthenticated: true,
      isImpersonating: false,
    });
    return adminData;
  },

  logout: () => {
    localStorage.clear();
    set({
      token: null, refreshToken: null, userId: null,
      fullName: null, email: null, role: null, department: null,
      profilePicture: null, hospitalId: null, hospitalName: null,
      isAuthenticated: false, isImpersonating: false,
    });
  },

  setProfilePicture: (src) => {
    const uid = get().userId;
    if (!uid) return;
    if (src) localStorage.setItem(`profilePicture_${uid}`, src);
    else localStorage.removeItem(`profilePicture_${uid}`);
    set({ profilePicture: src });
  },

  fetchDepartment: async () => {
    const userId = get().userId;
    if (!userId) return;
    try {
      const res = await userApi.getById(userId);
      const dept = res.data.data.department || null;
      localStorage.setItem('department', dept || '');
      set({ department: dept });
    } catch {
      // ignore
    }
  },
}));
