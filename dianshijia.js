
/*
更新时间: 2021-03-19 19:20
赞赏:电视家邀请码`893988`,农妇山泉 -> 有点咸，万分感谢
本脚本仅适用于电视家签到，支持Actions多账号运行，请用'#'或者换行隔开‼️
*/
const walkstep = '20000'; //每日步数设置，可设置0-20000
const gametimes = "1999"; //游戏时长
const logs = 0 //响应日志开关,默认关闭
const $ = new Env('电视家')
const notify = $.isNode() ? require('./sendNotify') : '';
let sleeping = "",
    detail = ``,
    subTitle = ``;
let RewardId = $.getdata('REWARD') || '55'; //额外签到奖励，默认55为兑换0.2元额度，44为兑换1天VIP，42为兑换1888金币
const dianshijia_API = 'http://api.gaoqingdianshi.com/api'
let tokenArr = [],
    DsjurlArr = [],
    DrawalArr = [],
    drawalCode = "";
if ($.isNode()) {
    if (process.env.DSJ_HEADERS && process.env.DSJ_HEADERS.indexOf('#') > -1) {
        Dsjheaders = process.env.DSJ_HEADERS.split('#');
        console.log(`您选择的是用"#"隔开\n`)
    } else if (process.env.DSJ_HEADERS && process.env.DSJ_HEADERS.indexOf('\n') > -1) {
        Dsjheaders = process.env.DSJ_HEADERS.split('\n');
        console.log(`您选择的是用换行隔开\n`)
    } else {
        Dsjheaders = process.env.DSJ_HEADERS.split()
    };

    if (process.env.DSJ_DRAWAL && process.env.DSJ_DRAWAL.indexOf('#') > -1) {
        Drawals = process.env.DSJ_DRAWAL.split('#');
    } else if (process.env.DSJ_DRAWAL && process.env.DSJ_DRAWAL.indexOf('\n') > -1) {
        Drawals = process.env.DSJ_DRAWAL.split('\n');
    } else {
        Drawals = process.env.DSJ_DRAWAL.split()
    };
    Object.keys(Dsjheaders).forEach((item) => {
        if (Dsjheaders[item]) {
            tokenArr.push(Dsjheaders[item])
        }
    });
    Object.keys(Drawals).forEach((item) => {
        if (Drawals[item]) {
            DrawalArr.push(Drawals[item])
        }
    });
} else {
    tokenArr.push($.getdata('sy_signheader_dsj'))
    DrawalArr.push($.getdata('drawal_dsj'))
}

if (isGetCookie = typeof $request !== 'undefined') {
    GetCookie();
    $.done()
}

!(async() => {
    if (!tokenArr[0]) {
        $.msg($.name, '【提示】请先获取电视家一cookie')
        return;
    }
    timeZone = new Date().getTimezoneOffset() / 60;  //时区
    timestamp = Date.now() + (8 + timeZone) * 60 * 60*1000;  //时间戳
    bjTime = new Date(timestamp).toLocaleString('zh', {hour12: false,timeZoneName: 'long'}); //标准北京时间
    console.log(`\n === 脚本执行 ${bjTime} ===\n`);
    console.log(`------------- 共${tokenArr.length}个账号`);
   
    for (let i = 0; i < tokenArr.length; i++) {
        if (tokenArr[i]) {
            signheaderVal = tokenArr[i];
            drawalVal = DrawalArr[i];
            $.index = i + 1;
            console.log(`\n\n开始【电视家${$.index}】`)
            await signin(); // 签到
            await signinfo(); // 签到信息
            await Addsign(); // 额外奖励，默认额度
            await run();
            await tasks(); // 任务状态
            await getGametime(); // 游戏时长
            await total(); // 总计
            await cash(); // 现金
            await cashlist(); // 现金列表
            await coinlist(); // 金币列表
            if ($.isNode() && process.env.DSJ_NOTIFY_CONTROL && drawalCode == '0') {
                await notify.sendNotify($.name, subTitle + '\n' + detail)
            }
        }
    }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())

function GetCookie() {
    if ($request && $request.method != 'OPTIONS' && $request.url.match(/\/sign\/signin/)) {
        const signheaderVal = JSON.stringify($request.headers);
        $.log(`signheaderVal:${signheaderVal}`);
        if (signheaderVal) $.setdata(signheaderVal, 'sy_signheader_dsj')
        $.msg($.name, `获取Cookie: 成功`, ``)
    } else if ($request && $request.method != 'OPTIONS' && $request.url.match(/\/cash\/withdrawal/)) {
        const drawalVal = $request.url;
        $.log(`drawalVal:${drawalVal}`);
        if (drawalVal) $.setdata(drawalVal, 'drawal_dsj')
        $.msg($.name, `获取提现地址: 成功`, ``)
    }
}
async function run() {
    if ($.time('HH', timestamp) > 17) {
        await sleep();
        await CarveUp()
    } else if ($.time('HH', timestamp) > 11 && $.time('HH', timestamp) < 14) {
        await getCUpcoin();
        await walk()
    } else if ($.time('HH', timestamp) > 6 && $.time('HH', timestamp) < 9) {
        await wakeup()
    }
}

function signin() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v5/sign/signin?accelerate=0&ext=0&ticket=`,
            headers: JSON.parse(signheaderVal)
        }, async(error, response, data) => {
            if (logs) $.log(`${$.name}, 签到结果: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
                signinres = `签到成功 `
                var h = result.data.reward.length
                if (h > 1) {
                    detail = `【签到收益】` + signinres + `${result.data.reward[0].count}金币，奖励${result.data.reward[1].name} `
                } else {
                    detail = `【签到收益】` + signinres + `+${result.data.reward[0].count}金币 `
                }
            } else if (result.errCode == 4) {
                detail = `【签到结果】 重复 🔁 `
            } else if (result.errCode == 6) {
                subTitle = `【签到结果】 失败`
                detail = `原因: ${result.msg}`
                if ($.isNode()) {
                    await notify.sendNotify($.name, subTitle + '\n' + detail)
                }
                return
            }
            resolve()
        })
    })
}

function signinfo() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v4/sign/get`,
            headers: JSON.parse(signheaderVal)
        }, (error, response, data) => {
            if (logs) $.log(`${$.name}, 签到信息: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
                var d = `${result.data.currentDay}`
                for (l = 0; l < result.data.recentDays.length; l++) {
                    if (d == result.data.recentDays[l].day) {
                        detail += ` 连续签到${d}天\n`
                    }
                }
            }
            resolve()
        })
    })
}

function total() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/coin/info`,
            headers: JSON.parse(signheaderVal)
        }, (error, response, data) => {
            if (logs) $.log(`${$.name}, 总计: ${data}\n`)
            let result = JSON.parse(data)
            subTitle = `待兑换金币: ${result.data.coin} `
            try {
                if (result.data.tempCoin) {
                    for (k = 0; k < result.data.tempCoin.length; k++) {
                        coinid = result.data.tempCoin[k].id
                        $.get({
                            url: `http://api.gaoqingdianshi.com/api/coin/temp/exchange?id=` + coinid,
                            headers: JSON.parse(signheaderVal)
                        }, (error, response, data))
                    }
                }
                resolve()
            } catch (e) {
                console.log(e)
                resolve()
            }
        })
    })
}

function cash() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/cash/info`,
            headers: JSON.parse(signheaderVal)
        }, (error, response, data) => {
            if (logs) $.log(`现金: ${data}\n`)
            let cashresult = JSON.parse(data)
            if (cashresult.errCode == "0") {
                subTitle += '现金:' + cashresult.data.amount / 100 + '元 额度:' + cashresult.data.withdrawalQuota / 100 + '元'
                cashtotal = cashresult.data.totalWithdrawn / 100
            }
            resolve()
        })
    })
}

function cashlist() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/cash/detail`,
            headers: JSON.parse(signheaderVal)
        },async(error, response, data) => {
            let result = JSON.parse(data)
            let totalcash = Number(),
                cashres = "";
            //console.log(`提现列表: ${data}`)
            if (result.errCode == 0) {
                for (s = 0; s < result.data.length; s++) {
                    if (result.data[s].type == '2' && result.data[s].ctime >= parseInt(timestamp/1000)) {
                        cashres = `✅ 今日提现:` + result.data[s].amount / 100 + `元 `
                    }
                }
                if (cashres && cashtotal) {
                    detail += `【提现结果】` + cashres + `共计提现:` + cashtotal + `元\n`
                } else if (!cashres && cashtotal) {
                    detail += `【提现结果】今日未提现 共计提现:` + cashtotal + `元\n`
                   if (!drawalVal) {
                 detail += `【金额提现】❌ 请获取提现地址 \n`
            } else {
                 await Withdrawal()
            }
                }
            } else {
                console.log(`提现列表失败，可忽略: ${data}`)
            }
            resolve()
        })
    })
}

function tasks(tkcode) {
    return new Promise(async(resolve, reject) => {
        let taskcode = ['1M005', '1M002', 'playTask', 'SpWatchVideo', 'Mobilewatchvideo', 'MutilPlatformActive']
        for (code of taskcode) {
            await dotask(code)
        }
        resolve()
    })
}

function dotask(code) {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v4/task/complete?code=${code}`,
            headers: JSON.parse(signheaderVal)
        }, (error, response, data) => {
            let taskres = JSON.parse(data),
                taskcode = taskres.errCode;
            if (taskcode == 0) {
                CompCount = taskres.data.dayCompCount
                CountMax = taskres.data.dayDoCountMax
                console.log('任务代码:' + code + '，获得金币:' + taskres.data.getCoin)
                if (code == 'playTask' && taskres.data.doneStatus == 3) {
                    detail += `【播放任务】🔕 完成/共计 ` + CompCount + `/` + CountMax + ` 次\n`
                }
            } else if (taskcode == '4000') {
                //console.log('任务代码:'+code+'，'+taskres.msg)
            }
            resolve()
        })
    })
}

function walk() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/taskext/getWalk?step=${walkstep}`,
            headers: JSON.parse(signheaderVal)
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`走路任务: ${data}\n`)
            let result = JSON.parse(data)
            if (result.data.unGetCoin > 10) {
                $.get({
                    url: `${dianshijia_API}/taskext/getCoin?code=walk&coin=${result.data.unGetCoin}&ext=1`,
                    headers: JSON.parse(signheaderVal)
                }, (error, response, data) => {})
            }
            resolve()
        })
    })
}

function sleep() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/taskext/getSleep?ext=1`,
            headers: JSON.parse(signheaderVal)
        }
        $.get(url, (error, response, data) => {
            try {
                if (logs) $.log(`睡觉任务: ${data}\n`)
                let sleepres = JSON.parse(data)
                if (sleepres.errCode == 0) {
                    sleeping = sleepres.data.name + '报名成功 🛌'
                } else if (sleepres.errCode == 4006) {
                    sleeping = '睡觉中😴'
                } else {
                    sleeping = ''
                }
                resolve()
            } catch (e) {
                $.msg($.name, `睡觉结果: 失败`, `说明: ${e}`)
            }
            resolve()
        })
    })
}

function wakeup() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/taskext/getCoin?code=sleep&coin=1910&ext=1`,
            headers: JSON.parse(signheaderVal)
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`睡觉打卡: ${data}\n`)
        })
        resolve()
    })
}

function coinlist() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let url = {
                url: `${dianshijia_API}/coin/detail`,
                headers: JSON.parse(signheaderVal)
            }
            $.get(url, (error, response, data) => {
                //console.log(`金币列表: ${data}`)
                let result = JSON.parse(data)
                let onlamount = 0,
                    vdamount = 0,
                    gamestime = 0,
                    todaysign = 0;
                try {

                    for (j = 0; j < result.data.length && result.data[j].ctime >= new Date(new Date(timestamp).toLocaleDateString()).getTime()/1000; j++) {
//$.log(JSON.stringify(result.data,null,2))
                        if (result.data[j].from == "领取走路金币") {
                            detail += `【走路任务】✅ 获得金币` + result.data[j].amount + '\n'
                        }
                        if (result.data[j].from == "领取睡觉金币") {
                            detail += `【睡觉任务】✅ 获得金币` + result.data[j].amount + '\n'
                        }
                        if (result.data[j].from == "手机分享") {
                            detail += `【分享任务】✅ 获得金币` + result.data[j].amount + '\n'
                        }
                        if (result.data[j].from == "双端活跃") {
                            detail += `【双端活跃】✅ 获得金币` + result.data[j].amount + '\n'
                        }
                        if (result.data[j].from == "播放任务") {
                            detail += `【播放任务】✅ 获得金币` + result.data[j].amount + '\n'
                        }
                        if (result.data[j].from == "领取瓜分金币") {
                            detail += `【瓜分金币】✅ 获得金币` + result.data[j].amount + '\n'
                        }
                        if (result.data[j].from == "游戏时长奖励") {
                            gamestime += result.data[j].amount
                        }
                        if (result.data[j].from == "激励视频") {
                            vdamount += result.data[j].amount
                        }
                        if (result.data[j].from == "手机在线") {
                            onlamount += result.data[j].amount
                        }
                        if (result.data[j].from == "签到") {
                            todaysign += result.data[j].amount
                        }
                    }
                    if (todaysign) {
                        detail += `【每日签到】✅ 获得金币` + todaysign + '\n'
                    }
                    if (vdamount) {
                        detail += `【激励视频】✅ 获得金币` + vdamount + '\n'
                    }
                    if (onlamount) {
                        detail += `【手机在线】✅ 获得金币` + onlamount + '\n'
                    }
                    if (gamestime) {
                        detail += `【游戏时长】✅ 获得金币` + gamestime + '\n'
                    }
                    if (j > 0) {
                        detail += `【任务统计】共完成${j+1}次任务🌷`
                    }
                    $.msg($.name + `  ` + sleeping, subTitle, detail)
                } catch (e) {
                    console.log(`获取任务金币列表失败，错误代码${e}+ \n响应数据:${data}`)
                    $.msg($.name + ` 获取金币详情失败 `, subTitle, detail)
                }
                resolve()
            })
        }, 1000)
    })
}

function CarveUp() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v2/taskext/getCarveUp?ext=1`,
            headers: JSON.parse(signheaderVal),
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`瓜分百万金币: ${data}`)
            const result = JSON.parse(data)
            if (result.errCode == 0) {
                detail += `【金币瓜分】✅ 报名成功\n`
            }
            resolve()
        })
    })
}

function getCUpcoin() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/taskext/getCoin?code=carveUp&coin=0&ext=1`,
            headers: JSON.parse(signheaderVal)
        }, (error, response, data) => {
            if (logs) $.log(`瓜分百万金币: ${data}`)
        })
        resolve()
    })
}

function Withdrawal() {
    return new Promise((resolve, reject) => {
        $.get({
            url: drawalVal,
            headers: JSON.parse(signheaderVal)
        }, (error, response, data) => {
            if (logs) $.log(`金币随机兑换 : ${data}\n`)
            let todrawal = JSON.parse(data);
            if (todrawal.errCode == 0) {
                detail += `【金额提现】✅ 到账` + todrawal.data.price / 100 + `元 🌷\n`
                drawalCode = todrawal.errCode
            }
            resolve()
        })
    })
}

function getGametime() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v4/task/complete?code=gameTime&time=${gametimes}`,
            headers: JSON.parse(signheaderVal),
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`游戏时长: ${data}\n`)
        })
        resolve()
    })
}

function Addsign() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/sign/chooseAdditionalReward?rewardId=${RewardId}`,
            headers: JSON.parse(signheaderVal),
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`额外签到: ${data}\n`)
        })
        resolve()
    })
}
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:i,...r}=t;this.got[s](i,r).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

/* ziye 

github地址 https://github.com/ziye11/QCZJSPEED
TG频道地址  https://t.me/ziyescript
TG交流群   https://t.me/joinchat/AAAAAE7XHm-q1-7Np-tF3g
boxjs链接  https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/ziye.boxjs.json

转载请备注个名字，谢谢
⚠️汽车之家极速版

下载地址 http://athm.cn/rUcSMrc 邀请码 99558995


谢谢支持

12.20 优化重写说明,优化时段重写
12.21 修复boxjs配置错误，钱包ck易掉，故去除
12.23 去除14天任务显示，增加惊喜福利，视频，福利视频，福利 4个任务
1.5 取消助力任务显示，可从活动入口进入，然后分享自己的助力，再助力自己获取助力ck
1.9 优化，可固定ck，整合通知为1个，可boxjs或者Secrets 设置提现金额
1.12  修复判定错误
1.13 4个任务失效，故去除,精简ck,只需要5个，无需重新获取，调整提现时间为20点到21点
1.15 修复ck报错问题
1.17 修复任务模块报错导致的 助力问题
1.20 增加提现时间变量
1.21 去除助力任务 名爵5
1.25 修复任务消失后的显示错误

⚠️一共3个位置 5个ck  👉 6条 Secrets 
多账号换行

第一步 添加  hostname=mobile.app.autohome.com.cn,

第二步 添加header重写 

点击 我 获取用户名header
GetUserInfoheaderVal 👉QCZJ_GetUserInfoHEADER

第三步 注释header重写，添加body重写 添加时段body重写  获取完后注释
点击 活动 日常任务 body

taskbodyVal          👉  QCZJ_taskBODY
activitybodyVal      👉  QCZJ_activityBODY

点击 首页>>右上角 获取时段body
addCoinbodyVal       👉  QCZJ_addCoinBODY

断代理 点击>>首页>>右上角>>时段>>点击时段翻倍后  待广告最后几秒时 开代理  获取时段翻倍body
addCoin2bodyVal      👉  QCZJ_addCoin2BODY


设置提现变量 可设置 0.5 2  5 10 20 
CASH  👉  QCZJ_CASH

设置提现时间变量 可设置 0.5 2  5 10 20 
CASHTIME  👉  QCZJ_CASHTIME

⚠️主机名以及重写👇

hostname=mobile.app.autohome.com.cn,
############## 圈x
#汽车之家极速版获取header
https:\/\/(mobile\.app\.autohome\.com\.cn\/*||openapi\.autohome\.com\.cn\/*) url script-request-header https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js

#汽车之家极速版获取body
https:\/\/(mobile\.app\.autohome\.com\.cn\/*||openapi\.autohome\.com\.cn\/*) url script-request-body https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js

#汽车之家极速版获取时段body
http:\/\/mobile\.app\.autohome\.com\.cn\/* url script-request-body https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js



############## loon

#汽车之家极速版获取header
http-request (mobile\.app\.autohome\.com\.cn\/*||openapi\.autohome\.com\.cn\/*) script-path=https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js, requires-header=true, tag=汽车之家极速版获取header

#汽车之家极速版获取body
http-request (mobile\.app\.autohome\.com\.cn\/*||openapi\.autohome\.com\.cn\/*) script-path=https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js,requires-body=true, tag=汽车之家极速版获取body

#汽车之家极速版获取时段body
http-request http:\/\/mobile\.app\.autohome\.com\.cn\/* script-path=https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js, requires-body=true, tag=汽车之家极速版获取时段body

############## surge

#汽车之家极速版获取body
汽车之家极速版获取body = type=http-request,pattern=(mobile\.app\.autohome\.com\.cn\/*||openapi\.autohome\.com\.cn\/*),requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js, script-update-interval=0

#汽车之家极速版获取header
汽车之家极速版获取header = type=http-request,pattern=(mobile\.app\.autohome\.com\.cn\/*||openapi\.autohome\.com\.cn\/*),script-path=https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js, 

#汽车之家极速版获取时段body
汽车之家极速版获取时段body = type=http-request,pattern=http:\/\/mobile\.app\.autohome\.com\.cn\/*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/ziye11/JavaScript/main/Task/qczjspeed.js, script-update-interval=0



*/


const $ = Env("汽车之家极速版");
$.idx = ($.idx = ($.getval('qczjSuffix') || '1') - 1) > 0 ? ($.idx + 1 + '') : ''; // 账号扩展字符
const notify = $.isNode() ? require("./sendNotify") : ``;
const COOKIE = $.isNode() ? require("./qczjspeedCOOKIE") : ``;
const logs = 0; // 0为关闭日志，1为开启
const notifyttt = 1// 0为关闭外部推送，1为12 23 点外部推送
const notifyInterval = 2;// 0为关闭通知，1为所有通知，2为12 23 点通知  ， 3为 6 12 18 23 点通知 

let tz,fx;
$.message = '', COOKIES_SPLIT = '', CASHTIME = '', CASH = '';


const GetUserInfoheaderArr = [];
let GetUserInfoheaderVal = ``;
let middleGetUserInfoHEADER = [];
const taskbodyArr = [];
let taskbodyVal = ``;
let middletaskBODY = [];
const activitybodyArr = [];
let activitybodyVal = ``;
let middleactivityBODY = [];
const addCoinbodyArr = [];
let addCoinbodyVal = ``;
let middleaddCoinBODY = [];
const addCoin2bodyArr = [];
let addCoin2bodyVal = ``;
let middleaddCoin2BODY = [];


//时间
const nowTimes = new Date(
  new Date().getTime() +
  new Date().getTimezoneOffset() * 60 * 1000 +
  8 * 60 * 60 * 1000
);
// 没有设置 QCZJ_CASH 则默认为 0 不提现
if ($.isNode()) {
 CASH = process.env.QCZJ_CASH || 0;
// 没有设置 QCZJ_CASHTIME 则默认为 0点后提现
 CASHTIME = process.env.QCZJ_CASHTIME || 0;
} 
if ($.isNode() && process.env.QCZJ_GetUserInfoHEADER) {
  COOKIES_SPLIT = process.env.COOKIES_SPLIT || "\n";
  console.log(
    `============ cookies分隔符为：${JSON.stringify(
      COOKIES_SPLIT
    )} =============\n`
  );
  if (
    process.env.QCZJ_GetUserInfoHEADER &&
    process.env.QCZJ_GetUserInfoHEADER.indexOf(COOKIES_SPLIT) > -1
  ) {
    middleGetUserInfoHEADER = process.env.QCZJ_GetUserInfoHEADER.split(COOKIES_SPLIT);
  } else {
    middleGetUserInfoHEADER = process.env.QCZJ_GetUserInfoHEADER.split();
  } 
    if (
    process.env.QCZJ_taskBODY &&
    process.env.QCZJ_taskBODY.indexOf(COOKIES_SPLIT) > -1
  ) {
    middletaskBODY = process.env.QCZJ_taskBODY.split(COOKIES_SPLIT);
  } else {
    middletaskBODY = process.env.QCZJ_taskBODY.split();
  }  
    if (
    process.env.QCZJ_activityBODY &&
    process.env.QCZJ_activityBODY.indexOf(COOKIES_SPLIT) > -1
  ) {
    middleactivityBODY = process.env.QCZJ_activityBODY.split(COOKIES_SPLIT);
  } else {
    middleactivityBODY = process.env.QCZJ_activityBODY.split();
  }
    if (
    process.env.QCZJ_addCoinBODY &&
    process.env.QCZJ_addCoinBODY.indexOf(COOKIES_SPLIT) > -1
  ) {
    middleaddCoinBODY = process.env.QCZJ_addCoinBODY.split(COOKIES_SPLIT);
  } else {
    middleaddCoinBODY = process.env.QCZJ_addCoinBODY.split();
  } 
    if (
    process.env.QCZJ_addCoin2BODY &&
    process.env.QCZJ_addCoin2BODY.indexOf(COOKIES_SPLIT) > -1
  ) {
    middleaddCoin2BODY = process.env.QCZJ_addCoin2BODY.split(COOKIES_SPLIT);
  } else {
    middleaddCoin2BODY = process.env.QCZJ_addCoin2BODY.split();
  } 
}
if (COOKIE.GetUserInfoheaderVal) {
  QCZJ_COOKIES = {
"GetUserInfoheaderVal": COOKIE.GetUserInfoheaderVal.split('\n'),
"taskbodyVal": COOKIE.taskbodyVal.split('\n'),
"activitybodyVal": COOKIE.activitybodyVal.split('\n'),
"addCoinbodyVal": COOKIE.addCoinbodyVal.split('\n'),
"addCoin2bodyVal": COOKIE.addCoin2bodyVal.split('\n'),
  }
  Length = QCZJ_COOKIES.GetUserInfoheaderVal.length;
}
if (!COOKIE.GetUserInfoheaderVal) {
if ($.isNode()) {
  Object.keys(middleGetUserInfoHEADER).forEach((item) => {
    if (middleGetUserInfoHEADER[item]) {
      GetUserInfoheaderArr.push(middleGetUserInfoHEADER[item]);
    }
  });  
  Object.keys(middletaskBODY).forEach((item) => {
    if (middletaskBODY[item]) {
      taskbodyArr.push(middletaskBODY[item]);
    }
  });
  Object.keys(middleactivityBODY).forEach((item) => {
    if (middleactivityBODY[item]) {
      activitybodyArr.push(middleactivityBODY[item]);
    }
  });  
  Object.keys(middleaddCoinBODY).forEach((item) => {
    if (middleaddCoinBODY[item]) {
      addCoinbodyArr.push(middleaddCoinBODY[item]);
    }
  });
  Object.keys(middleaddCoin2BODY).forEach((item) => {
    if (middleaddCoin2BODY[item]) {
      addCoin2bodyArr.push(middleaddCoin2BODY[item]);
    }
  });
} else {	
  GetUserInfoheaderArr.push($.getdata("GetUserInfoheader"));  
  taskbodyArr.push($.getdata("taskbody"));
  activitybodyArr.push($.getdata("activitybody"));
  addCoinbodyArr.push($.getdata("addCoinbody"));
  addCoin2bodyArr.push($.getdata("addCoin2body"));    
  // 根据boxjs中设置的额外账号数，添加存在的账号数据进行任务处理
  if ("qczjCASH") {
      CASH = $.getval("qczjCASH") || '0';
    }
if ("qczjCASHTIME") {
      CASHTIME = $.getval("qczjCASHTIME") || '10';
    }	
  let qczjCount = ($.getval('qczjCount') || '1') - 0;
  for (let i = 2; i <= qczjCount; i++) {
    if ($.getdata(`GetUserInfoheader${i}`)) {	
  GetUserInfoheaderArr.push($.getdata(`GetUserInfoheader${i}`));  
  taskbodyArr.push($.getdata(`taskbody${i}`));
  activitybodyArr.push($.getdata(`activitybody${i}`));
  addCoinbodyArr.push($.getdata(`addCoinbody${i}`));
  addCoin2bodyArr.push($.getdata(`addCoin2body${i}`));    
    }
  }
 }
 Length = GetUserInfoheaderArr.length
}
function GetCookie() {
//用户名
if ($request && $request.url.indexOf("GetUserInfo.ashx") >= 0) {
    const GetUserInfoheaderVal = JSON.stringify($request.headers);
    if (GetUserInfoheaderVal) $.setdata(GetUserInfoheaderVal, "GetUserInfoheader" + $.idx);
    $.log(
      `[${$.name + $.idx}] 获取用户名header✅: 成功,GetUserInfoheaderVal: ${GetUserInfoheaderVal}`
    );
    $.msg($.name + $.idx, `获取用户名header: 成功🎉`, ``);
    } 
//日常任务
if ($request && $request.url.indexOf("init") >= 0&& $request.url.indexOf("task") >= 0&&$request.body.indexOf("model=1")>=0) {
    const taskbodyVal = $request.body;
    if (taskbodyVal) $.setdata(taskbodyVal, "taskbody" + $.idx);
    $.log(
      `[${$.name + $.idx}] 获取日常任务body✅: 成功,taskbodyVal: ${taskbodyVal}`
    );
    $.msg($.name + $.idx, `获取日常任务body: 成功🎉`, ``);
    } 
//活动
if ($request && $request.url.indexOf("activity") >= 0&&$request.body.indexOf("pm=1")>=0)  {
    const activitybodyVal = $request.body;
    if (activitybodyVal) $.setdata(activitybodyVal, "activitybody" + $.idx);
    $.log(
      `[${$.name + $.idx}] 获取活动body✅: 成功,activitybodyVal: ${activitybodyVal}`
    );
    $.msg($.name + $.idx, `获取活动body: 成功🎉`, ``);
    } 
//时段任务
 if ($request &&$request.body.indexOf("moreflag=0")>=0 ){
    const addCoinbodyVal = $request.body;
    if (addCoinbodyVal) $.setdata(addCoinbodyVal, "addCoinbody" + $.idx);
    $.log(
      `[${$.name + $.idx}] 获取时段任务body✅: 成功,addCoinbodyVal: ${addCoinbodyVal}`
    );
    $.msg($.name + $.idx, `获取时段任务body: 成功🎉`, ``);
    } 
//时段翻倍
 if ($request &&$request.body.indexOf("moreflag=1")>=0 ){
    const addCoin2bodyVal = $request.body;
    if (addCoin2bodyVal) $.setdata(addCoin2bodyVal, "addCoin2body" + $.idx);
    $.log(
      `[${$.name + $.idx}] 获取时段翻倍body✅: 成功,addCoin2bodyVal: ${addCoin2bodyVal}`
    );
    $.msg($.name + $.idx, `获取时段翻倍body: 成功🎉`, ``);
    } 
}
console.log(
  `================== 脚本执行 - 北京时间(UTC+8)：${new Date(
    new Date().getTime() +
    new Date().getTimezoneOffset() * 60 * 1000 +
    8 * 60 * 60 * 1000
  ).toLocaleString()} =====================\n`
);
console.log(
  `============ 共 ${Length} 个${$.name}账号=============\n`
);
console.log(`============ 提现标准为：${CASH}元 =============\n`);
console.log(`============ 提现时间为：${CASHTIME}点后 =============\n`);
let isGetCookie = typeof $request !== 'undefined'
if (isGetCookie) {
  GetCookie()
  $.done();
} else {
  !(async () => {
    await all();
    await msgShow();
  })()
      .catch((e) => {
        $.log('', `❌ ${O}, 失败! 原因: ${e}!`, '')
      })
      .finally(() => {
        $.done();
      })
}
async function all() {
if (!Length) {
    $.msg(
	$.name, 
	'提示：⚠️请点击前往获取cookie\n', 
	'http://athm.cn/rUcSMrc', 
	{"open-url": "http://athm.cn/rUcSMrc"}
	);
    return;
  }
  for (let i = 0; i < Length; i++) {
	if (COOKIE.GetUserInfoheaderVal) {	
  GetUserInfoheaderVal = QCZJ_COOKIES.GetUserInfoheaderVal[i];
  taskbodyVal = QCZJ_COOKIES.taskbodyVal[i];	  
  activitybodyVal = QCZJ_COOKIES.activitybodyVal[i];
  addCoinbodyVal = QCZJ_COOKIES.addCoinbodyVal[i];
  addCoin2bodyVal = QCZJ_COOKIES.addCoin2bodyVal[i];
    }
    if (!COOKIE.GetUserInfoheaderVal) {
  GetUserInfoheaderVal = GetUserInfoheaderArr[i];  
  taskbodyVal = taskbodyArr[i];	  
  activitybodyVal = activitybodyArr[i];
  addCoinbodyVal = addCoinbodyArr[i];
  addCoin2bodyVal = addCoin2bodyArr[i];
  }
cookie=JSON.parse(GetUserInfoheaderVal)["Cookie"];

let arr=cookie.split(';');
  app_userid=arr.find(item => {   return item.indexOf('app_userid')>-1}).trim().split('=')[1]
  pcpopclub=arr.find(item => {   return item.indexOf('pcpopclub')>-1}).trim().split('=')[1]
  app_sign=arr.find(item => {   return item.indexOf('app_sign')>-1}).trim().split('=')[1]
  app_deviceid=arr.find(item => {   return item.indexOf('app_deviceid')>-1}).trim().split('=')[1]
  sessionid=arr.find(item => {   return item.indexOf('sessionid')>-1})
  if(sessionid){
    sessionid=sessionid.trim().split('=')[1]
  }
ts = Math.round((new Date().getTime() +
    new Date().getTimezoneOffset() * 60 * 1000 +
    8 * 60 * 60 * 1000)/1000).toString();
tts = Math.round(new Date().getTime() +
    new Date().getTimezoneOffset() * 60 * 1000 +
    8 * 60 * 60 * 1000).toString();
  O = (`${$.name + (i + 1)}🔔`);
  await console.log(`-------------------------\n\n🔔开始运行【${$.name+(i+1)}】`) 
      await GetUserInfo();//用户名   
      await coin();//账户信息    
      await task();//日常任务
      await activity();//活动
      await reportAss();//助力任务	  
      await addCoin();//时段任务
      await addCoin2();//时段翻倍
        if (nowTimes.getHours() >= CASHTIME && CASH >= 0.5 && $.coin.result && $.coin.result.nowmoney >= CASH) {
          await cointowallet();//提现
        }
      
  }
}
//通知
function msgShow() {
  return new Promise(async resolve => {
      if (notifyInterval != 1) {
        console.log($.name + '\n' + $.message);
      }
      if (notifyInterval == 1) {
        $.msg($.name, ``, $.message);
      }
      if (notifyInterval == 2 && (nowTimes.getHours() === 12 || nowTimes.getHours() === 23) && (nowTimes.getMinutes() >= 0 && nowTimes.getMinutes() <= 10)) {
        $.msg($.name, ``, $.message);
      }
      if (notifyInterval == 3 && (nowTimes.getHours() === 6 || nowTimes.getHours() === 12 || nowTimes.getHours() === 18 || nowTimes.getHours() === 23) && (nowTimes.getMinutes() >= 0 && nowTimes.getMinutes() <= 10)) {
        $.msg($.name, ``, $.message);
      }
      if (notifyttt == 1 && $.isNode() && (nowTimes.getHours() === 12 || nowTimes.getHours() === 23) && (nowTimes.getMinutes() >= 0 && nowTimes.getMinutes() <= 10))
        await notify.sendNotify($.name, $.message);	
	resolve()
  })
}
//用户名
function GetUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url: `https://mobile.app.autohome.com.cn/speeduser_v1.0.0/user/v2/GetUserInfo.ashx?au=${pcpopclub}&tid=0&p=1&_timestamp=${ts}&u=0&fc=0&v=1.7.0&pm=1&topauid=0&s=4&_sign=${app_sign}&a=18`,
        headers: JSON.parse(GetUserInfoheaderVal),		
      }
      $.get(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 用户名🚩: ${data}`);
          $.GetUserInfo = JSON.parse(data);
$.message +=`\n${O}`;
$.message += `\n========== 【${$.GetUserInfo.result.name}】 ==========\n`;
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//账户信息  
function coin(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
	  let url = {
        url:`https://mobile.app.autohome.com.cn/speedgrow_v1.0.0/taskcenter/init/coin`,        
        headers: JSON.parse(GetUserInfoheaderVal),
		body: activitybodyVal,
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 账户信息🚩: ${data}`);
          $.coin = JSON.parse(data);
 $.message +='【账户信息】：今日金币'+$.coin.result.nowcoin+',账户余额'+$.coin.result.nowmoney+'元'+'\n';
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//日常任务
function task(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url: `https://mobile.app.autohome.com.cn/speedgrow_v1.0.0/taskcenter/init/task`,
        headers: JSON.parse(GetUserInfoheaderVal),
        body: taskbodyVal,
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 日常任务🚩: ${data}`);
          $.task = JSON.parse(data);
	if ($.task.result){	
      fx = $.task.result.list[1].tasklist.find(item => item.title === '分享赚现金');
		if (fx){
  $.message +=  
  '【'+fx.title+'】：奖励'+fx.tiptxt+'，进度'+fx.step+'\n'
	}		
        }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//活动
function activity(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url:`https://mobile.app.autohome.com.cn/speedgrow_v1.0.0/taskcenter/init/activity`,
        headers: JSON.parse(GetUserInfoheaderVal),
		body: activitybodyVal,
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 活动🚩: ${data}`);
          $.activity = JSON.parse(data);
  let activitydex=$.activity.result.list
  if (activitydex[0].data.userstate == 1){
  $.message +='【'+$.activity.result.title+'】：今日已签到,已连续签到'+activitydex[0].data.signdaycount+'天，今日签到奖励'+activitydex[0].data.signlist[activitydex[0].data.signdaycount-1].prize+'金币'+'\n'
        }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//时段任务
function addCoin(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{	 		
      let url = {
        url: `http://mobile.app.autohome.com.cn/fasthome/mainpagecoin/addCoin`,
        headers: JSON.parse(GetUserInfoheaderVal),
		body: addCoinbodyVal,
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 时段任务🚩: ${data}`);
          $.addCoin = JSON.parse(data);
if($.addCoin.returncode==0)
      $.message +='【时段奖励】：成功领取'+$.addCoin.result.getcoinnum+'金币\n';
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//时段翻倍
function addCoin2(timeout = 1000) {
  return new Promise((resolve) => {
    setTimeout( ()=>{	 	  
      let url = {
        url: `http://mobile.app.autohome.com.cn/fasthome/mainpagecoin/addCoin`,
        headers: JSON.parse(GetUserInfoheaderVal),
		body: addCoin2bodyVal,
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 时段翻倍🚩: ${data}`);
          $.addCoin2 = JSON.parse(data);
if($.addCoin2.returncode==0)
       $.message +='【时段翻倍】：成功领取'+$.addCoin2.result.getcoinnum+'金币\n';
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//助力任务
function reportAss(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
		do out = Math.floor(Math.random()*10000000);
        while( out < 10000 )				 	  
	  let body = `_appid=car&taskId=qczjjsb_lb_mglh&userId=${app_userid}&userAssistanceId=${out}&_v=qauto_wxapp1.0&_timestamp=${ts}&_sign=${app_sign}`
header = GetUserInfoheaderVal.replace(/q=1/g, `q=1","Referer":"https://servicewechat.com/wx8ebc8f3586c7321f/160/page-frame.html","Content-Type":"application/x-www-form-urlencoded;charset=utf-8","Host":"openapi.autohome.com.cn`)
      let url = {
        url:`https://openapi.autohome.com.cn/autohome/uc-news-quickappservice/msapi/dealers/reportAss`,
        headers: JSON.parse(header),
		body: body,
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 助力任务🚩: ${data}`);
          $.reportAss = JSON.parse(data);
if($.reportAss.data==0)
  $.message +='【助力任务】：助力成功\n';  
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })	  
    },timeout)
  })
}

//提现
function cointowallet(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
	  let body =`auth=${pcpopclub}&userid=${app_userid}&cashtype=3&coin_amount=${CASH*10000}&validatecode=&faceno=&a=18&pm=1&v=1.7.0&device_id=${app_deviceid}&sessionid=${sessionid}&_timestamp=${tts}`
      let url = {
        url: `https://mobile.app.autohome.com.cn/fasthome/coin/cointowallet`,
        headers: JSON.parse(GetUserInfoheaderVal),
		body: body,
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (logs) $.log(`${O}, 提现🚩: ${data}`);
          $.cointowallet = JSON.parse(data);
if($.cointowallet.returncode==0)
  $.message += `【现金提现】:成功提现${CASH}元\n`;
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log(``,`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,``).trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):``;if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,``):e}catch(t){e=``}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+``).substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((``+e[s]).length)));return t}msg(e=t,s=``,i=``,r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=[``,"==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log(``,`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log(``,`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log(``,`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

