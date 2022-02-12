---
title: 日志 Log
date: 2021-07-29 12:03:54
tags:
  - log
category: tech intro
---

# 日志

## 系统日志

### Windows

Windows操作系统在其运行的生命周期中会记录其大量的日志信息，这些日志信息包括：Windows事件日志（Event Log），Windows服务器系统的IIS日志，FTP日志，Exchange Server邮件服务，MS SQL Server数据库日志等。处理应急事件时，客户提出需要为其提供溯源，这些日志信息在取证和溯源中扮演着重要的角色。

Windows事件日志文件实际上是以特定的数据结构的方式存储内容，其中包括有关系统，安全，应用程序的记录。每个记录事件的数据结构中包含了9个元素（可以理解成数据库中的字段）：日期/时间、事件类型、用户、计算机、事件ID、来源、类别、描述、数据等信息。应急响应工程师可以根据日志取证，了解计算机上上发生的具体行为。

查看系统日志方法，Windows系统中自带了一个叫做事件查看器的工具，它可以用来查看分析所有的Windows系统日志。打开事件查看器方法：开始->运行->输入eventvwr->回车的方式快速打开该工具。使用该工具可以看到系统日志被分为了两大类：Windows日志和应用程序和服务日志。早期版本中Windows日志只有，应用程序，安全，系统和Setup，新的版本中增加了设置及转发事件日志（默认禁用）。

系统内置的三个核心日志文件（System，Security和Application）默认大小均为20480KB（20MB），记录事件数据超过20MB时，默认系统将优先覆盖过期的日志记录。其它应用程序及服务日志默认最大为1024KB，超过最大限制也优先覆盖过期的日志记录。

![image.png](https://cdn.yoshino-s.online//typora_img/15298284817020.png!small)

**审核策略**

Windows Server 2008 R2 系统的审核功能在默认状态下并没有启用 ，建议开启审核策略，若日后系统出现故障、安全事故则可以查看系统的日志文件，排除故障，追查入侵者的信息等。

开始 --> 管理工具 --> 本地安全策略 --> 本地策略 --> 审核策略

**事件查看**

开始-运行，输入 `eventvwr.msc` 打开事件查看器，查看日志

可以看到，事件查看器将日志分成了2大类，windows日志、应用程序和服务日志，windows日志中又有应用程序、安全、setup、系统、forwarded event这几种事件类型。

---

#### 事件级别

在事件日志中有5个事件级别。

* 信息

    信息事件指应用程序、驱动程序或服务的成功操作的事件。

* 警告

    警告事件指不是直接的、主要的，但是会导致将来发生问题的事件。例如，当磁盘空间不足或未找到打印机时，都会记录一个“警告”事件。

* 错误

    错误事件指用户须知道的重要的问题，通常包括功能和数据的丢失。例如,如果一个服务不能作为系统引导被加载，那么它将会产生一个错误事件。

* 成功审核

    成功的审核安全访问尝试，主要是指安全性日志，这里记录着用户登录/注销、对象访问、特权使用、账户管理、策略更改、详细跟踪、目录服务访问、账户登录等事件，例如所有的成功登录系统都会被记录为“ 成功审核”事件。

* 失败审核

    失败的审核安全登录尝试，例如用户试图访问网络驱动器失败，则该尝试会被作为失败审核事件记录下来。

---

#### 事件ID

Windows事件日志中记录的信息中，关键的要素包含事件级别、记录时间、事件来源、事件ID、事件描述、涉及的用户、计算机、操作代码及任务类别等。

Windows 的日志以事件 id 来标识具体发生的动作行为，可通过下列网站查询具体 id 对应的操作
- https://docs.microsoft.com/en-us/windows/security/threat-protection/ 直接搜索 event + 相应的事件id 即可
- https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/default.aspx?i=j

|事件 ID 	| 说明 |
| -         | -     |
| 1102 |	 清理审计日志 |
| 4624 |	 账号成功登录 |
| 4625 |	 账号登录失败 |
| 4768 |	 Kerberos 身份验证（TGT 请求） |
| 4769 |	 Kerberos 服务票证请求 |
| 4776 |	 NTLM 身份验证 |
| 4672 |	 授予特殊权限 |
| 4720 |	 创建用户 |
| 4726 |	 删除用户 |
| 4728 |	 将成员添加到启用安全的全局组中 |
| 4729 |	 将成员从安全的全局组中移除 |
| 4732 |	 将成员添加到启用安全的本地组中 |
| 4733 |	 将成员从启用安全的本地组中移除 |
| 4756 |	 将成员添加到启用安全的通用组中 |
| 4757 |	 将成员从启用安全的通用组中移除 |
| 4719 |	 系统审计策略修改 |

每个成功登录的事件都会标记一个登录类型，不同登录类型代表不同的方式：

| 登录类型 | 描述                            | 说明                                             |
| :------- | ------------------------------- | ------------------------------------------------ |
| 2        | 交互式登录（Interactive）       | 用户在本地进行登录。                             |
| 3        | 网络（Network）                 | 最常见的情况就是连接到共享文件夹或共享打印机时。 |
| 4        | 批处理（Batch）                 | 批处理（为批处理程序保留）  |
| 5        | 服务（Service）                 | 服务启动（服务登录）      |
| 7        | 解锁（Unlock）                  | 屏保解锁。              |
| 8        | 网络明文（NetworkCleartext）    | 登录的密码在网络上是通过明文传输的，如FTP、IIS登录验证。  |
| 9        | 新凭证（NewCredentials）        | 使用带/Netonly参数的RUNAS命令运行一个程序。      |
| 10       | 远程交互，（RemoteInteractive） | 通过终端服务、远程桌面或远程协助访问计算机。     |
| 11       | 缓存交互（CachedInteractive）   | 缓存域证书登录           |

案例:查看系统账号登录情况
1. 开始-运行，输入 `eventvwr.msc`
2. 在事件查看器中，`Windows日志` --> `安全`，查看安全日志；
3. 在安全日志右侧操作中，点击 `筛选当前日志` ，输入事件 ID 进行筛选。
    - 4624  --登录成功
    - 4625  --登录失败
    - 4634 -- 注销成功
    - 4647 -- 用户启动的注销
    - 4672 -- 使用超级用户（如管理员）进行登录
4. 输入事件 ID：4625 进行日志筛选，发现事件 ID：4625，事件数 175904，即用户登录失败了 175904 次，那么这台服务器管理员账号可能遭遇了暴力猜解。

案例:查看计算机开关机的记录
1. 开始-运行，输入 `eventvwr.msc`
2. 在事件查看器中，`Windows日志` --> `系统`，查看系统日志；
3. 在系统日志右侧操作中，点击 `筛选当前日志` ，输入事件 ID 进行筛选。其中事件 ID 6006 ID6005、 ID 6009 就表示不同状态的机器的情况（开关机）。
    - 6005 信息 EventLog 事件日志服务已启动。(开机)
    - 6006 信息 EventLog 事件日志服务已停止。(关机)
    - 6009 信息 EventLog 按ctrl、alt、delete键(非正常)关机
4. 输入事件  ID：6005-6006进行日志筛选，发现了两条在 2018/7/6 17:53:51 左右的记录，也就是我刚才对系统进行重启的时间。

---

#### windows日志类型

系统内置的三个核心日志文件（System，Security和Application）默认大小均为 20480KB（20MB），记录事件数据超过 20MB 时，默认系统将优先覆盖过期的日志记录。其它应用程序及服务日志默认最大为 1024KB，超过最大限制也优先覆盖过期的日志记录。

* 应用程序

    包含由应用程序或系统程序记录的事件，主要记录程序运行方面的事件，例如数据库程序可以在应用程序日志中记录文件错误，程序开发人员可以自行决定监视哪些事件。如果某个应用程序出现崩溃情况，那么我们可以从程序事件日志中找到相应的记录，也许会有助于问题的解决。

    默认位置: `%SystemRoot%\System32\Winevt\Logs\Application.evtx`

* 系统

    记录操作系统组件产生的事件，主要包括驱动程序、系统组件和应用软件的崩溃以及数据丢失错误等。系统日志中记录的时间类型由Windows NT/2000操作系统预先定义。

    默认位置: `%SystemRoot%\System32\Winevt\Logs\System.evtx`

* 安全

    

* 转发事件

    日志用于存储从远程计算机收集的事件。若要从远程计算机收集事件，必须创建事件订阅。

    默认位置: `%SystemRoot%\System32\Winevt\Logs\ForwardedEvents.evtx`



#### 日志文件格式

系统事件日志主要保存的类型为：`*.evtx`，`*.xml`，`*.txt`，`*.csv`。对于后三种文件格式已经比较了解，现在分析下 evtx 后缀额格式。事件日志（evtx）文件是一种二进制格式的文件。

> Reference
> - [闲聊Windows系统日志](https://www.freebuf.com/vuls/175560.html)
> - [Window日志分析](https://www.cnblogs.com/xiaozi/p/9192736.html)

**导出日志**

- 相关文章
  - [Export corrupts Windows Event Log files](https://blog.fox-it.com/2019/06/04/export-corrupts-windows-event-log-files/) - 导出损坏的 Windows 事件日志文件

**恢复 eventlogedit 删除的记录**

- 相关文章
  - [Detection and recovery of NSA’s covered up tracks](https://blog.fox-it.com/2017/12/08/detection-and-recovery-of-nsas-covered-up-tracks/)
- 工具
  - [fox-it/danderspritz-evtx](https://github.com/fox-it/danderspritz-evtx) - 解析 evtx 文件并检测 DanderSpritz eventlogedit 模块的使用

**Windows Defender 日志**

- Windows Defender 应用程序使用 `MpCmdRun.log` 和 `MpSigStub.log` 两个日志文件，在 `C:\Windows\Temp` 文件夹下。该文件夹为默认的 SYSTEM 账户临时文件夹，但是每一个用户都拥有写权限。Administrators （管理员）和 SYSTEM 账户拥有这个文件夹的所有权限，一般用户甚至没有读的权限。

#### 日志工具

**Sysmon**

- [Sysmon](https://github.com/ffffffff0x/1earn/blob/master/1earn/Security/工具/Sysmon.md)

**logparser**

`logparser` 是一款 windows 日志分析工具，访问这里下载 https://www.microsoft.com/en-us/download/details.aspx?id=24659

- 相关文章

  - [windows安全日志分析之logparser篇](https://wooyun.js.org/drops/windows安全日志分析之logparser篇.html)

- 使用

  登录成功的所有事件

  ```
  LogParser.exe -i:EVT -o:DATAGRID "SELECT * FROM c:\Security.evtx where EventID=4624"
  ```

  指定登录时间范围的事件

  ```
  LogParser.exe -i:EVT -o:DATAGRID "SELECT * FROM c:\Security.evtx where TimeGenerated>'2018-06-19 23:32:11' and TimeGenerated<'2018-06-20 23:34:00' and EventID=4624"
  ```

  提取登录成功的用户名和 IP

  ```
  LogParser.exe -i:EVT -o:DATAGRID "SELECT EXTRACT_TOKEN(Message,13,' ') as EventType,TimeGenerated as LoginTime,EXTRACT_TOKEN(Strings,5,'|') as Username,EXTRACT_TOKEN(Message,38,' ') as Loginip FROM c:\Security.evtx where EventID=4624"
  ```

  登录失败的所有事件

  ```
  LogParser.exe -i:EVT -o:DATAGRID "SELECT * FROM c:\Security.evtx where EventID=4625"
  ```

  提取登录失败用户名进行聚合统计

  ```
  LogParser.exe -i:EVT "SELECT EXTRACT_TOKEN(Message,13,' ') as EventType,EXTRACT_TOKEN(Message,19,' ') as user,count(EXTRACT_TOKEN(Message,19,' ')) as Times,EXTRACT_TOKEN(Message,39,' ') as Loginip FROM c:\Security.evtx where EventID=4625 GROUP BY Message”
  ```

  系统历史开关机记录

  ```
  LogParser.exe -i:EVT -o:DATAGRID "SELECT TimeGenerated,EventID,Message FROM c:\System.evtx where EventID=6005 or EventID=6006"
  ```

**LogParser Lizard**

对于 GUI 环境的 Log Parser Lizard，其特点是比较易于使用，甚至不需要记忆繁琐的命令，只需要做好设置，写好基本的 SQL 语句，就可以直观的得到结果。

下载地址 : http://www.lizard-labs.com/log_parser_lizard.aspx

依赖包：Microsoft .NET Framework 4 .5，下载地址：https://www.microsoft.com/en-us/download/details.aspx?id=42642

**Event Log Explorer**

Event Log Explorer 是一款非常好用的 Windows 日志分析工具。可用于查看，监视和分析跟事件记录，包括安全，系统，应用程序和其他微软 Windows 的记录被记载的事件，其强大的过滤功能可以快速的过滤出有价值的信息。

下载地址 : https://event-log-explorer.en.softonic.com/

**Win-Logs-Parse-tool**

Python 开发的解析 windows 日志文件的工具，可采用手动添加文件的方式进行解析，解析后的文件为 XML，HTML 两种格式，HTML 已采用Bootstrap 架进行界面可视化优化，可直接查看重点日志数据，解析后的 HTML 数据文件保存在执行文件下的 logs/ 文件夹下 ( 自动创建 )，XML 数据文件保存在执行文件下的 logs/xml/ 文件夹下，

项目地址 : https://github.com/Clayeee/Win-Logs-Parse-tool

**LogonTracer**

通过可视化和分析 Windows 事件日志来调查恶意 Windows 登录的工具

项目地址 : https://github.com/JPCERTCC/LogonTracer

### Linux

#### 系统日志类型

日志默认存放位置：`/var/log/`

```bash
service auditd status       # 查看日志服务是否开启
more /etc/rsyslog.conf      # 查看日志配置情况
```

##### /var/log 下的日志分类

以下是比较常用的几个日志文件:

- `/var/log/message`    : 核心系统日志文件，包含系统启动引导，系统运行状态和大部分错误信息等都会记录到这个文件，因此这个日志是故障诊断的首要查看对象.
- `/var/log/dmesg`      : 核心启动日志，系统启动时会在屏幕显示与硬件有关的信息，这些信息会保存在这个文件里面.
- `/var/log/auth.log` 或 `/var/log/secure` : 存储来自可插拔认证模块(PAM)的日志，包括成功的登录，失败的登录尝试和认证方式。Ubuntu 和 Debian 在 `/var/log/auth.log` 中存储认证信息，而 RedHat 和 CentOS 则在 /var/log/secure 中存储该信息。
- `/var/log/spooler`    : UUCP 和 news 设备相关的日志信息
- `/var/log/cron`       : 与定时任务相关的日志信息
- `/var/log/maillog`    : 记录每一个发送至系统或者从系统发出的邮件活动
- `/var/log/boot`       : 系统引导日志
- `/var/log/wtmp` 和 `/var/run/utmp` : 由多个程序执行，记录用户登录时间
- `/var/log/kern`       : 存储内核的错误和警告数据，这对于排除与定制内核相关的故障尤为实用。
- `/var/log/btmp`       : 记录错误登录日志,这个文件是二进制文件,可以使用 lastb 命令查看
- `/var/log/cups`       : 记录打印信息的日志
- `/var/log/lastlog`    : 记录系统中所有用户最后一次登录时间的日志，这个文件是二进制文件，可以使用 lastlog 命令查看
- `/var/log/rpmpkgs`    : 记录系统中安装各 rpm 包列表信息。

---

##### 内核及系统日志

这种日志由 syslog 统一管理，根据其主配置文件 `/etc/syslog.conf` 中的设置决定将内核消息及各种系统程序消息记录到什么位置。 用户日志：这种日志数据用于记录 Linux 系统用户登录及退出系统的相关信息，包括用户名、登录的终端、登录时间、来源主机、正在使用的进程操作等。 程序日志：有些应用程序运会选择自己来独立管理一份日志文件（而不是交给 syslog 服务管理），用于记录本程序运行过程中的各种事件信息。由于这些程序只负责管理自己的日志文件，因此不同的程序所使用的日志记录格式可能会存在极大差异。

> 内核为2.6.18时候使用的是 syslog 服务
> 注: 内核为2.6.32以后 syslog 被命名为 rsyslog，所以配置文件名称也不一样

通过查看 `/etc/rsyslog.conf` ，可查看相关系统日志配置情况。

message 日志，一般内核及大多数系统消息都被记录到公共日志文件 `/var/log/messages` 中，而其他一些程序消息被记录到不同的文件中，日志消息还能够记录到特定的存储设备中，或者直接向用户发送。

secure 是应急中最常用的文件，主要记录系统存取数据的文件，如 POP3、ssh、telnet、ftp 等相关记录，从日志中可看出系统服务是否遭受到安全威胁。

##### syslogd

syslogd 是大部分 Linux 发行版默认的日志守护进程，是一个记录日志的服务，子配置文件位于 /etc/syslog 或 /etc/syslogd，默认配置文件为 /etc/syslog.conf。

从架构来看，这个服务下面有一系列的子服务，例如 mail、cron 等等，这些子服务对外提供日志记录的功能，当其它的程序或服务需要记录日志的时候，就可以直接调用这些子服务将日志记录到指定的地方。

我们编写的代码可以通过 syslog 的接口进行 log，syslog 会通过 socket 将 log 发送给 syslogd，syslogd 在获取到 log 后，会对 log 进行处理，然后根据用户配置，将 log 保存到本地或者发送到其他服务器上去。

最简单的，用 `logger -t '[test]' "test"` 就可以直接日志记录到 message 里：

用 python 记录

```py
import syslog
syslog.syslog("hello")
```

##### rsyslogd

rsyslogd 是 syslogd 的升级版，子配置文件位于 /etc/rsyslog.d，默认配置文件为 /etc/rsyslog.conf，配置语法与 syslogd 的配置文件一致

##### 日志消息的级别

根据日志信息的重要程度不同，分为不同的级别 数字级别越小，优先级越高，消息越重要 级别 英文表示 意义
* 0 EMERG（紧急） 导致主机系统不可用的情况
* 1 ALERT（警告） 必须马上采取解决措施
* 2 CRIT 严重 比较严重的情况
* 3 ERR 错误 运行出现错误
* 4 WARNING 提醒 提醒用户的重要事件
* 5 NOTICE 注意 不会儿影响系统，提醒用户
* 6 INFO 信息 一般信息
* 7 DEBUG 调式 程序调式
* 8 None 没有 不做记录

查看出现的重大的错误
```bash
grep -E -iw "emerg|alert|critical|error" /var/log/messages
```

#### 用户日志

例如 wtmp

wtmp 日志记录了用户的登录、退出、重启等情况，可以查看系统是否存在异常用户登录，判断攻击者是否已经登录服务器，由于 wtmp 日志为二进制文件，所以利用用 last 命令查看，last -t 20190426120950 ,可查看这个时间之前的日志。

lastlog 命令，用于显示系统中所有用户最近一次登录信息。lastlog 文件在每次有用户登录时被查询。可以使用 lastlog 命令检查某特定用户上次登录的时间，并格式化输出上次登录日志 `/var/log/lastlog` 的内容。它根据 UID 排序显示登录名、端口号（tty）和上次登录时间。如果一个用户从未登录过，lastlog 显示 Never logged。注意需要以 root 身份运行该命令。

#### 日志工具

- logrotate

  分割日志工具/日志转储

目前大部分 linux 系统都会默认安装有 logrotate，日志分割工具.而这个工具的功能就是大家在 `/var/log/` 目录下面看到的形如 messages-20181028 样式的日志，在使用 logrotate 进行配置后就可以按照时间或者大小对日志进行分割存储.如果对 `/etc/logrotate.conf` 文件和 `/etc/logrotate.d/` 目录没有改动，可以看到 `/etc/logrotate.conf` 默认配置:

```bash
vim /etc/logrotate.conf

# 按周轮训
weekly
# 保留4周日志备份
rotate 4# 标记分割日志并创建当前日志
create
# 使用时间作为后缀
dateext
# 对 logrotate.d 目录下面的日志种类使用
include /etc/logrotate.d
# 对于wtmp 和 btmp 日志处理在这里进行设置
/var/log/wtmp {
    monthly
    create 0664 root utmp
 minsize 1M
    rotate 1
}
/var/log/btmp {
    missingok
    monthly
    create 0600 root utmp
    rotate 1
}
```

此外，如果你在服务器上面安装了mysql，httpd 或者其他应用服务后，logrotate 它会自动在 `/etc/logrotate.d/` 下面创建对应的日志处理方式，基本是继承 logrotate.conf. 因此，不论是你服务器上面系统日志还是应用日志，面对日志量太大的问题，都可以使用 logrotate 进行设置处理.

- rsyslog

  日志收集工具

rsyslog 是一个可以进行日志转发和收集的工具，利用它可以拥有一台日志收集服务器，从而可以减少客户端日志的压力，对于相关日志的统一也是非常有用的，同时还有相应的前端展示工具来进行日志的查看统计.

rsyslog 不仅可以进行系统日志的收集，同时也支持应用日志的收集，只不过如果收集应用自定义日志的话，需要在客户端机器上面进行设置.因我们业务种类较多，不可能在初始化装机时在业务服务器上面配置相同的应用日志服务.因此，业务可以根据自己的需求，进行相关配置.下面让我们看一下当前我们使用的 rsyslog 服务情况.

`ps aux | grep rsyslog` 查看服务是否正常运行

rsyslog 的配置文件为 `/etc/rsyslog.conf`

查看配置文件内容以了解系统默认的文件位置
```bash
cat /etc/rsyslog.conf | ( grep "*" & grep "/" )
```

```bash
tail -f /var/log/messages

Nov 19 22:41:39 localhost NetworkManager[8790]: <info>  [1637332899.9781] dhcp4 (ens33): state changed bound -> bound
Nov 19 22:41:39 localhost dbus[8636]: [system] Activating via systemd: service name='org.freedesktop.nm_dispatcher' unit='dbus-org.freedesktop.nm-dispatcher.service'
Nov 19 22:41:39 localhost dhclient[9088]: bound to 192.168.141.11 -- renewal in 726 seconds.
Nov 19 22:41:39 localhost systemd: Starting Network Manager Script Dispatcher Service...
Nov 19 22:41:39 localhost dbus[8636]: [system] Successfully activated service 'org.freedesktop.nm_dispatcher'
Nov 19 22:41:39 localhost nm-dispatcher: req:1 'dhcp4-change' [ens33]: new request (3 scripts)
Nov 19 22:41:39 localhost systemd: Started Network Manager Script Dispatcher Service.
Nov 19 22:41:39 localhost nm-dispatcher: req:1 'dhcp4-change' [ens33]: start running ordered scripts...
Nov 19 22:42:57 localhost systemd-logind: New session 3 of user root.
Nov 19 22:42:57 localhost systemd: Started Session 3 of user root.

# 对应的含义
# 时间标签：消息发出的日期时间 主机名 生产消息的计算机的名称 子系统名称：发出消息的应用程序的名称 消息 消息级别的具体内容
```

当我们想把一台服务器变成 rsyslog 日志收集服务器的时候，对这个配置文件进行修改即可,在服务端配置有以下两个地方需要进行修改和配置:

```bash
/etc/rsyslog.conf

# 开启 udp 日志传输模式
$ModLoad imudp
$UDPServerRun 514

# 设置日志收集路径，包括客户端机器名与日志类型
$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat
$template RemoteLogs,"/home/syslogs/%HOSTNAME%/%PROGRAMNAME%.log"
*.*  ?RemoteLogs
& ~
```

而在业务机器上面，只需要在配置的末尾，开启日志转发即可:

```bash
/etc/rsyslog.conf

#*.*                @10.21.109.2
#authpriv.*              @@10.101.10.199
*.*             @syslog.sys.srv
```

`@` 表示使用 UDP 进行转发，正好对应服务端开启了 UDP 收集方式.

在经过上面的配置之后，重启 `systemctl restart rsyslog.service` ，这样一个日志收集服务就成功建立了.

在 rsyslog 服务器上面收集到的日志是在配置里面设置好的路径 `/home/syslogs/%HOSTNAME%`

- Loganalyzer

>  Reference
> * [Linux 日志服务初识](https://toutiao.io/posts/0r1boo/preview)
> * [Linux 系统日志小结](https://www.tr0y.wang/2021/06/15/linux-system-log/)
> * [linux系统下各种日志文件的介绍，查看，及日志服务配置](https://zhuanlan.zhihu.com/p/298335887)

## 应用程序日志

### Internet Explorer

  IE浏览器应用程序的日志信息，默认未启用，需要通过组策略进行配置。

  默认位置: `Internet Explorer.evtx`

### Microsoft

  Microsoft文件夹下包含了200多个微软内置的事件日志分类，只有部分类型默认启用记录功能，如远程桌面客户端连接、无线网络、有线网路、设备安装等相关日志。

  默认位置: `详见日志存储目录对应文件`

### Microsoft Office Alerts

  微软Office应用程序（包括Word/Excel/PowerPoint等）的各种警告信息，其中包含用户对文档操作过程中出现的各种行为，记录有文件名、路径等信息。

  默认位置: `OAerts.evtx`

### Windows PowerShell

  Windows自带的PowerShell应用的日志信息。

  默认位置: `Windows PowerShell.evtx`

### 向日葵

  向日葵客户端运行过程中的日志文件保存路径: `C:\Program Files (x86)\Oray\SunLogin\SunloginClient\log`

### Xmamager

  xshell 默认是不开启会话日志记录的

  会话日志文件夹路径 : `C:\Users\<user>\Documents\NetSarang Computer\6\Xshell\Logs`

  5.x会话文件夹路径 : `C:\Users\<user>\Documents\NetSarang\Xshell\Sessions`

  6.x会话文件夹路径 : `C:\Users\<user>\Documents\NetSarang Computer\6\Xshell\Sessions`

### Teamviewer

  连接日志文件路径 : `C:\Program Files (x86)\TeamViewer\Connections_incoming.txt`

## Web日志

### 辅助工具

- [JeffXue/web-log-parser](https://github.com/JeffXue/web-log-parser) - 开源的分析 web 日志工具，采用 python 语言开发，具有灵活的日志格式配置。
- 360星图
- [TurboWay/bigdata_practice](https://github.com/TurboWay/bigdata_practice) - nginx 日志分析可视化

### 命令

```
# 统计请求ip
awk '{print $1}' access.log | sort | uniq -c | sort -rn | more

# 状态码统计
cat access.log  |awk '{print $9}'|sort|uniq -c|sort -rn

# 200 ok URL 统计
grep "183.6.56.66" access.log |  awk '{if ($9==200) print $1,$7,$9}'

# 查看并统计200的状态码及ip（去重后）
cat access.log  | awk '{if ($9=200) print $1,$7,$9}'|sort|uniq -c|sort -rn | head -20

# sql注入事件
more access.log | egrep "%20select%20|%20and%201=1|%20and%201=2|%20exec|%27exec| information_schema.tables|%20information_schema.tables|%20where%20|%20union%20|%20SELECT%20|%2ctable_name%20|cmdshell|%20table_schema|order%20by|select"

# 扫目录行为
more access.log | egrep "\.zip|\.rar|\.mdb|\.inc|\.sql|\.config|\.bak|/login.inc.php|/.svn/|/mysql/|config.inc.php|\.bak|wwwroot|网站备份|/gf_admin/|/DataBackup/|/Web.config|/web.config|/1.txt|/test.txt|www.zip|www.tar|admin"

# webshell事件
more access.log | egrep "eval|%eval|%execute|%3binsert|%20makewebtaski%20|/div.asp|/1.asp|/1.jsp|/1.php|/1.aspx|xiaoma.jsp|tom.jsp|py.jsp|k8cmd.jsp|/k8cmd|ver007.jsp|ver008.jsp|ver007|ver008|%if|\.aar|\.php3|\.php4|\.php5|\.pht|\.phm|\.phml|\.php2|\.phtm|shell.php|\.Php"

# 基础攻击事件
more access.log | egrep "/passwd|%00|/win.ini|/my.ini|/MetaBase.xml|/web.xml|/ServUDaemon.ini|ssh|alert|<script>|include|filename|\.sh"
```

### IIS

`C:\WINDOWS\system32\LogFiles` : 日志内容包括访问域名时间、ip、访问 url 等信息。

### httpd

- `/etc/httpd/logs/`

### apache

apache 日志一般分为 `access_log` 和 `error_log` 两种，通过查看 `httpd.conf` 文件查看 apache 日志路径：

```
grep -i "CustomLog" /etc/httpd/conf/httpd.conf
grep -i "ErrorLog" /etc/httpd/conf/httpd.conf
```

- Linux : `/usr/local/apache/logs/`
- Linux : `/var/log/apache2`
- Windows : `apache/logs/`
- `access_log` : 访问日志,记录所有对 apache 服务器进行请求的访问
- `error_log` : 错误日志,记录下任何错误的处理请求，通常服务器出现什么错误，可对该日志进行查看

### nginx

nginx 的日志主要分为 `access.log`、`error.log` 两种，可通过查看 `nginx.conf` 文件来查找相关日志路径

- `/var/log/nginx/access.log` : 主要记录访问日志，记录访问客户端 ip 地址、访问时间、访问页面等信息。
- `/var/log/nginx/error.log` : 主要记录一些错误信息。

### tomcat

tomcat 日志默认路径：在安装目录下的 logs 文件夹下

- 如果在安装中默认修改了日志存储位置，可在 `conf/logging.properties` 文件中查看
- `catalina.out` : 运行中的日志，主要记录运行中产生的一些信息，尤其是一些异常错误日志信息
- `catalina.Y-M-D.log` : 是 tomcat 自己运行的一些日志，这些日志还会输出到 `catalina.out`，但是应用向 console 输出的日志不会输出到 `catalina.{yyyy-MM-dd}.log`
- `host-manager.xx.log` : 管理日志
- `localhost.xx.log` : 程序异常没有被捕获的时候抛出的地方，Tomcat 下内部代码丢出的日志(jsp 页面内部错误的异常，`org.apache.jasper.runtime.HttpJspBase.service` 类丢出的，日志信息就在该文件!)应用初始化(listener,filter, servlet)未处理的异常最后被 tomcat 捕获而输出的日志，而这些未处理异常最终会导致应用无法启动。
- `manager.xx.log`
- `localhost_access_log` : 主要记录访问日志信息，记录访问的的时间、ip 地址等信息，也是应急中经常用到的日志信息

### weblogic

weblogic 在安装结束后默认开启了日志记录功能，默认配置情况下，weblogic 会有3种日志，分别是 `accesslog`, `Server log` 和 `domain log`，WebLogic8.x 和 9 及以后的版本目录结构有所不同。

- `domain_name/servers/server_name/logs/`
- `$MW_HOME` 是 WebLogic 的安装目录
- `<domain_name>` 是域的实际名称，是在创建域的时候指定的
- `<server_name>` 是 Server 的实际名称，是在创建 Server 的时候指定的
- `<adminserver_name>` 是 Admin Server 的实际名称，是在创建 Admin Server 的时候指定的。

WebLogic 9及以后版本：

- ```
  domain log
  ```

   

  : 主要记录了一个 domain 的运行情况，一个 domain 中的各个 weblogic server 可以把它们的一些信息（如：严重错误）发送到 AdminServer 上，AdminServer 把这些信息传递到 domain.log 上.

  ```
  $MW_HOME\user_projects\domains\<domain_name>\servers\<adminserver_name>\logs\<domain_name>.log
  ```

- ```
  server log
  ```

   

  : 主要用于服务器的一般日志记录，比如 weblogic 的启动、关闭、部署应用等相关记录，日志格式：依次为时间戳，严重程度，子系统，计算机名，服务器名，线程 ID.

  ```
  $MW_HOME\user_projects\domains\<domain_name>\servers\<server_name>\logs\<server_name>.log
  ```

- ```
  access log
  ```

   

  : 主要记录 http 请求，默认情况下日志记录处于启用状态，服务器将 http 请求保存在单独的日志文件中，日志主要记录了 http 请求请求 ip 地址、请求时间、访问页面、响应状态等信息.

  ```
  $MW_HOME\user_projects\domains\<domain_name>\servers\<server_name>\logs\access.log
  ```

WebLogic 8.x版本:

- ```
  access log
  ```

  ```
  $MW_HOME\user_projects\domains\<domain_name>\<server_name>\access.log
  ```

- ```
  server log
  ```

  ```
  $MW_HOME\user_projects\domains\<domain_name>\<server_name>\<server_name>.log
  ```

- ```
  domain log
  ```

  ```
  $MW_HOME\user_projects\domains\<domain_name>\<domain_name>.log
  ```

### jboss

- LOG4J 配置默认 `Deploy/conf/` 如 `jboss/server/default/conf/jboss-log4j.xml`

## 数据库日志

### Oracle

- 查看日志 : SQL> show parameter dump
- 查看 vdiaginfo系统视图:SQL>select∗fromvdiag_info;
- 查询 bdump 参数，来找到 alert 日志位置 : show parameter background_dump_dest

Oracle 日志文件分为两种：重做日志文件（redo log file）、归档日志文件，其中重做日志文件主要记录了数据库的操作过程，可以在进行数据库恢复时，将重做日志文件在还原的数据库上进行执行，以达到数据库的最新状态。

Oracle 数据库默认只是对数据库的登录情况记录，但是不对数据库的查询记录统计，可通过 `show parameter audit`，查看审计功能是否开启，若 audit_sys_operations 值为 DB。

开启审计功能

```
alter system set audit_sys_operations=TRUEscope=spfile;
alter system set audit_trail=db,extendedscope=spfile;
```

重启实例即可,开启后会把审计内容记录到 sys 库的 `AUD$` 表中

数据库连接日志

```
cat /opt/oracle/diag/tnslsnr/localhost/listener/trace/listener.log
```

### mssql

SQL Server 日志记录了完整的 SQL Server 数据库运行的状态信息，并以消息的形式记录系统级、应用级操作。

可以使用 SQL Server Management Studio 中的日志文件查看器来访问有关在以下日志中捕获的错误和事件的信息：

SQL Server Management Studio 连接 sqlserver 数据库，查看与常规 SQL Server 活动相关的日志。

登录到 SQL Server Management Studio，依次点击 管理--SQL Server 日志

- exec xp_readerrorlog

- object Explorer-Management-SQL Server logs-view-logs

- SQL Server 2008： R2\MSSQL10_50.MSSQLSERVER\MSSQL\Log\ERRORLOG

- 查询最近一次启动 sqlserver 时间：

  ```
  select sqlserver_start_time fromsys.dm_os_sys_info;
  ```

- 历史 sql 记录查询：SQLServer 并没有这样的实现，只有 `sys.dm_exec_query_stats` 缓存了一部分 (sql server 服务开启后执行的语句，某些不被缓存执行计划的语句并不记录)。

- Sqlserver 开启日志审计功能可参考 https://blog.51cto.com/gaowenlong/1908381

- xp_cmdshell在mssql2005之后的版本中是默认禁止的，查看xp_cmdshell是否被启用。

  ```
  Exec master.dbo.xp_cmdshell 'whoami'
  ```

### mysql

- `/root/.mysql_history`

- 错误日志：默认开启，hostname.err

- 查询日志：记录用户的所有操作。默认关闭，general_log_file（常见 getshell 手法）

- 慢查询日志：记录执行时间超过指定时间的查询语句，slow_query_log_file（慢查询 getshell）

- 事务日志：ib_logfile0

- 二进制日志：记录修改数据或有可能引起数据改变的 mysql 语句，log_bin，默认在数据目录，如 mysql-bin.000001

- `ErrorLog` : 记录 Mysql 运行过程中的 Error、Warning、Note 等信息，系统出错或者某条记录出问题可以查看 Error 日志；

- ```
  GenaralQuery Log
  ```

   

  ：记录 mysql 的日常日志，包括查询、修改、更新等的每条 sql；

  ```
  show variables like '%general%';        -- 查看log配置信息
  SET GLOBAL general_log = 'On';          -- 开启日志
  SET GLOBAL general_log_file = '/var/lib/mysql/mysql.log';  -- 指定日志文件路径
  ```

- `Binary Log` ：二进制日志，包含一些事件，这些事件描述了数据库的改动，如建表、数据改动等，主要用于备份恢复、回滚操作等；

- `Slow QueryLog*` ：记录 Mysql 慢查询的日志；

- mysql 相关命令

  ```
  status;
  show global variables like '%log%';
  show global variables like '%gene%';
  show master status;
  systemmore /mydata/data/stu18_slow.log;
  showbinary logs;
  showmaster logs;
  showbinlog events in 'mysql-bin.000011';
  show processlist;
  ```

- 更多 mysql 日志类型可参考 https://www.jianshu.com/p/db19a1d384bc

- 有哪些IP在爆破？

  ```
  grep  "Access denied" mysql.log |cut -d "'" -f4|uniq -c|sort -nr
  ```

- 爆破用户名字典都有哪些？

  ```
  grep  "Access denied" mysql.log |cut -d "'" -f2|uniq -c|sort -nr
  ```