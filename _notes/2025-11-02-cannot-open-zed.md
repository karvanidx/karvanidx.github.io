---
title: "cannot open zed"
categories: ["error"]
tags: ["zed", "arch", "endeavour", "linux"]
---

Barusan install `zed` dengan langsung execute `curl -f https://zed.dev/install.sh | sh
`, Arch repository, AUR, tapi nggak bisa dibuka.

Terus gue ngide jalanin via terminal Konsole dengan ngetik `zed` biar ketahuan error-nya dimana, tapi nggak ada hasil juga.

Cari solusi di Google dengan baca forum bahasan terkait juga nihil.

Akhirnya, coba tanyain Google (Mode AI) yang salah satu sarannya nambahin flag `--foreground` di command `zed`, jadinya `zed --foreground` dan keluarlah sumber masalahnya.

```
❯ zed --foreground
2025-11-02T22:34:15+07:00 INFO  [zed] ========== starting zed version 0.210.4, sha 428ef50 ==========

thread 'main' panicked at crates/gpui/src/platform/linux/wayland/client.rs:501:47:
Unable to init GPU context: Platform(Init(ERROR_INITIALIZATION_FAILED))
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

Google (Mode AI) nyaranin gue buat install beberapa package yang dibutuhin sesuai dengan GPU laptop. Karena, device yang dipake Dell Latitude E7250 (Intel), so I decide buat install:

```
sudo pacman -S vulkan-intel lib32-vulkan-intel vulkan-icd-loader lib32-vulkan-icd-loader
```

Buat AMD:
```
sudo pacman -S amdvlk lib32-amdvlk vulkan-radeon lib32-vulkan-radeon vulkan-icd-loader lib32-vulkan-icd-loader
```

Buat Nvidia:
```
sudo pacman -S nvidia-utils lib32-nvidia-utils vulkan-icd-loader lib32-vulkan-icd-loader
```
