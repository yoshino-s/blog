---
title: prototype pollution hunter
date: 2021-07-29 12:03:54
tags:
  - prototype pollution
  - nodejs
  - javascript
  - vulnerability
category: nodejs
---

> How to be a prototype pollution hunter?

让我们来假设一个场景：你的项目中有这样一个需求：

```javascript
/*
 * convert obj `{a:{b:{c:d}}}` to `{"a.b.c": 2}`
 */
function flatten(obj) {
  // TODO
}

/*
 * convert obj `{"a.b.c": 2}` to `{a:{b:{c:d}}}`
 */
function unflatten(obj) {
  // TODO
}
```

然后你会如何去实现：

1. 去 npm 上找一个类似的包， `npm install`，看文档，找用法，require。。。
2. 自己写一个，代码量+++

过了两天，你又得用到这个方法，你会选择

1. 用上次找到的
2. 复制上次写的
3. 抽象出一个包，发布，给更多的人用

作为一名有追求的程序员，你选择了 2 和 3，你很开心，因为你为开源事业贡献了一份力量。你也成为 npm 庞大社区的一员了。

然后呢，问题就出现了，让我们回顾一下你写的代码

```javascript
/*
 * convert obj `{"a.b.c": 2}` to `{a:{b:{c:d}}}`
*/
function unflatten(obj) => {
  const result = {};

  if (typeof obj !== 'object' || isDate(obj)) return obj;

  const unflat = (original) => {
    Object.keys(original).forEach((key) => {
      const newKeys = key.split('.')
      newKeys.reduce((o, k, i) => {
        return o[k] || (o[k] = isNaN(Number(newKeys[i + 1])) ? (newKeys.length - 1 === i ? original[key] : {}) : [])
      }, result)
    })
  }

  unflat(obj);

  return result
}
```

很牛逼，你考虑了各种类型，测试了几下也没毛病。

> TODOing