import type { Route } from "./+types/home";
import { HomeScreen } from "~/screens/home/home";

const siteUrl = "https://francovaldes.dev";
const title = "Franco Valdes | Technical Leader, Entrepreneur, Father";
const description =
  "Ask Franco anything through an AI-powered personal CV and generative conversation interface. Director of Engineering at Safety Radar, entrepreneur, father of four, and former professional baseball player.";
const image = `${siteUrl}/social-card.png`;

export function meta(_args: Route.MetaArgs) {
  return [
    { title },
    { name: "description", content: description },
    { name: "author", content: "Franco Valdes" },
    { name: "robots", content: "index,follow" },
    { name: "theme-color", content: "#0f2a1a" },
    { tagName: "link", rel: "canonical", href: siteUrl },
    { property: "og:type", content: "website" },
    { property: "og:url", content: siteUrl },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: "Franco Valdes" },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    {
      property: "og:image:alt",
      content:
        "Franco Valdes — Technical leader, entrepreneur, father of four.",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    {
      name: "twitter:image:alt",
      content:
        "Franco Valdes — Technical leader, entrepreneur, father of four.",
    },
  ];
}

export default function Home() {
  return <HomeScreen />;
}
