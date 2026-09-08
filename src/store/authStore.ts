import { create } from "zustand";
import { User, UserMenuItem } from "@/types/auth";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  StoredAuthData,
  mapCurrentUserToUser,
} from "@/lib/auth/session";
import { getMe } from "@/features/auth/auth.api";
import { fetchUserMenus } from "@/features/menu/menu.api";

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (data: StoredAuthData) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserMenus: (menus: UserMenuItem[]) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = typeof window !== "undefined" ? getStoredAuth() : null;
  const token = initial?.accessToken || initial?.token || null;

  return {
    user: (initial?.user as User) || null,
    token,
    refreshToken: initial?.refreshToken || null,
    isAuthenticated: Boolean(token),
    login: (data: StoredAuthData) => {
      setStoredAuth(data);
      const activeToken = data.accessToken || data.token || null;
      set({
        user: (data.user as User) || null,
        token: activeToken,
        refreshToken: data.refreshToken || null,
        isAuthenticated: Boolean(activeToken),
      });
    },
    logout: () => {
      clearStoredAuth();
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },
    refreshUser: async () => {
      const activeToken =
        get().token ||
        (typeof window !== "undefined"
          ? getStoredAuth()?.accessToken || getStoredAuth()?.token || null
          : null);
      if (!activeToken) return;

      try {
        const me = await getMe(activeToken);
        let updatedUser = mapCurrentUserToUser(me);

        if (!updatedUser.menus || updatedUser.menus.length === 0) {
          try {
            const roleMenus = await fetchUserMenus(updatedUser, activeToken);
            if (roleMenus && roleMenus.length > 0) {
              updatedUser = { ...updatedUser, menus: roleMenus };
            }
          } catch (mErr) {
            console.warn("Could not fetch role menus fallback:", mErr);
          }
        }

        const stored = getStoredAuth();
        if (stored) {
          setStoredAuth({
            ...stored,
            user: updatedUser,
            mustChangePassword:
              typeof me.mustChangePassword === "boolean"
                ? me.mustChangePassword
                : stored.mustChangePassword,
          });
        }
        set({
          user: updatedUser,
          isAuthenticated: true,
        });
      } catch (err) {
        console.warn("Could not refresh user profile from /users/me:", err);
      }
    },
    setUserMenus: (menus: UserMenuItem[]) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const updatedUser = { ...currentUser, menus };
      const stored = getStoredAuth();
      if (stored) {
        setStoredAuth({
          ...stored,
          user: updatedUser,
        });
      }
      set({ user: updatedUser });
    },
  };
});
