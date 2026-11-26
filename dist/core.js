(function (root) {
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./discoveries.js'):root.NothingDiscoveries;
  // Definition + rule live together. New achievements do not require changing the engine.
  const rows = [
    ['first','最初の接触','クリックする。','input','contact',1,false],
    ['double','念のため、もう一度','ダブルクリックする。','input','double',1,false],
    ['other','裏側からノック','右クリックする。','input','context',2,true],
    ['hold','そこにいて','長押しする。','input','hold',1,false],
    ['drag','何かを引きずった','ドラッグする。','input','drag',1,false],
    ['cross','端から端へ','端から端へなぞる。','input','cross',2,true],
    ['corners','部屋の四隅','画面の隅をめぐる。','discovery','corners',2,true],
    ['center','だいたい、真ん中','タイトル付近に触れる。','discovery','center',1,false],
    ['circle','ないものを囲む','円を描く。','puzzle','circle',3,true],
    ['zigzag','迷いの筆跡','ジグザグに描く。','puzzle','zigzag',2,true],
    ['reverse','行ったり来たり','上下にスクロールする。','input','reverse',2,true],
    ['key','暗闇に一文字','キーを押す。','input','key',1,false],
    ['escape','逃げ場はない','Escapeを押す。','meta','escape',2,true],
    ['sequence','古い記憶','懐かしいコマンドを入力する。','puzzle','sequence',3,true],
    ['title','名前を呼ぶ','タイトルに触れる。','meta','title',1,false],
    ['period','終わりに触れる','句点に触れる。','discovery','period',2,true],
    ['selection','言葉をつかむ','タイトルをつかむ。','discovery','selection',2,true],
    ['dot','小さな存在','小さな点を見つける。','discovery','dot',3,true],
    ['edge','境界線の住人','画面の端に触れる。','discovery','edge',2,true],
    ['two','ひとりで、ふたり','Shiftを押しながらクリックする。','input','two',2,true],
    ['idle10','沈黙のはじまり','少しの間、何もしない。','time','idle10',1,false],
    ['idle45','何もしない才能','じっと待ち続ける。','time','idle45',3,true],
    ['timing','ちょうどいい沈黙','頃合いを見て長押しを離す。','time','timing',3,true],
    ['return','見ていない間に','別のタブから戻る。','meta','return',2,true],
    ['revisit','また、何もない','ゲームを開き直す。','meta','revisit',2,false],
    ['cancel','やっぱり、残す','やり直しを思いとどまる。','meta','cancel',2,true],
    ['settings','暗闇の調整係','設定を開く。','ui','settings',1,false],
    ['motion','静けさを選ぶ','動きの設定を切り替える。','ui','motion',1,false],
    ['selectAll','全部、選んだはずなのに','すべてを選択する。','meta','selectAll',2,true],
    ['list','何がないのか調べる','実績一覧を開く。','ui','list',1,false],
    ['bottom','いちばん下の余白','一覧の余白を調べる。','discovery','bottom',2,true],
    ['locked','まだ名前のないもの','未解除の実績を調べる。','ui','locked',1,false],
    ['rare','珍しいもの好き','稀有な実績を探す。','ui','rare',1,false],
    ['toast','知らせに返事','通知に触れる。','ui','toast',2,true],
    ['toastDrag','知らせを持ち去る','通知か実績カードをドラッグする。','ui','toastDrag',3,true],
    ['catch','逃げる知らせ','逃げる通知を捕まえる。','ui','catch',3,true],
    ['replay','もう一度、驚く','通知をもう一度見る。','meta','replay',1,false],
    ['result','何もなかった証拠','結果を見る。','ui','result',1,false],
    ['copy','言葉だけ持ち帰る','結果の言葉を持ち帰る。','meta','copy',1,false],
    ['resize','部屋のかたち','ウィンドウの大きさを変える。','meta','resize',2,true],
    ['fullscreen','暗闇に入る','全画面に切り替える。','meta','fullscreen',2,false],
    ['undo','戻せないもの','元に戻そうとする。','meta','undo',2,true],
    ['rageClick','虚無への八つ当たり','同じ場所を繰り返しクリックする。','input','rageClick',2,true],
    ['cornerOrder','そこじゃない','左上、右上、左下、右下の順に触れる。','puzzle','cornerOrder',2,true],
    ['rapidClick','連打の達人','素早く連打する。','input','rapidClick',2,true],
    ['suddenRush','急にどうした','何もしない時間のあと、急に連打する。','time','suddenRush',3,true],
    ['mouseWalk','マウスの散歩','カーソルで長い道のりを歩く。','input','mouseWalk',3,true],
    ['triangle','絵心ゼロ','三角形を描く。','puzzle','triangle',3,true],
    ['sideSteps','反復横跳び','左右へ大きく素早く往復する。','input','sideSteps',3,true],
    ['vanishingDot','逃げるな','現れては消える点を捕まえる。','discovery','vanishingDot',3,true],
    ['invisibleButton','存在しないボタン','かすかな印の内側に触れる。','discovery','invisibleButton',3,true],
    ['shakyHand','震える手','狭い範囲で小刻みに左右へ往復する。','input','shakyHand',3,true],
    ['mouseVacation','マウスにも休暇を','よく動かしたカーソルを休ませる。','time','mouseVacation',3,true],
    ['complete','何も、ありました。','すべての実績を見つける。','meta','complete',4,true]
  ];
  const methods = {
  "first": "暗闇の何もない場所をクリックする。",
  "double": "暗闇を素早くダブルクリックする。",
  "other": "暗闇を右クリックする。タッチでは長押しする。",
  "hold": "暗闇の同じ場所をマウスで押し続ける。",
  "drag": "暗闇を押したままマウスを動かす。",
  "cross": "暗闇の左端から右端まで、マウスを離さずにドラッグする。",
  "corners": "暗闇の各隅をそれぞれクリックする。",
  "center": "画面中央の「何もありません。」をクリックする。タイトル周りの暗闇でも達成できる。",
  "circle": "暗闇に大きめの円を描き、描き始めた場所付近まで戻る。",
  "zigzag": "暗闇を押したまま、左右へ何度か折り返す線を描く。",
  "reverse": "暗闇の上でマウスホイールを上下に続けて回す。タッチでは上下になぞる。",
  "key": "暗闇でキーボードの文字キーを押す。タッチでは実績一覧の「キー操作」でAを押す。",
  "escape": "メニューを閉じた状態でEscapeキーを押す。タッチでは実績一覧の「キー操作」でEscを押す。",
  "sequence": "暗闇で ↑ ↑ ↓ ↓ ← → ← → B A の順にキーを押す。タッチでは実績一覧の「キー操作」を使う。",
  "title": "画面中央の「何もありません。」をクリックする。",
  "period": "ゲームタイトルの末尾にある「。」をクリックする。",
  "selection": "タイトルの文字を選択するか、タイトルをマウスで長押しする。別の場所をクリックすると文字選択を解除できる。",
  "dot": "画面の左下寄りにある、小さな灰色の点をクリックする。",
  "edge": "暗闇のきわをクリックする。",
  "two": "Shiftキーを押したまま、暗闇をクリックする。タッチでは指を同時に置く。",
  "idle10": "メニューを閉じてゲームを表示したまま、マウスやキーに触れず少し待つ。",
  "idle45": "ゲームを表示したまま、マウスやキーに触れずしばらく待ち続ける。",
  "timing": "暗闇を長押しし、表示される輪が閉じるころに離す。",
  "return": "別のブラウザタブをしばらく表示してから、ゲームのタブに戻る。",
  "revisit": "プレイしたあと、ページを再読み込みするかゲームを開き直す。",
  "cancel": "設定の「最初からやり直す」を押し、確認画面で「続ける」を選ぶ。",
  "settings": "下部の設定アイコンをクリックする。",
  "motion": "設定を開き、「動きを減らす」を切り替える。",
  "selectAll": "メニューを閉じた暗闇でCtrl+Aを押す。MacではCommand+Aを押す。タッチでは実績一覧の「キー操作」で「すべて選択」を押す。",
  "list": "下部の実績アイコンをクリックする。",
  "bottom": "実績一覧を下までスクロールし、末尾の「＿」をクリックする。",
  "locked": "実績一覧で、まだ解除していない実績カードをクリックする。",
  "rare": "実績一覧の表示フィルターを「稀有」にする。",
  "toast": "表示されている実績解除通知をクリックする。",
  "toastDrag": "実績通知をドラッグする。消えた場合は一覧の「通知を再表示」で出し直すか、解除済みの実績カードをドラッグする。",
  "catch": "実績一覧の「通知を再表示」を押し、逃げる通知をクリックする。動き軽減中はそのままクリックできる。",
  "replay": "設定の「通知をもう一度見る」か、実績一覧の「通知を再表示」を押す。",
  "result": "下部の結果アイコンをクリックする。",
  "copy": "結果の「テキストをコピー」を押す。手動コピー画面が出た場合はコピーして完了ボタンを押す。",
  "resize": "ブラウザのウィンドウの大きさを、はっきり変わる程度に変更する。スマートフォンでは画面を縦横に回す。",
  "fullscreen": "プレイ画面の右上にある全画面アイコンをクリックする。",
  "undo": "メニューを閉じた暗闇でCtrl+Zを押す。MacではCommand+Zを押す。タッチでは実績一覧の「キー操作」で「元に戻す」を押す。",
  "rageClick": "暗闇の同じ場所を繰り返しクリック、またはタップする。離れた場所に触れるとやり直し。",
  "cornerOrder": "暗闇の左上→右上→左下→右下の順にクリック、またはタップする。順番を間違えたら左上から。",
  "rapidClick": "暗闇を素早く連打する。タップでも達成できる。",
  "suddenRush": "何も操作せずに少し待ち、その直後に暗闇を素早く続けてクリック、またはタップする。",
  "mouseWalk": "暗闇の中でマウスをたくさん動かす。タッチでは指でなぞる。移動の進捗は再訪後も残る。",
  "triangle": "暗闇をドラッグ、または指でなぞり、大きめの三角形を閉じるように描く。",
  "sideSteps": "暗闇の中でマウスを左右へ大きく素早く何度も往復させる。指でなぞっても達成できる。",
  "vanishingDot": "暗闇で待つと周期的に現れる点を、消える前にクリック、またはタップする。",
  "invisibleButton": "暗闇の右下寄りにある、かすかな角の印に挟まれた透明な領域をクリック、またはタップする。",
  "shakyHand": "暗闇の狭い範囲で、マウスや指を小刻みに素早く左右へ何度も往復させる。",
  "mouseVacation": "暗闇でマウスや指を大きく素早く動かし、その直後は動かさず少し待つ。",
  "complete": "この実績以外の実績をすべて解除する。"
};
  const rarities = ['','普通','奇妙','稀有','唯一'];
  const achievements = rows.map(([id,name,description,category,event,rarity,hidden]) => Object.freeze({id,name,description,condition:description,method:methods[id],category,event,rarity,rarityName:rarities[rarity],hidden,test:e=>e.type===event && id!=='complete'}));
  const byId = new Map(achievements.map(a=>[a.id,a]));
  const STORAGE_KEY = 'nothing-is-here.v1';
  const defaults = () => ({version:1,unlocked:{},settings:{reduceMotion:false},visits:0,progress:{walkWidths:0}});
  function sanitize(raw) {
    const out = defaults();
    if(!raw || typeof raw!=='object') return out;
    if(raw.unlocked && typeof raw.unlocked==='object') for(const [id,date] of Object.entries(raw.unlocked)) if(byId.has(id) && typeof date==='number' && Number.isFinite(date) && date>0) out.unlocked[id]=date;
    const s=raw.settings||{};
    out.settings={reduceMotion:s.reduceMotion===true};
    out.visits=Number.isSafeInteger(raw.visits)&&raw.visits>=0?raw.visits:0;
    const walk=raw.progress?.walkWidths;out.progress.walkWidths=typeof walk==='number'&&Number.isFinite(walk)?Math.min(100,Math.max(0,walk)):0;
    return out;
  }
  function summary(state) {
    const items=achievements.filter(a=>Object.hasOwn(state.unlocked,a.id));
    const count=items.length;
    return {count,total:achievements.length,percent:Math.round(count/achievements.length*100),remaining:achievements.length-count,title:count===achievements.length?'何もない世界の証人':count>=36?'暗闇の理解者':count>=21?'不在の探究者':count>=11?'違和感の収集家':count>0?'暗闇の訪問者':'まだ、誰でもない',rarest:items.slice().sort((a,b)=>b.rarity-a.rarity)[0]||null};
  }
  function createEngine({storage,now=Date.now,onUnlock=()=>{},onSaveError=()=>{}}={}) {
    let state=defaults(),saveFailed=false;
    try {state=sanitize(JSON.parse(storage?.getItem(STORAGE_KEY)||'null'));} catch {}
    function save(){try{if(!storage)throw Error('No storage');storage.setItem(STORAGE_KEY,JSON.stringify(state));saveFailed=false;}catch{saveFailed=true;onSaveError();}}
    function unlock(a){if(Object.hasOwn(state.unlocked,a.id))return false;state.unlocked[a.id]=Math.max(1,now());save();onUnlock(a,summary(state));return true;}
    function complete(){if(achievements.filter(a=>a.id!=='complete').every(a=>Object.hasOwn(state.unlocked,a.id)))unlock(byId.get('complete'));}
    return {get state(){return state;},get saveFailed(){return saveFailed;},summary:()=>summary(state),dispatch(e){const found=[];for(const a of achievements)if(!Object.hasOwn(state.unlocked,a.id)&&a.test(e,summary(state))&&unlock(a))found.push(a.id);complete();return found;},visit(){const returning=state.visits>0;state.visits++;save();if(returning)this.dispatch({type:'revisit'});complete();},settings(patch){state.settings=sanitize({...state,settings:{...state.settings,...patch}}).settings;save();},reset(){state=defaults();save();},save};
  }
  function analyzeGesture(points,w,h) {
    if(points.length<2)return [];
    const a=points[0],b=points.at(-1),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
    const bw=Math.max(...xs)-Math.min(...xs),bh=Math.max(...ys)-Math.min(...ys);
    let distance=0,turns=0,last=0,angle=0;
    const cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;
    for(let i=1;i<points.length;i++){
      const p=points[i-1],q=points[i];distance+=Math.hypot(q.x-p.x,q.y-p.y);
      const dx=q.x-p.x;if(Math.abs(dx)>8){const d=Math.sign(dx);if(last&&last!==d)turns++;last=d;}
      let delta=Math.atan2(q.y-cy,q.x-cx)-Math.atan2(p.y-cy,p.x-cx);if(delta>Math.PI)delta-=Math.PI*2;if(delta< -Math.PI)delta+=Math.PI*2;angle+=delta;
    }
    const result=[];
    if(distance>=120)result.push('drag');
    if(a.x<w*.12&&b.x>w*.88)result.push('cross');
    if(D.shapes(points).includes('circle'))result.push('circle');
    if(turns>=3&&bw>90&&distance>250)result.push('zigzag');
    if(Math.abs(b.y-a.y)>70&&bh>bw)result.push(b.y>a.y?'swipeDown':'swipeUp');
    return result;
  }
  const api={achievements,byId,STORAGE_KEY,sanitize,summary,createEngine,analyzeGesture};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NothingCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
