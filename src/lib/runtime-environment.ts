export const runtimeEnvironments = ["production", "preview", "development", "legacy_unknown"] as const;

export type RuntimeEnvironment = (typeof runtimeEnvironments)[number];

type RuntimeEnvironmentSource = Partial<Pick<NodeJS.ProcessEnv, "VERCEL_ENV" | "NODE_ENV">>;

/**
 * Vercel supplies VERCEL_ENV for every deployed runtime. The NODE_ENV fallback
 * preserves a truthful production label for a non-Vercel production deployment.
 */
export function runtimeEnvironmentFrom(environment: RuntimeEnvironmentSource = process.env): Exclude<RuntimeEnvironment, "legacy_unknown"> {
  if (environment.VERCEL_ENV === "production") return "production";
  if (environment.VERCEL_ENV === "preview") return "preview";
  if (environment.VERCEL_ENV === "development") return "development";
  return environment.NODE_ENV === "production" ? "production" : "development";
}

export function isRuntimeEnvironment(value: string | null): value is RuntimeEnvironment {
  return Boolean(value && runtimeEnvironments.includes(value as RuntimeEnvironment));
}
