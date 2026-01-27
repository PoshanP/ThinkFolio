"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, FileText, Home, User, LogOut } from "lucide-react";
import Image from "next/image";
import { BRAND, ASSETS, IMAGE_DIMENSIONS, ROUTES, STYLE_CLASSES } from "@/lib/constants";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onSignOut: () => void;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  isAuthenticated,
  onSignOut,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Handle escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      // Focus trap
      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'button, a, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus first element when opened
    firstFocusableRef.current?.focus();

    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const navItems = [
    { href: ROUTES.home, label: "Dashboard", icon: Home },
    { href: ROUTES.papers, label: "My Library", icon: FileText },
    { href: ROUTES.profile, label: "Profile", icon: User },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-72 max-w-[80vw] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl z-50 transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 ${STYLE_CLASSES.borderDefault} border-b`}>
          <div className="flex items-center space-x-2">
            <Image
              src={ASSETS.logo.path}
              alt={ASSETS.logo.alt}
              width={IMAGE_DIMENSIONS.logo.mobile.width}
              height={IMAGE_DIMENSIONS.logo.mobile.height}
              className={`h-6 w-auto ${STYLE_CLASSES.logoTheme}`}
            />
            <span className={`text-lg font-bold ${STYLE_CLASSES.textPrimary}`}>
              {BRAND.name}
            </span>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          {isAuthenticated ? (
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg min-h-[48px] transition-colors ${
                        isActive
                          ? STYLE_CLASSES.activeNavItem
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              <li className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button
                  onClick={onSignOut}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg min-h-[48px] w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </li>
            </ul>
          ) : (
            <div className="space-y-3">
              <Link
                href={ROUTES.auth}
                className={`flex items-center justify-center px-4 py-3 rounded-lg ${STYLE_CLASSES.touchTargetComfortable} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium`}
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.auth}
                className={`flex items-center justify-center px-4 py-3 rounded-lg ${STYLE_CLASSES.touchTargetComfortable} ${STYLE_CLASSES.buttonPrimary}`}
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
