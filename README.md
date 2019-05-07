# demo
<https://iixianjie.github.io/pages/test2/>

# 依赖
依赖于aMap及3Dmap插件，和DistrictSearch插件，使用前须确保环境中存在。最简单的引入方式如下,请替换key为你的aMapkey。
```
<script
  type="text/javascript"
  src="https://webapi.amap.com/maps?v=1.4.14&key=xxx&plugin=Map3D,AMap.DistrictSearch"
></script>
<script src="https://webapi.amap.com/ui/1.0/main.js?v=1.0.11"></script>
```
# 构造器
AreaMap(options)  
```
options: *<obj>  
  el:  *<str>  实例化map用的容器id  
  areaName:  *<str>  用于搜索地区的区域名，如贵阳市、上海市。  
  filterAreaRegExp: *<RegExp>  当出现如同名的区时，例如查询白云区会同时查到贵阳的白云区和广东的白云区，需要使用对应区的行政编号前缀进行匹配。  
  zooms: <num[min, max]>   地图允许的缩放区间  
  zoom: <num>   默认缩放级别
```

```js
let areaMap = new AreaMap({
  el: 'container',
  areaName: '白云区',
  filterAreaRegExp: /^52/,
});
```

<br>

# 事件
## areaClick
某个区域的label被点击

```js
areaMap
  .on('areaClick', function(arg) {
    console.log('areaClick', arg);  // 参数有该区域经纬度、区域名组成
  })
```

## childrensChange
搜索到对应区域后会将该区域的直属子区域作为参数传入。


## finish
地图创建完成，可以在这里进行对map实例的操作


<br>

# instance

## 属性
* 所有实例属性均为异步设值，在实例化后马上获取可能会获取不到,如果需要在地图生成后马上进行一些操作（如添加点、文本等），可以在此事件中进行。

### areaCode
根据option.areaName查询到的行政区号

### areaCenter
根据option.areaName查询到行政区的坐标位置

### map
aMap实例

<br>

## 方法

### setMapCenter(position, reset)
设置地图中心到position，并将缩放等级由预设提升至0.5,reset为true时，使用预设缩放等级。

<br>

# 功能实现

## 需要
* **实践所** 及 **实践站** 都有经纬度
* 各个区域的经纬度

## 贵阳市到区级的分区
使用`DistrictExplorer` API实现，创建一个匹配数组用于根据点击时的区名与后台id进行关联。

## 区级以下分区
API不支持，区的最外层仍可使用 `DistrictExplorer` API来标注区域,内部根据实践所及实践站的坐标进行marker描点,点击marker切换区域数据。

## 区域外地图隐藏?
使用3dMap + 区域遮罩

## 还没想到.jpg
