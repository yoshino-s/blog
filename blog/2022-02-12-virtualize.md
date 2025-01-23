---
title: 虚拟化 Virtualization
tags:
  - virtualization
authors: [yoshino-s]
---

# 虚拟化技术

<!-- truncate -->

## 类别

### 硬件虚拟化

硬件物理平台本身提供了对特殊指令的截获和重定向的支持。支持虚拟化的硬件，也是一些基于硬件实现软件虚拟化技术的关键。在基于硬件实现软件虚拟化的技术中，在硬件是实现虚拟化的基础，硬件(主要是CPU)会为虚拟化软件提供支持，从而实现硬件资源的虚拟化。

> - Intel-VT (Intel Virtualization Technology)
> - AMD-V (AMD Virtualization Technology)
> - VT-x (Virtualization Extensions)

### 软件虚拟化

软件虚拟化就是利用软件技术，在现有的物理平台上实现对物理平台访问的截获和模拟。在软件虚拟化技术中，有些技术不需要硬件支持，如：QEMU；而有些软件虚拟化技术，则依赖硬件支持，如：VMware、KVM。

#### 完全虚拟化 Full Virtualization

虚拟机模拟完整的底层硬件环境和特权指令的执行过程，使客户机操作系统可以独立运行。支持完全虚拟化的软件有：Parallels Workstation、VirtualBox、Virtual Iron、Oracle VM、Virtual PC、Virtual Server、Hyper-V、VMware Workstation、QEMU等

![blob.png](https://cdn.yoshino-s.xyz/typora_img/23034159pmlfhjeglhdbmr.png)

![blob.png](https://cdn.yoshino-s.xyz/typora_img/230353ouxapr9dboa2r8cz.png)

因为宿主操作系统工作在Ring0，客户操作系统不能运行在Ring0，当客户操作系统执行特权指令时，就会发生错误。

虚拟机管理程序（VMM）就是负责客户操作系统和内核交互的驱动程序，运行在Ring0上，以驱动程序的形式体现（驱动程序工作在Ring0，否则不能驱动设备）。

当客户操作系统执行特权指令时，会触发异常（CPU机制，没权限的指令，触发异常），VMM捕获这个异常，在异常处做翻译、模拟，返回处理结构到客户操作系统内。客户操作系统认为自己的特权指令工作正常，继续运行。

通过复杂的异常处理过程，性能损耗比较大。

#### 硬件辅助虚拟化 Hardware-assisted Virtualization

通过硬件辅助支持模拟运行环境，使客户机操作系统可以独立运行，实现完全虚拟化的功能。支持硬件辅助虚拟化的软件有：Linux KVM、VMware Workstation、VMware Fusion、Virtual PC、Xen、VirtualBox、Parallels Workstation等

![blob.png](https://cdn.yoshino-s.xyz/typora_img/230806puwcxjdmixcomvwt.png)

随着CPU厂商开始支持虚拟化，以X86 CPU为例，推出了支持Intel-VT的CPU，有VMX root operation和VMX non-root operation两种模式，两种模式都支持CPU运行的四个级别。

这样，VMM可以运行在root operation模式下，客户操作系统运行在non-root operation模式下。

通过硬件层做出区分，这样，在全虚拟化技术下，有些依靠“捕获异常-翻译-模拟”的实现就不需要了。

而且CPU厂商支持虚拟化的力度在不断加大，靠硬件辅助的虚拟化技术性能逐渐逼近半虚拟化，再加上全虚拟化不需要修改客户操作系统的优势，全虚拟化技术应该是未来的发展趋势。

#### 部分虚拟化 Partial Virtualization

只针对部分硬件资源进行虚拟化，虚拟机模拟部分底层硬件环境，特别是地址空间。这样的环境支持资源共享和线程独立，但是不允许建立独立的客户机操作系统。

#### 平行虚拟化/半虚拟化 Para-Virtualization

虚拟机不需要模拟硬件，而是将部分硬件接口以软件的形式提供给客户机操作系统。如：早期的Xen。

![blob.png](https://cdn.yoshino-s.xyz/typora_img/230720fuch70asmcs0bzci.png)

通过修改客户操作系统代码，将原来在物理机上执行的一些特权指令，修改成可以和VMM直接交互的方式，实现操作系统的定制化。

半虚拟化技术XEN，就是通过为客户操作系统定制一个专门的内核版本，和X86、MIPS、ARM这些内核版本等价。

这样，就不会有捕获异常、翻译和模拟的过程，性能损耗比较少。

这也是XEN这种半虚拟化架构的优势，也是为什么XEN只支持Linux的虚拟化，不能虚拟化Windows的原因（微软不开源）。

#### 操作系统层虚拟化 OS-level virtualization

这种技术将操作系统内核虚拟化，可以允许使用者空间软件实例被分割成几个独立的单元，在内核中运行，而不是只有一个单一实例运行。这个软件实例，也被称为是一个容器（containers）、虚拟引擎（Virtualization engine）、虚拟专用服务器（virtual private servers）。每个容器的进程是独立的，对于使用者来说，就像是在使用自己的专用服务器。
Docker容器技术就是属于操作系统层虚拟化的范畴。

## 虚拟机检测

### Windows

#### 进程名检测

Vmware:

- Vmtoolsd.exe
- Vmwaretrat.exe
- Vmwareuser.exe
- Vmacthlp.exe

VirtualBox:

- vboxservice.exe
- vboxtray.exe

#### 注册表

> HKLM\SOFTWARE\Vmware Inc\Vmware ToolsHKLM\HARDWARE\DEVICEMAP\Scsi\Scsi Port 2\Scsi Bus 0\Target Id 0\Logical Unit Id 0\IdentifierHKEY_CLASSES_ROOT\Applications\VMwareHostOpen.exeHKEY_LOCAL_MACHINE\SOFTWARE\Oracle\VirtualBox Guest Additions

#### 磁盘文件

Vmware:

- C:\windows\System32\Drivers\Vmmouse.sys
- C:\windows\System32\Drivers\vmtray.dll
- C:\windows\System32\Drivers\VMToolsHook.dll
- C:\windows\System32\Drivers\vmmousever.dll
- C:\windows\System32\Drivers\vmhgfs.dll
- C:\windows\System32\Drivers\vmGuestLib.dll

VirtualBox:

- C:\windows\System32\Drivers\VBoxMouse.sys
- C:\windows\System32\Drivers\VBoxGuest.sys
- C:\windows\System32\Drivers\VBoxSF.sys
- C:\windows\System32\Drivers\VBoxVideo.sys
- C:\windows\System32\vboxdisp.dll
- C:\windows\System32\vboxhook.dll
- C:\windows\System32\vboxoglerrorspu.dll
- C:\windows\System32\vboxoglpassthroughspu.dll
- C:\windows\System32\vboxservice.exe
- C:\windows\System32\vboxtray.exe
- C:\windows\System32\VBoxControl.exe

#### 服务

- VMTools
- Vmrawdsk
- Vmusbmouse
- Vmvss
- Vmscsi
- Vmxnet
- vmx_svga
- Vmware Tools

```cmd
sc query # 获取服务名
```

#### Mac

- 00:05:69 (Vmware)
- 00:0C:29 (Vmware)
- 00:1C:14 (Vmware)
- 00:50:56 (Vmware)
- 08:00:27 (VirtualBox)

#### CPUID

```
bool isVM() {
	DWORD dw_ecx;
	bool bFlag = true;
	_asm{
		pushad;
		pushfd;
		mov eax,1;
		cpuid;
		and ecx,0x80000000;
		test ecx,ecx;
		setz[bFlag];
		popfd;
		popad;
	}
}
```

#### IDT

IDT(Interrupt Descriptor Table)是Windows处理中断时用于查找中断处理程序的一块内存，为了隔离Host与Guest OS，虚拟机与宿主机的IDT在内存当中的地址是不同的，Red Pill这个工具就通过获取IDT的地址来进行区分，当地址为0xff开头时为真机、为0xe8开头时为虚拟机(32位系统上)。

### Linux

##### Cmd

```bash
sudo dmidecode
systemd-detect-virt
lsscsi
cat /proc/scsi/scsi
dmesg
virt-what
```

### 工具

- https://www.trapkit.de/tools/scoopyng/
- https://github.com/AlicanAkyol/sems
- 

## 参考

[Towards an Understanding of Anti-virtualization and Anti-debugging Behavior in Modern Malware](https://cdn.yoshino-s.xyz/file/data/Towards_an_understanding_of_anti-virtualization_and_anti-debugging_behavior_in_modern_malware.pdf)