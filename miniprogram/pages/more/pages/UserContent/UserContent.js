

Page({
  data: {
    // 丢入瀑布流的数据
    list: [],
    item: "一半山河一般啊,江河一半山河一般啊,江河,一半山河一般啊,江河一半山河一般啊,江河,",
    array: [
      {
        biaoqian: "张三",
      },
      {
        biaoqian: "李四"
      },
      {
        biaoqian: "王五"
      }
    ],
    showLoading: 1,   // 动画显示
  },

  onLazyLoad(info) {
    console.log(info)
  },
  getData(e) { //分页加载数据
    let args = wx.getStorageSync('args');
    let currentPage = e.detail.currentPage;
    console.log(currentPage, "currentPage");
    // 拉取数据
    let that = this;
    let list = this.data.list;

    wx.cloud.callFunction({
      name: "CampusCircle",
      data: {
        type: "readUser",
        currentPage: currentPage,
        username: args.username
      },
      success(res) {
        console.log(res);
        const currComponent = that.selectComponent(`#waterFlowCards`);
        // 数据存在时
        if (res.result && res.result.data.length > 0) {
          // 页数++
          currComponent.setData({ currentPage: ++currentPage });
          // 添加新数据到 list 里 
          list = list.concat(res.result.data);
          console.log(list, "list");
          that.setData({ list });
          // 数据少于一页时
          if (res.result.data.length < 10) {
            currComponent.setData({
              loadAll: true
            });
          }
          // 新数据进行左右处理
          currComponent.RightLeftSolution()
        } else { // 不存在数据时
          if (currComponent.data.leftH == 0 && currComponent.data.rightH == 0) {
            currComponent.setData({
              leftList: [],
              rightList: [],
            })
          }
          currComponent.setData({
            loadAll: true,
            list: [null]
          });
        }
      },
      fail(res) {
        console.log("请求失败", res)
      }
    })
  },
  init() {
    let list = [];
    this.setData({ list })
  },
  onLoad: function (options) {
    this.init()
    this.onPullDownRefresh()
  },

  // 下拉刷新
  onPullDownRefresh() {
    // 在标题栏中显示加载
    wx.showNavigationBarLoading();
    // 初始化定时器
    clearTimeout(this.TimeOut);
    // 开启动画
    this.setData({
      showLoading: 0,
    })
    // 重置组件内的 currentPage 和 loadAll
    this.selectComponent(`#waterFlowCards`).setData({ currentPage: 0 });
    this.selectComponent(`#waterFlowCards`).setData({ loadAll: false });
    this.TimeOut = setTimeout(() => {
      console.log("下拉刷新")
      this.selectComponent(`#waterFlowCards`).RightLeftSolution(true)
      this.selectComponent(`#waterFlowCards`).getData()
      // 完成停止加载
      wx.hideNavigationBarLoading()
      // 停止动画
      this.setData({
        showLoading: 1
      })
    }, 1000)

  },
  // 上拉触底改变状态
  onReachBottom() {
    console.log(123);
    wx.showLoading({
      title: '加载更多中',
      mask: true
    })
    this.selectComponent(`#waterFlowCards`).getData();
    wx.hideLoading();
  },

})