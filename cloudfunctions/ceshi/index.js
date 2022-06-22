const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database()
const _ = db.command


exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  console.log(wxContext);
  const usernameData = (await db.collection("user").where({
    openid: wxContext.OPENID
  }).get()).data[0]

  // usernameData ? delete usernameData.openid : null;
  // let school = usernameData ? usernameData.school : '';
  // let schoolInitData = (await db.collection("schoolLoading").where({
  //   schoolName: school ? school : '广东石油化工学院'
  // }).field({
  //   jsCode: false,
  //   otherPageCode: false,
  // }).get()).data[0]


  return {
    ...usernameData
  }
}