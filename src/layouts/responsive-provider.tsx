import { useIsMobile } from "@/shared/hooks/use-media-query";
import { DesktopShell } from "./desktop/desktop-shell";
import { MobileShell } from "./mobile/mobile-shell";

export function ResponsiveProvider() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileShell />;
  }

  return <DesktopShell />;
}
