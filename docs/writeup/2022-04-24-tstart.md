---
title: T-Star 2022 Writeup
date: 2022-04-24
tags:
  - writeup
  - tstar
category: writeup
---


# T-Star 2022 Writeup

## 未知之境

![验证码](https://cdn.yoshino-s.online//typora_img/image-20220420211837215.png)

python后端

`/api/info`尝试注入，发现不行

`/api/liki`唯一一个post，尝试fuzz一下

xjb试了一下，xml进去会报错，查了一下是`lxml.etree.parsestring`

![xml报错](https://cdn.yoshino-s.online//typora_img/image-20220422153806186.png)

![谷歌](https://cdn.yoshino-s.online//typora_img/image-20220422153838130.png)

参考[https://j7ur8.github.io/WebBook/VUL/%E6%8A%A5%E9%94%99XXE.html](https://j7ur8.github.io/WebBook/VUL/%25E6%258A%25A5%25E9%2594%2599XXE.html)

![参考](https://cdn.yoshino-s.online//typora_img/image-20220420212137905.png)

![xxe成功](https://cdn.yoshino-s.online//typora_img/image-20220420211942320.png)

## ID背后

看到这个人：

```
nightbaron042
```

先做了t3看到了github

![github](https://cdn.yoshino-s.online//typora_img/image-20220420212619466.png)

![微博](https://cdn.yoshino-s.online//typora_img/image-20220420212555933.png)

看微博

![ip归属地](https://cdn.yoshino-s.online//typora_img/image-20220420214514527.png)

广东，盲猜一个深圳

## 视线之外

adb协议，随便看看就出了

`tcp.stream eq 1`一个ab（Android Backup）文件，导出一下

![wireshark](https://cdn.yoshino-s.online//typora_img/image-20220420213018163.png)

`tcp.stream eq 3`一段shell交互

![shell](https://cdn.yoshino-s.online//typora_img/image-20220422154225326.png)

![解包](https://cdn.yoshino-s.online//typora_img/image-20220422155528241.png)

![解压缩](https://cdn.yoshino-s.online//typora_img/image-20220422155610740.png)

cyberchef用`private_key.pem`解一下`key.en`，得到

![cyberchef](https://cdn.yoshino-s.online//typora_img/image-20220422155711253.png)

密码，解压`flag.zip`

得到一串01

```python
import numpy as np
import matplotlib.pyplot as plt

a = "1111111010010101010110111111110000010100011000111101000001101110100110100101000010111011011101010000110001000101110110111010110100100101101011101100000100100111011001010000011111111010101010101010111111100000000001111001000000000000110011010000110101010011011110001110110101101011000011110000110100101110010010111111000100001101000011010000100000100100101101001011010010101111010011110100111101001110000011110100101101001011010010001110011101101111011001110000001001010101001100011001001001001110111111111111011101101001010111001101110111001001110111000001111100011001000010100110110011111011010100111110010001100100011110011001100000000001001010101101010111001111111010110001101000101001010000011100111110010001000100101110101010011111111110111101011101000000010000000000111010111011110001010110111001110100000101110011101101110011101111111"

w = int(len(a)**0.5)

a = np.array([int(i) for i in a])

a.resize((w, w))

plt.imshow(a,'gray')
plt.show()
```

![二维码](https://cdn.yoshino-s.online//typora_img/image-20220422160526900.png)

扫码得到

```
033yia8rqea1921ca61/systemlockdown
```

补上比赛附件下载的前缀`http://175.178.148.197`下载，白盒pwn，研究一下

```cpp
for (i = 0; i <= 6; i++) {
```

发现多循环了一次，可以输入七位，且每一位和前面的必须相等，随便爆破一下

```python
import string
from pwn.toplevel import process

for i in string.digits:
    p = process("./a")
    p.sendline(i*7)
    if 'Congurations' in (ret := p.recvall().decode()):
        print(i)
        break
    p.close()
```

![爆破](https://cdn.yoshino-s.online//typora_img/image-20220422160904911.png)

发现`******5`就可以

```php
echo md5('5555555');
# 992e63080ee1e47b99f42b8d64ede953
```

## 人去楼空

二维码补一下

![二维码（修复完成](https://cdn.yoshino-s.online//typora_img/image-20220422161458086.png)

`我真是一个压缩包.zip`改一下头 `504B`

![文件头](https://cdn.yoshino-s.online//typora_img/image-20220422161601604.png)

解压出一个MP3，莫斯，

![莫斯解码](https://cdn.yoshino-s.online//typora_img/image-20220422165716510.png)

![解压结果](https://cdn.yoshino-s.online//typora_img/image-20220422161844731.png)

## 不眠之夜

测一下注入

![报错](https://cdn.yoshino-s.online//typora_img/image-20220422162130852.png)

`strconv.ParseInt`显然就是go，go基本没啥洞，逻辑或者溢出

-1试一下不行，那就找个最贵的买，1个不行，100个库存不够，二分法找一下，最后发现34

![负数不行](https://cdn.yoshino-s.online//typora_img/image-20220422162341928.png)

![库存不够](https://cdn.yoshino-s.online//typora_img/image-20220422162354461.png)

![够了](https://cdn.yoshino-s.online//typora_img/image-20220422162423538.png)

然后就随便买了

![买了好多](https://cdn.yoshino-s.online//typora_img/image-20220422162456756.png)

其他没啥用，除了葫芦娃就是葫芦娃。

![微信公众号](https://cdn.yoshino-s.online//typora_img/image-20220422162529589.png)

（才发现微博上居然有密码

![微博上的](https://cdn.yoshino-s.online//typora_img/image-20220422162600389.png)

用密码登录邮箱，大概社工一下，收集到如下信息

```
nightbaron042@sohu.com
nightbaron042@126.com
nightBaron1996
{
  "status": true,
  "data": {
    "username": "nightbaron042",
    "phone": "131****1111",
    "likes": 4016,
    "id": 1,
    "city": "成都"
  }
}

horizonliu2021@126.com

Hi bros,

冬去春来，终于迎来此刻。等待良久，时机已经成熟。等待的日子里，我看了很多书，那些书页中的章节和段落就像时钟的时针和分针一样不断前行，指引我们通向胜利。

这次行动一切顺利，我将乘胜追击，发起勒索病毒蠕虫攻击，对所有目标电脑文件进行加密，并自动扩散，只有我的KEY才能解密。

数据勒索加密行动已经于今天 1点8分 启动。须知，T-Star特工诡计多端，为防他们从中作梗，我已将KEY进行HASH处理，分别交由不同的人保管。以他们的算力，应该很难破解。米特尼克曾经写道，人的因素是安全过程中最薄弱的环节。各位务必提高警惕，严加保密、妥善储存。

这封邮件非常重要，关键时刻将发挥巨大作用，好戏在即，各位拭目以待。

Key Hashes Part 1: https://pastebin.com/QZ7QBmmd
Key Hashes Part 2:  https://pastebin.com/TUNVRVvk
Key Hashes Part 3:  https://pastebin.com/rTqtad96
```

有些加重的字体还有几封加密邮件，

直接扔进cmd5里面查（查了我20块钱，好贵。。。

```
2fae32629d4ef4fc6341f1751b405e45 Security
a498382929241d9ba043e11a272750af  is
e2a57aade7228356cccee547d2b6f91f  too
cdfaa4a64a0b1ef0fb69b98aed692fd6  often
9666ea9113697bd46fa8529a485de7c6  merely
1dcc6dfa679cb0654dea2f3bfa0da289  an
833a2eda1f339f7ba666c77cb4280150  illus
9f55995571880efd0b338989fec42d74 ion,
....
```

[https://medien.umbreitkatalog.de/pdfzentrale/978/047/123/Leseprobe\_l\_9780471237129.pdf](https://medien.umbreitkatalog.de/pdfzentrale/978/047/123/Leseprobe_l_9780471237129.pdf)

![文章](https://cdn.yoshino-s.online//typora_img/image-20220422162857821.png)

用开头20个单词查了一下，就这段，把这段全部填进去就好了。。。。

## 文档恢复

直接解包，vanish的一段flag，另外一段在图片，根据名字猜一下outguess，密码123456

还有个书签base32，解出来就ip没啥用。。。

![outguess](https://cdn.yoshino-s.online//typora_img/image-20220422164203851.png)

```
喜欢我给你的惊喜吗？
我已将线索藏到三个不同的地方，
其中一个提示为123456
来找我吧，
记住，你只能一个人来
否则，你会受到惩罚哦
175.178.148.197
/062ycz7s9458b
             772e91/webs
0615giqrzc8ab524761/guess
```

![index.php](https://cdn.yoshino-s.online//typora_img/image-20220422164438363.png)

手动fuzz到一个

![flag.php](https://cdn.yoshino-s.online//typora_img/image-20220422164424968.png)

显然就是直接ssrf去打

![Flag](https://cdn.yoshino-s.online//typora_img/image-20220422164510346.png)