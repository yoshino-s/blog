---
title: 怎么搞定加密Electron应用
tags:
  - crack
  - electron
authors: [yoshino-s]
---

# 怎么搞定加密Electron应用

遇到了个加密的electron应用，每次都逆一下挺麻烦的，于是准备研究一下思路，一劳永逸一下。

## 分析

先来看看文件结构，很明显是单纯的electron，在应用层面没做什么改动

![image-20220401153425907](https://cdn.yoshino-s.online//typora_img/image-20220401153425907.png)

resource层面也基本符合要求，把核心代码，组件，node_modules分别打包了

![image-20220401153500987](https://cdn.yoshino-s.online//typora_img/image-20220401153500987.png)

其中`node_modules.asar`和`lib.asar`中的代码并未有改变，但是`app.asar`中的代码被加密了

![image-20220401153749304](https://cdn.yoshino-s.online//typora_img/image-20220401153749304.png)

这个加密从v1.0.0开始存在，之前也有很多人分析过了，基本就是照抄的

> https://toyobayashi.github.io/2020/01/06/ElectronAsarEncrypt/

这篇文章里的思路

之前的版本中，aes加密，key写死在`main.node`里，iv在文件头16个字节，key好几个版本没有变，也都没啥事，解包，修改封装一气呵成。

但是在最近一个版本开始，每个发布版的key和iv都是写死的，且每个版本都不同

![image-20220401154206701](https://cdn.yoshino-s.online//typora_img/image-20220401154206701.png)

这就让我们之前直接解密的思路没用了

## 重新探究

让我们回到加密逻辑，我们来看一下加密的代码，这里直接选用前文提到的文章中的源代码了。（作者好像压根没改多少

```cpp
static Napi::Value _getModuleObject(const Napi::Env& env, const Napi::Object& exports) {
  std::string findModuleScript = "(function (exports) {\n"
    "function findModule(start, target) {\n"
    "  if (start.exports === target) {\n"
    "    return start;\n"
    "  }\n"
    "  for (var i = 0; i < start.children.length; i++) {\n"
    "    var res = findModule(start.children[i], target);\n"
    "    if (res) {\n"
    "      return res;\n"
    "    }\n"
    "  }\n"
    "  return null;\n"
    "}\n"
    "return findModule(process.mainModule, exports);\n"
    "});";
  Napi::Function _findFunction = _runScript(env, findModuleScript).As<Napi::Function>();
  Napi::Value res = _findFunction({ exports });
  if (res.IsNull()) {
    Napi::Error::New(env, "Cannot find module object.").ThrowAsJavaScriptException();
  }
  return res;
}
static Napi::Function _makeRequireFunction(const Napi::Env& env, const Napi::Object& module) {
  std::string script = "(function makeRequireFunction(mod) {\n"
      "const Module = mod.constructor;\n"

      "function validateString (value, name) { if (typeof value !== 'string') throw new TypeError('The \"' + name + '\" argument must be of type string. Received type ' + typeof value); }\n"

      "const require = function require(path) {\n"
      "  return mod.require(path);\n"
      "};\n"

      "function resolve(request, options) {\n"
        "validateString(request, 'request');\n"
        "return Module._resolveFilename(request, mod, false, options);\n"
      "}\n"

      "require.resolve = resolve;\n"

      "function paths(request) {\n"
        "validateString(request, 'request');\n"
        "return Module._resolveLookupPaths(request, mod);\n"
      "}\n"

      "resolve.paths = paths;\n"

      "require.main = process.mainModule;\n"

      "require.extensions = Module._extensions;\n"

      "require.cache = Module._cache;\n"

      "return require;\n"
    "});";

  Napi::Function _makeRequire = _runScript(env, script).As<Napi::Function>();
  return _makeRequire({ module }).As<Napi::Function>();
}
```

还有一段

```cpp
#include <unordered_map>

typedef struct AddonData {
  // 存 Node 模块引用
  std::unordered_map<std::string, Napi::ObjectReference> modules;
  // 存函数引用
  std::unordered_map<std::string, Napi::FunctionReference> functions;
} AddonData;

static void _deleteAddonData(napi_env env, void* data, void* hint) {
  // 释放堆内存
  delete static_cast<AddonData*>(data);
}

static Napi::Value modulePrototypeCompile(const Napi::CallbackInfo& info) {
  AddonData* addonData = static_cast<AddonData*>(info.Data());
  Napi::Function oldCompile = addonData->functions["Module.prototype._compile"].Value();
  // 这里推荐使用 C/C++ 的库来做解密
  // ...
}

static Napi::Object _init(Napi::Env env, Napi::Object exports) {
  Napi::Object module = _getModuleObject(env, exports).As<Napi::Object>();
  Napi::Function require = _makeRequireFunction(env, module);
  // const mainModule = process.mainModule
  Napi::Object mainModule = env.Global().As<Napi::Object>().Get("process").As<Napi::Object>().Get("mainModule").As<Napi::Object>();
  // const electron = require('electron')
  Napi::Object electron = require({ Napi::String::New(env, "electron") }).As<Napi::Object>();
  // require('module')
  Napi::Object Module = require({ Napi::String::New(env, "module") }).As<Napi::Object>();
  // module.parent
  Napi::Value moduleParent = module.Get("parent");

  if (module != mainModule || (moduleParent != Module && moduleParent != env.Undefined() && moduleParent != env.Null())) {
    // 入口模块不是当前的原生模块，可能会被拦截 API 导致泄露密钥
    // 弹窗警告后退出
  }

  AddonData* addonData = new AddonData;
  // 把 addonData 和 exports 对象关联
  // exports 被垃圾回收时释放 addonData 指向的内存
  NAPI_THROW_IF_FAILED(env,
    napi_wrap(env, exports, addonData, _deleteAddonData, nullptr, nullptr),
    exports);

  // require('crypto')
  // addonData->modules["crypto"] = Napi::Persistent(require({ Napi::String::New(env, "crypto") }).As<Napi::Object>());

  Napi::Object ModulePrototype = Module.Get("prototype").As<Napi::Object>();
  addonData->functions["Module.prototype._compile"] = Napi::Persistent(ModulePrototype.Get("_compile").As<Napi::Function>());
  ModulePrototype["_compile"] = Napi::Function::New(env, modulePrototypeCompile, "_compile", addonData);

  try {
    require({ Napi::String::New(env, "./main.js") }).Call({ _getKey() });
  } catch (const Napi::Error& e) {
    // 弹窗后退出
    // ...
  }
  return exports;
}

// 不要分号，NODE_API_MODULE 是个宏
NODE_API_MODULE(NODE_GYP_MODULE_NAME, _init)
```

大概逻辑就是覆盖`Module.prototype._compile`函数，在addon层面检测加密并解开。

在这之前他去做了几件事

1. require了几个内部的库，用于后续操作
2. 检测入口是否为自己，不是说明被第三方调用了，会被注入代码，直接退出

3. 获得了`Module.prototype._compile`，并覆写成自己的

这里问题就来了，他的`Module.prototype._compile`覆盖逻辑为

```js
const oldCompile = Module.prototype._compile
Module.prototype._compile = function (content, filename) {
  if (filename.indexOf('app.asar') !== -1) {
    // 如果这个 JS 是在 app.asar 里面，就先解密
    return oldCompile.call(this, decrypt(Buffer.from(content, 'base64')), filename)
  }
  return oldCompile.call(this, content, filename)
}
```

那么问题就来了，我们如果在他之前monkey patch一下`Module.prototype._compile`是不是就能拦截了？

## 注入

显然作者考虑到了这个问题，所以他去检测是否是第三方调用的，也就是说你去patch然后`require("main.node")`是没用的。但是把，作者这里偷懒，为了require方便，直接用一个`_makeRequireFunction`写了段js做了个函数出来，而且这段代码会在他覆写`_compile`前执行。懒得去写二进制分析的，还得装一堆反编译工具，那我们直接替换字节就行了，只要让我们注入的脚本长度小于原本的就行。

观察发现

```js
function validateString (value, name) { if (typeof value !== 'string') throw new TypeError('The \"' + name + '\" argument must be of type string. Received type ' + typeof value); }
```

这个函数可谓是毫无用处，直接给他缩减了就行

所以我们构造如下注入

```python
with open("main.node.bak", "rb") as f:
    node = f.read()

inject_old = br"function validateString (value, name) { if (typeof value !== 'string') throw new TypeError('The \"' + name + '\" argument must be of type string. Received type ' + typeof value); }"
inject_new = br"function validateString(){};console.log('hello world');"

assert len(inject_old) >= len(inject_new)

assert inject_old in node

inject_new = inject_new.ljust(len(inject_old), b" ")

node = node.replace(inject_old, inject_new)

with open("main.node", "wb") as f:
    f.write(node)
```

![image](https://cdn.yoshino-s.online//typora_img/161183475-46c9a23f-a35a-4613-9fca-2f906b7140e8.png)

当然这样是有极限的，因为长度限定了，那我们不妨去直接require一个外部脚本。

require会有查找范围的问题，我们先看看当前module的搜索范围，注入`function validateString(){};console.log(mod);`，可以发现它默认的查找范围有node_modules，那么很简单，我们注入一个`mod.require("inject.js")`，然后在`resources/node_modules`里放一个inject.js就可以随便注了。（突然想到强网杯随便注，笑

![image-20220401160747567](https://cdn.yoshino-s.online//typora_img/image-20220401160747567.png)

然后dump也很简单了，就注入如下代码

 ```
const Module = module.constructor;
const rawCompile = Module.prototype._compile;
const fs = require("fs");
const path = require("path");
Module.prototype._compile = function(content, filename) {
  if(filename.indexOf('app.asar') !== -1) {
    fs.writeFileSync(path.basename(filename), content);
  }
  return rawCompile.call(this, content, filename);
}
 ```

然后破解这里就不细说了，反正就替换一下lincense就行对吧。

## 工具

写了个自动化工具去注入，然后插入自定义的js，反正大家想用就去 https://github.com/yoshino-s/typoraCracker 下呗。
