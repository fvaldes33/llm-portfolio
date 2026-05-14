import type { Route } from "./+types/home";
import { HomeScreen } from "~/screens/home/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Franco Valdes | Technical Leader, Entrepreneur, Father" },
    {
      name: "description",
      content:
        "A personal CV and conversation site for Franco Valdes, Director of Engineering, entrepreneur, and former professional baseball player.",
    },
  ];
}

export default function Home() {
  return <HomeScreen />;
}
