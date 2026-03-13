---
title: "Couldn\'t Paste Text in GNOME Terminal"
author: "Ervan Kurniawan"
date: 2025-10-06 01:50 PM
---

# Couldn't Paste Text in GNOME Terminal

Device Information:
- OS: Arch Linux
- Desktop Environment: GNOME (Wayland)
- Terminal: Console (GNOME Terminal)

## Problems

Pasting text to opened file in neovim -> Errors `Couldn\'t paste text`:

```bash
g-io-error-quark (15):
No compatible transfer format found

——————————
KGX: 49.0
Adw: 1.8.0
Vte: 0.82.0
  Features: +BIDI +GNUTLS +ICU +SYSTEMD
Gtk: 4.20.1 (4.20.2)
  Display: GdkWaylandDisplay
  Surface: GdkWaylandToplevel
  Renderer: GskGLRenderer
GLib: 2.86.0
OS: Arch Linux ((null))
  XDG_CURRENT_DESKTOP: GNOME
  XDG_SESSION_DESKTOP: gnome
  XDG_SESSION_TYPE: wayland
  LANG: en_US.UTF-8
```

## Solution

Install `wl-clipboard` package.

```bash
# Arch Linux
sudo pacman -S wl-clipboard

# Debian/Ubuntu
sudo apt install wl-clipboard
```
