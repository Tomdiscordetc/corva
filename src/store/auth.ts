import { SERVER_MODE } from "@/lib/api";
import { createDemoAuthStore } from "./demoAuth";
import { createServerAuthStore } from "./serverAuth";

export { SERVER_MODE } from "@/lib/api";
export { ROLE_LABELS } from "./authTypes";
export type { AuthUser, AuthState, AuthStep, AuthStatus, Role } from "./authTypes";
export { DEMO_TWO_FACTOR_CODE, DEMO_INITIAL_PASSWORD } from "./demoAuth";

/** Demo is an explicit build choice, never a fallback after an API error. */
export const useAuthStore = SERVER_MODE ? createServerAuthStore() : createDemoAuthStore();
