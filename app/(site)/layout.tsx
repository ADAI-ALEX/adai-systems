import { SiteFrame } from "@/components/site/frame";
import "./site.css";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteFrame>{children}</SiteFrame>;
}
