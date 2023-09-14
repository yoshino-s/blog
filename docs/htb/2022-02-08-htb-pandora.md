---
title: Hack The Box - Pandora(Easy)
date: 2022-02-18
tags:
  - htb
  - pentest
category: htb
---

# Hack The Box - Pandora(Easy)

## Information

Nmap结果

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 24:c2:95:a5:c3:0b:3f:f3:17:3c:68:d7:af:2b:53:38 (RSA)
|   256 b1:41:77:99:46:9a:6c:5d:d2:98:2f:c0:32:9a:ce:03 (ECDSA)
|_  256 e7:36:43:3b:a9:47:8a:19:01:58:b2:bc:89:f6:51:08 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Play | Landing
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## Steps

### snmpwalk

```
 snmpwalk -v 2c -c public 10.10.11.136
```

拿到用户名密码，直接ssh

CVE-2021-4034直接提权，结束了