// const { isGeneratorFunction } = require("util/types")
var util = require("../../../../utils/util.js")
var moreUtil = require("../../utils/utils")
var app = getApp()
Page({
  data: {
    CommentList: [],
    showEdit: false,      // 卡片区删除弹窗
    comEdit: false,       // 评论区复制/删除弹窗
    comReply: false,      //控制评论组件的出现
    inIndex: -1,          //子评论的索引
    Commentindex: -1,     //主评论的索引
    Starurl: "../../../../images/zan1.png",   //不知道这有啥用，注释掉的话会出现：从主页面取消点赞再进入详细页面，详细页面的点赞图标会没有
    sendCom:[]  ,  //接受从replyComment组件传递过来的数组，用于增加评论后的渲染
    isactive:"noactive",
    switch1Checked:false
  },
  switch1Change:function(){
    
    console.log(this.data.switch1Checked)
    this.data.switch1Checked?this.setData({switch1Checked:false}):this.setData({switch1Checked:true})
    this.setData({isactive:this.data.switch1Checked?"active":"noactive"})
    //更新数据库
    wx.cloud.callFunction({
      name:"CampusCircle",
      data:{
        _id: this.data.content._id,
        type:"LoseStateLogs",
        LoseState:this.data.switch1Checked
      },success(res){
        console.log(res)
      }
    })
    // 更新全局
    app.globalData.allList.forEach(item => {
      item.forEach(e => {
        // console.log(e._id)
        console.log(this.data.content._id)
        if (e._id === this.data.content._id) {
          console.log("我是41行")
          e.LoseState = this.data.switch1Checked;
          console.log(e.LoseState)
        }
      })
    })
    console.log(app.globalData.allList)
    
    moreUtil.setAllList(app.globalData.allList,"寻物发布")

    // moreUtil.setAllList(app.globalData.allList,"点赞")

    // beforePage.setAllList(e);
    // this.ShowComment()

    console.log(app.globalData.allList)
  },

  callFunction_New: function (type,be_character,Input) {
    const args = wx.getStorageSync('args')
    var that=this
    let character = { // 处理得到点赞者信息
      userName: args.username,
      iconUrl: args.iconUrl,
      nickName: args.nickName
    }
    wx.cloud.callFunction({
      name: "CampusCircle",
      data: {
        type: type,
        character: character,
        be_character: be_character,
        username: args.username,
        be_username: that.data.content.username,
        content: Input,
        createTime: new Date().getTime(),
        arcticle: that.data.content,
        arcticle_id: that.data.content._id,
        _id: that.data.content._id,
        Star_User: that.data.content.Star_User,
      },
      success(res) {
        console.log(res, "调用评论云函数成功");
      },
      fail(e) {
        if(type === StarControlLogs){
          wx.showToast({
            title: '点赞失败',
            icon: 'none'
          })
        }
      }
    })
  },
  callFunction_Del: function (type,delData) {
    const args = wx.getStorageSync('args')
    var that=this
    var outIndex = that.data.Commentindex
    var inIndex=that.data.inIndex
    wx.cloud.callFunction({
      name: 'NewCampusCircle',
      data: {
        url: 'CommentControl',
        type: type,
        username : args.username,
        _id: that.data.content._id,
        index:outIndex,
        index2:inIndex,
        delData: delData
      },
      success: res => {
        if(type==="delComment" || type==="delReply"){
          var be_character = {
            iconUrl: that.data.content.iconUrl,
            nickName: that.data.content.nickName
          }
          var type2 = 'CancelCommentControlLogs'
          if(inIndex != undefined || inIndex != -1){
            be_character.iconUrl = that.data.CommentList[outIndex].Reply[inIndex].iconUser,
            be_character.nickName = that.data.CommentList[outIndex].Reply[inIndex].nickName
            type2 = 'CancelReplyControlLogs'
            that.data.CommentList[outIndex].Reply.splice(inIndex, 1)
          }else{
            that.data.CommentList.splice(outIndex, 1)
          }
          that.callFunction_New(type2,be_character)
          that.ShowComment()
          // 更新全局
          app.globalData.allList.forEach((item,outIndex) => {
            item.forEach((e,i) => {
              if (e._id === that.data.content._id) {
                e.CommentList.pop()
              }
            })
          })
          // 内外渲染一致
          moreUtil.setAllList(app.globalData.allList,"评论")
        }
      },
      fail: err => {
        console.error
      },
    })
  },
  xx:function(e){         //接受从replyComment组件传递过来的值，控制评论组件出现
    setTimeout(() => {
      this.setData({
        comReply: !e.detail.comReply,
      })
    }, 200);
  },
  hh:function(e){         //接收从replyComment组件传递来的数组，用于渲染
    if(e.detail.CommentList){
      this.data.sendCom=e.detail.CommentList
      this.ShowComment()
    }
  },
  popUp: function () {          //控制卡片/评论弹窗
    var edit_style = 'edit_hide';
    // picker动画样式
    if (edit_style == undefined || edit_style == 'edit_hide') {
      edit_style = 'edit_show'
    } else {
      edit_style = 'edit_hide'
    }
    this.setData({ edit_style })
  },

  More: function () {           //控制卡片
    var showEdit = this.data.showEdit
    this.popUp()
    this.setData({ showEdit: !showEdit })
  },
  
  EditComment: function (e) { // 3-07 重构本函数
    const args = wx.getStorageSync('args')
    let outIndex = e.currentTarget.dataset.bigindex
    let inIndex = e.currentTarget.dataset.small
    var ShowDelCom = 0;
    this.data.Commentindex = outIndex
    this.data.inIndex = inIndex
    this.popUp()
    this.setData({ comEdit: !this.data.comEdit });
    if (outIndex != undefined) {
      if(inIndex === undefined){
        var nickName = this.data.CommentList[outIndex].nickName; // 该评论的评论者
        var username = this.data.CommentList[outIndex].username; // 该评论的评论者学号
        var CommentContent = this.data.CommentList[outIndex].InputComment
      }else{
        var nickName = this.data.CommentList[outIndex].Reply[inIndex].nickName; // 该评论的评论者
        var username = this.data.CommentList[outIndex].Reply[inIndex].username; // 该评论的评论者学号
        var CommentContent = this.data.CommentList[outIndex].Reply[inIndex].InputReply
      }
      // 判断是否本人的评论 -> 凭学号
      if (username === args.username) {
        ShowDelCom = 1;
      }
      this.setData({
        ShowDelCom,
        CommentName: nickName,
        CommentContent: CommentContent,
        isChecked: true,
      })
    }
    outIndex = 0
  },
  ReplyComment: function () {       //控制replyComment组件，并向组件传递数据
      this.popUp()
      this.setData({
        comEdit: false,
      })
      setTimeout(() => {
        this.setData({
          comReply: !this.data.comReply,
          outIndex: this.data.Commentindex,
          inIndex: this.data.inIndex,
          CommentList:this.data.CommentList,
          content:this.data.content
        })
      }, 200);
  },
  
  DelComment: function () {
    const args = wx.getStorageSync('args')
    var outIndex = this.data.Commentindex
    var inIndex=this.data.inIndex
    var that = this
    var delData = that.data.CommentList[outIndex]
    var type1 = 'delComment'
    if(inIndex != undefined && inIndex != -1){
      delData = that.data.CommentList[outIndex].Reply[inIndex]
      type1 = 'delReply'
    }
    wx.showModal({
      title: '提示',
      content: '确定删除?',
      success(res) {
        that.setData({
          ShowDelCom:0
        })
        if (res.confirm) {
          that.callFunction_Del(type1,delData)
          that.setData({
            comEdit: !that.data.comEdit
          })
        } else if (res.cancel) {
          that.setData({ ShowDelCom:1 })
        }
      }
    })
    // that.data.inIndex=-1
  },
  CopyComment: function () {
    wx.setClipboardData({
      //准备复制的数据
      data: this.data.CommentContent,
      success: function (res) {
        wx.showToast({
          title: '复制成功',
        });
      }
    });
    // 改变 edit_style
    this.popUp()
    // 改变 comEdit
    this.setData({
      comEdit: !this.data.comEdit
    })
  },
  //删除
  DelCard: function () {
    var that = this;
    const args = wx.getStorageSync('args');
    wx.showModal({
      title: '提示',
      content: '确定删除?',
      success(res) {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'CampusCircle',
            data: {
              _id: that.data.content._id,
              username: args.username,
              type: 'delCard'
            },
            success: res => {
              that.setData({
                showEdit: !that.data.showEdit
              })
              // 更新全局
              app.globalData.allList.forEach((item,index) => {
                item.forEach((e,i) => {
                  if (e._id === that.data.content._id) {
                    app.globalData.allList[index].splice(i,1);
                  }
                })
              })
              // 内外部渲染一致
              moreUtil.setAllList(app.globalData.allList,"删除卡片")
            },
            fail: err => {
              console.error
              that.setData({
                showEdit: !that.data.showEdit
              })
            },
          })
        }
      }
    })
  },

  // 评论内容判空 返回布尔值：false -> 非空; true -> 空/全是空格
  isNull(str) {
    if (str == "") return true;
    var regu = "^[ ]+$";
    var re = new RegExp(regu);
    return re.test(str);
  },
  ShowComment: function () {
    var Show = []
    console.log(this.data.sendCom)
    if(this.data.sendCom.length!=0){
      this.data.CommentList=this.data.sendCom
    }
    var copyList = JSON.parse(JSON.stringify(this.data.CommentList))
    copyList.forEach(function(item){
      if (item != null) {
        var AftTime = util.timeago(item.CommentTime, 'Y年M月D日')
        if (item.Reply != null) {
          item.Reply.map(function(item2){
            item2.ReplyTime = util.timeago(item2.ReplyTime, 'Y年M月D日')
          })
        }
        Show.push({
          InputContent: item.InputComment,
          InputTime: AftTime,
          Star_User:item.Star_User,
          iconUser: item.iconUser,
          nickName: item.nickName,
          username: item.username,
          Reply: item.Reply
        })
      }
    })
    app.globalData.allList.forEach(e => {
      if (e) {
        if (e._id === this.data.content._id) {
          e.CommentList = this.data.CommentList
        }
      }
    })
    this.setData({
      ShowList: Show,
      CommentNum: this.data.CommentList.length,
    })
    this.data.Commentindex=-1
    this.data.inIndex=-1
  },

  ShowImg: function (e) {
    var Photo = this.data.content.AllPhoto
    var index = e.target.dataset.index
    wx.previewImage({
      current: Photo[index],
      urls: Photo,
    })
  },


  onLoad: function (options) {
    console.log(1111)
    var that = this;
    const args = wx.getStorageSync('args')
    let jsonStr = decodeURIComponent(options.content)

    var content = JSON.parse(jsonStr) // 将JSON帖子信息转成对象
    var more = 0
    this.setData({content,args})

    // 被评论者信息
    if (args.username === content.username) {
      more = 1
    }
    var Time = util.timeago(that.data.content.Time, 'Y年M月D日')
    that.data.username = args.username
    // var openusername = {
    //   username: args.username,
    //   iconUrl: args.iconUrl,
    //   nickName: args.nickName
    // }
    // this.data.Star = content.Star
    // this.data.ContentTime = content.Time
    // this.data.CardID = content._id
    wx.cloud.callFunction({
      name: 'CampusCircle',
      data: {
        username: that.data.username,
        Time: content.Time,
        _id: content._id,
        type: 'readComment'
      },
      success: res => {
        console.log(res)
        this.setData({switch1Checked:res.result.data[0].LoseState})
        this.data.CommentList = res.result.data[0].CommentList
        if (this.data.CommentList) {
          this.setData({
            content: content
          })
          this.ShowComment()
        } else {
          this.data.CommentList = []
          content.CommentList = []
          this.setData({
            CommentNum: 0,
            content: content
          })
        }
      }
    });

    // 判空
    
    this.setData({
      iconUrl: args.iconUrl,
      Time: Time,
      more: more,
    })


    // console.log(content.LoseState)
    // this.setData({switch1Checked:content.LoseState})

  },
  //点赞

  onShow: function () {
    this.ShowComment()
  },

})