---
title: "fix powershell error on first launch"
tags: ["powershell", "windows11"]
date: 2026-09-20
---

When: first time start powershell

Error Messages:
```
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

. : File C:\Users\luna11\OneDrive\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1 cannot be loaded
because running scripts is disabled on this system. For more information, see about_Execution_Policies at
https:/go.microsoft.com/fwlink/?LinkID=135170.
At line:1 char:3
+ . 'C:\Users\luna11\OneDrive\Documents\WindowsPowerShell\Microsoft.Pow ...
+   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : SecurityError: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
```

I was `Set-ExecutionPolicy RemoteSigned` but still got an error like:
```
PS C:\WINDOWS\system32> Set-ExecutionPolicy RemoteSigned
Set-ExecutionPolicy : Access to the registry key
'HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell' is denied. To change the execution
policy for the default (LocalMachine) scope, start Windows PowerShell with the "Run as administrator" option. To
change the execution policy for the current user, run "Set-ExecutionPolicy -Scope CurrentUser".
At line:1 char:1
+ Set-ExecutionPolicy RemoteSigned
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : PermissionDenied: (:) [Set-ExecutionPolicy], UnauthorizedAccessException
    + FullyQualifiedErrorId : System.UnauthorizedAccessException,Microsoft.PowerShell.Commands.SetExecutionPolicyComma
   nd
```

Then, I tried to launch PowerShell with Run As Administrator
```
Set-ExecutionPolicy RemoteSigned
```

Fixed!
