/**
 * @author lxj
 * @date 2019-05-06
 * @class AreaMap
 * @option
 */

// 用于使用fixPosition调整特定label的位置
const fixLabelPosition = [
  {
    label: '南明区',
    position: [40, 20]
  }, {
    label: '逸景社区服务中心',
    position: [0, -20]
  }
];

class AreaMap {
  constructor(opt = {}) {
    this.el = opt.el;
    this.showLabel = opt.showLabel || true;
    this.areaName = opt.areaName;
    this.filterAreaRegExp = opt.filterAreaRegExp;
    this.zooms = opt.zooms || [9.5, 14];
    this.zoom = opt.zoom || 9.5;

    this.searchArea();
  }

  // 根据fixLabelPosition对象的数值来更正地图上的label位置
  static fixPosition(name) {
    var index = fixLabelPosition.findIndex(function(v) {
      return name === v.label;
    });

    return index !== -1
      ? new AMap.Pixel(...fixLabelPosition[index].position)
      : new AMap.Pixel(0, 0);
  }

  searchArea() {
    if (!this.areaName) {
      alert('地区名必传');
      return;
    }

    var opts = {
      subdistrict: 1,
      extensions: 'all',
      level: 'city'
    };

    //利用行政区查询获取边界构建mask路径
    //也可以直接通过经纬度构建mask路径
    var district = new AMap.DistrictSearch(opts);

    district.search(this.areaName, (status, result) => {
      if (status === 'no_data') {
        alert('没有 ' + this.areaName + ' 的区域信息');
        return;
      }
      // 获取区号匹配的地图信息
      var ind = this.filterAreaRegExp
        ? result.districtList.findIndex(v => {
            return this.filterAreaRegExp.test(v.adcode);
          })
        : 0;

      var selectedArea = result.districtList[ind];
      var bounds = selectedArea.boundaries;
      var childrens = selectedArea.districtList;
      var adcode = selectedArea.adcode;

      // 返回children
      this.emit('childrensChange', childrens);

      this.bounds = bounds;
      this.childrens = childrens;
      this.areaCode = adcode;
      this.areaCenter = [selectedArea.center.lng, selectedArea.center.lat];

      this.createMap();
    });
  }

  createMap() {
    var { bounds, childrens, areaCenter } = this;

    // 根据区域bounds生成mask
    var mask = [];
    for (var i = 0; i < bounds.length; i += 1) {
      mask.push([bounds[i]]);
    }

    this.map = new AMap.Map(this.el, {
      mapStyle: 'amap://styles/darkblue',
      mask,
      viewMode: '3D',
      skyColor: 'transparent', // 去掉天空颜色
      pitch: 40, // 倾角
      showLabel: true,
      resizeEnable: true,
      center: this.areaCenter,
      zooms: this.zooms,
      zoom: this.zoom,
    });

    this.createTextLabel();
  }

  // 创建地图上的文字

  createTextLabel() {
    var { childrens, map } = this;

    if (this.showLabel) {
      childrens.forEach((v) => {
        var position = [v.center.lng, v.center.lat];

        var text = new AMap.Text({
          text: v.name,
          clickable: true,
          angle: 0,
          autoRotation: true,
          cursor: 'pointer',
          angle: 0,
          // 修改文字位置
          offset: AreaMap.fixPosition(v.name),
          extData: {
            name: v.name
          },
          style: {
            'background-color': 'rgba(255,255,255,0.9)',
            'font-size': '12px',
            border: 'none',
            color: '#333'
          },
          position,
          map
        });

        text.on('click', (e) => {
          this.setMapCenter(position);
          this.emit('areaClick', {
            position: [e.lnglat.lng, e.lnglat.lat],
            name: e.target.B.extData.name
          });
        });
      });
    }

    // 隐藏地图和文字label外的其他地图信息
    map.setFeatures(['bg', 'point']);

    this.areaHeightLight();
    this.emit('finish');
  }

  // 设置地图中心到指定位置，并将缩放等级由预设提升至0.5,reset为true时，使用预设缩放等级
  setMapCenter(position, reset) {
    let zoom = this.map.getZoom();
    if(!this._zoom) {
      this._zoom = zoom + 0.5;
    }

    this.map.setCenter(position);
    this.map.setZoom(reset ? this.zoom : this._zoom);
  }

  // 区域上色、创建掩模、限制可视区域
  areaHeightLight() {
    var { map, bounds, areaCode } = this;

    // 区域颜色
    var colors = [
      '#ffa39e',
      '#ffbb96',
      '#ffd591',
      '#ffe58f',
      '#fffb8f',
      '#eaff8f',
      '#b7eb8f',
      '#87e8de',
      '#91d5ff',
      '#adc6ff',
      '#d3adf7',
      '#ffadd2'
    ];

    AMapUI.loadUI(['geo/DistrictExplorer'], function(DistrictExplorer) {
      //创建一个实例
      var districtExplorer = new DistrictExplorer({
        map
      });

      districtExplorer.loadAreaNode(areaCode, function(error, areaNode) {
        //更新地图视野
        map.setBounds(areaNode.getBounds(), null, null, true);

        //清除已有的绘制内容
        districtExplorer.clearFeaturePolygons();

        //绘制子区域
        districtExplorer.renderSubFeatures(areaNode, function(feature, i) {
          var fillColor = colors[i % colors.length];
          var strokeColor = colors[colors.length - 1 - (i % colors.length)];

          return {
            cursor: 'default',
            bubble: true,
            strokeColor: strokeColor, //线颜色
            strokeOpacity: 1, //线透明度
            strokeWeight: 1, //线宽
            fillColor: fillColor, //填充色
            fillOpacity: 0.35 //填充透明度
          };
        });

        //绘制父区域
        districtExplorer.renderParentFeature(areaNode, {
          cursor: 'default',
          bubble: true,
          strokeColor: 'black', //线颜色
          strokeOpacity: 1, //线透明度
          strokeWeight: 1, //线宽
          fillColor: null, //填充色
          fillOpacity: 0.35 //填充透明度
        });
      });

    });

    // 添加掩模
    var object3Dlayer = new AMap.Object3DLayer({ zIndex: 1 });

    map.add(object3Dlayer);
    var height = -8000;
    var color = '#0088ffcc'; //rgba
    var wall = new AMap.Object3D.Wall({
      path: bounds,
      height: height,
      color: color
    });
    wall.transparent = true;
    object3Dlayer.add(wall);
    //添加描边
    for (var i = 0; i < bounds.length; i += 1) {
      new AMap.Polyline({
        path: bounds[i],
        strokeColor: '#99ffff',
        strokeWeight: 4,
        map: map
      });
    }

    // 限制可视区域
    var _bounds = map.getBounds();
    map.setLimitBounds(_bounds);
  }

  /* 简易的自定义事件实现 */
  _events = {};

  on(eventName, handler) {
    this._events[eventName] = handler;
    return this;
  }

  emit(eventName, ...args) {
    if (!this._events[eventName]) return;
    this._events[eventName](...args);
  }
}
