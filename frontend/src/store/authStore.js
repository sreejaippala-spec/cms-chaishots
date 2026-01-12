import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    email: localStorage.getItem('email'),

    login: (token, role, email) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('email', email);
        set({ token, role, email });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        set({ token: null, role: null, email: null });
    }
}));
