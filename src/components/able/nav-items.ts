import { Bell, Bookmark, Compass, House, MessageCircle, Settings, User } from "lucide-react";

export interface ShellUser {
  name: string | null;
  image: string | null;
  role: "TALENT" | "EMPLOYER" | "ADMIN" | null;
  profileHref: string;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export const railItems = [
  { key: "feed", href: "/feed", icon: House },
  { key: "explore", href: "/explore", icon: Compass },
  { key: "messages", href: "/messages", icon: MessageCircle },
  { key: "saved", href: "/saved", icon: Bookmark },
  { key: "notifications", href: "/notifications", icon: Bell },
] as const;

export const settingsItem = { key: "settings", href: "/settings", icon: Settings } as const;

export const mobileItems = [
  { key: "feed", href: "/feed", icon: House },
  { key: "explore", href: "/explore", icon: Compass },
  { key: "messages", href: "/messages", icon: MessageCircle },
  { key: "profile", href: "/me", icon: User },
] as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
