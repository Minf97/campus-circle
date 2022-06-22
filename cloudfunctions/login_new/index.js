const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database()

exports.main = async (event) => {

  const wxContext = cloud.getWXContext()


  const isHave = (await db.collection("user").where({
    openid: wxContext.OPENID
  }).get()).data.length

  console.log(wxContext.OPENID, isHave)
  if (isHave === 0) {
    // 新增
    return await db.collection('user').add({
      data: {
        openid: wxContext.OPENID,
        username: event.username,
        password: event.password,
        school: event.school,
        iconUrl: event.iconUrl,
        nickName: event.nickName
      }
    })
  } else {
    // 更新
    return await db.collection('user').where({
      openid: wxContext.OPENID
    }).update({
      data: {
        username: event.username,
        password: event.password,
        school: event.school,
        iconUrl: event.iconUrl,
        nickName: event.nickName
      }
    })
  }

}