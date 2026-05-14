import { useRootLoader } from "./use-root-loader";

export function useEnv() {
  const { env } = useRootLoader();
  if (!env) {
    throw new Error("Env not found");
  }
  return env;
}
