"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { Drawer } from "vaul";
import "../../styles/drawer.css";

export function AppDrawer({
  children,
  label,
  onClose,
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Drawer.Root
      autoFocus
      direction="right"
      open={open}
      onOpenChange={setOpen}
      onAnimationEnd={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="overlay drawer-overlay vaul-drawer-overlay" />
        <Drawer.Content
          className="drawer vaul-drawer-content"
          onPointerDownOutside={(event) => {
            const target = event.detail.originalEvent.target;
            if (target instanceof Element && target.closest(".modal-overlay")) {
              event.preventDefault();
            }
          }}
        >
          <Drawer.Title className="drawer-dialog-title">{label}</Drawer.Title>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function AppDrawerClose({ children }: { children: ReactElement }) {
  return <Drawer.Close asChild>{children}</Drawer.Close>;
}
