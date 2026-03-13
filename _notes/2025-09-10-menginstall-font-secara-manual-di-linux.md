---
title: "Menginstall Font secara Manual di Linux"
author: ["ervan kurniawan"]
date: 2025-09-10
---

# Menginstall Font secara Manual di Linux

## Local

```bash
unzip ~/Downloads/Google-Sans-Code.zip -d ~/Downloads/Google-Sans-Code
cp ~/Downloads/Google-Sans-Code/static/*.ttf ~/.local/share/fonts/
fc-cache -rv
```

## Global (system-wide)
```bash
unzip ~/Downloads/Google-Sans-Code.zip -d ~/Downloads/Google-Sans-Code
sudo cp ~/Downloads/Google-Sans-Code/static/*.ttf ~/usr/share/fonts/
sudo fc-cache -rv
```


