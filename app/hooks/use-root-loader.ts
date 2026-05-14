import { useRouteLoaderData } from "react-router";
import type { loader } from "~/root";

export function useRootLoader() {
  const data = useRouteLoaderData<typeof loader>("root");
  if (!data) {
    throw new Error("Root loader data not found");
  }
  return data;
}
