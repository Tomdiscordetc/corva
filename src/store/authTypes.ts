export type Role = "inhaber" | "admin" | "teamleiter" | "mitarbeiter";

export const ROLE_LABELS: Record<Role, string> = {
  inhaber: "Inhaber", admin: "Admin", teamleiter: "Teamleiter", mitarbeiter: "Mitarbeiter",
};

export interface AuthUser {
  id?: string;
  tenantId?: string;
  name: string;
  email: string;
  role: Role;
}

export type AuthStep = "identify" | "password" | "twoFactor" | "setPassword" | "recover" | "recoverSent";
export type AuthStatus = "signed-out" | "authenticating" | "signed-in";

export interface AuthState {
  status: AuthStatus;
  step: AuthStep;
  direction: 1 | -1;
  email: string;
  rememberMe: boolean;
  resendIn: number;
  busy: boolean;
  user: AuthUser | null;
  previewRole: Role | null;
  error: string | null;
  notice: string | null;
  checked: boolean;
  checking: boolean;
  checkError: string | null;
  freshLogin: boolean;
  resetToken: string | null;
  bootstrap: () => Promise<void>;
  expireSession: () => void;
  beginReset: (token: string) => void;
  updateUser: (user: AuthUser) => void;
  submitEmail: (email: string) => Promise<void>;
  submitPassword: (password: string) => Promise<void>;
  submitTwoFactor: (code: string, trustDevice: boolean) => Promise<void>;
  submitNewPassword: (password: string, code?: string) => Promise<void>;
  requestRecovery: (email: string) => Promise<void>;
  resendCode: () => Promise<void>;
  tickResend: () => void;
  goToStep: (step: AuthStep) => void;
  back: () => void;
  setRememberMe: (remember: boolean) => void;
  clearError: () => void;
  logout: () => void | Promise<void>;
  setPreviewRole: (role: Role | null) => void;
  effectiveRole: () => Role | null;
}
