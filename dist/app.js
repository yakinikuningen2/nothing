(() => {
  'use strict';
  const C=window.NothingCore,$=s=>document.querySelector(s);
  const world=$('#world'),panel=$('#panel'),detail=$('#detail');
  const developmentMode=window.NothingConfig?.developmentMode===true;
  let lastActivity=performance.now(),hiddenAt=null,activePanel='',currentDetail=null,statusTimer;
  const activeToasts=[];
  let currentFilter='all',runVersion=0;
  let storage;try{storage=window.localStorage;}catch{}
  const engine=C.createEngine({storage,onUnlock:a=>{queueToast(a);updateWorld();},onSaveError:()=>message('この環境では記録を保存できません。ページを閉じると進捗が失われます。',10000)});
  function emit(type){return engine.dispatch({type});}
  function message(text,ms=4000){$('#status').textContent=text;clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('#status').textContent='',ms);}
  const isReduced=()=>engine.state.settings.reduceMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  let immersiveFallback=false,fullscreenBusy=false;
  const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
  function syncFullscreen(){
    const native=!!fullscreenElement(),active=native||immersiveFallback;
    const label=fullscreenBusy?'切り替え中…':native?'全画面を解除':immersiveFallback?'没入表示を解除':'全画面にする';
    document.body.classList.toggle('immersive',active);
    for(const button of document.querySelectorAll('[data-fullscreen]')){
      button.disabled=fullscreenBusy;button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',label);button.setAttribute('title',label);
      if(button.dataset.fullscreen!=='icon')button.textContent=label;
    }
  }
  async function toggleFullscreen(){
    if(fullscreenBusy)return;
    const version=runVersion;
    fullscreenBusy=true;syncFullscreen();
    const wasNative=!!fullscreenElement();
    try{
      if(wasNative){
        const exit=document.exitFullscreen||document.webkitExitFullscreen;
        if(!exit)throw Error('exit unsupported');
        await exit.call(document);immersiveFallback=false;
      }else if(immersiveFallback){
        immersiveFallback=false;
      }else{
        if(panel.open)panel.close();
        const root=document.documentElement;
        const request=typeof root.requestFullscreen==='function'?(document.fullscreenEnabled===false?null:root.requestFullscreen):(document.webkitFullscreenEnabled===false?null:root.webkitRequestFullscreen);
        if(request){await request.call(root);}else{immersiveFallback=true;}
        if(version===runVersion)emit('fullscreen');
        if(immersiveFallback)message('没入表示に切り替えました。',7000);
      }
    }catch{
      if(wasNative){message('全画面を解除できませんでした。ブラウザの解除操作をお使いください。');}
      else{immersiveFallback=true;if(version===runVersion)emit('fullscreen');message('全画面に切り替えられないため、没入表示で続けます。',6000);}
    }finally{
      fullscreenBusy=false;syncFullscreen();updateViewport();$('#fullscreen-toggle').focus();
    }
  }
  function fullscreenChanged(){immersiveFallback=false;syncFullscreen();updateViewport();}
  document.addEventListener('fullscreenchange',fullscreenChanged);
  document.addEventListener('webkitfullscreenchange',fullscreenChanged);
  $('#fullscreen-toggle').onclick=toggleFullscreen;
  syncFullscreen();
  function updateWorld(){
    const s=engine.summary(),st=engine.state.settings;
    document.body.classList.toggle('reduced',st.reduceMotion);
    // Refresh live totals after actions such as copying/saving, without stealing focus.
    if(activePanel==='results'){
      const card=$('.result-card');
      if(card){card.querySelector('.result-score').innerHTML=`${String(s.count).padStart(2,'0')} <small>/ ${s.total}</small>`;card.querySelector('.result-rank').textContent=s.title;const values=card.querySelectorAll('dd');[`${s.percent}%`,String(s.remaining)].forEach((v,i)=>values[i].textContent=v);card.querySelector('.result-rare span').textContent=s.rarest?s.rarest.name+' · '+s.rarest.rarityName:'まだ、何も。';}
    }
    if(activePanel==='achievements'){
      const number=$('.archive-number'),bar=$('.progress-track span');if(number)number.innerHTML=`${s.count} <small>/ ${s.total}</small>`;if(bar)bar.style.width=s.percent+'%';
    }
  }
  function clearToasts(){for(const toast of [...activeToasts])toast.remove();}
  function fitToasts(){
    const limit=innerHeight<500?2:3,available=Math.max(80,(window.visualViewport?.height||innerHeight)-(innerHeight<500?100:160));
    const newest=activeToasts.at(-1);
    function height(){const list=activeToasts.filter(t=>t.el.style.position!=='fixed');return list.reduce((n,t)=>n+t.el.getBoundingClientRect().height,0)+Math.max(0,list.length-1)*10;}
    while(activeToasts.length>limit||height()>available){const oldest=activeToasts.find(t=>t!==newest&&!t.isHeld());if(!oldest)break;oldest.remove();}
  }
  function queueToast(a,replay=false){
    const el=document.createElement('button');
    const flee=replay||a.id==='dot'||a.id==='circle';
    el.className='toast'+(flee?' flee':'');el.setAttribute('aria-label',`実績解除！ ${a.name}。条件：${a.condition} 押したり動かしたりできます`);
    el.innerHTML=`<span class="toast-kicker">${replay?'通知の残響':'実績解除！'}</span><strong>${a.name}</strong><span class="toast-condition">条件：${a.condition}</span><span class="toast-bottom"><span>${a.rarityName}${flee?' · つかまえて':''}</span></span><span class="toast-time"></span>`;
    el.dataset.achievement=a.id;
    let x=0,y=0,down=null,moved=false,escaped=false,timer,closed=false;
    const record={el,remove,isHeld:()=>!!down};
    function remove(){if(closed)return;closed=true;clearTimeout(timer);el.remove();const index=activeToasts.indexOf(record);if(index!==-1)activeToasts.splice(index,1);}
    function schedule(){clearTimeout(timer);el.classList.remove('held');timer=setTimeout(remove,flee?20000:12000);}
    // Keep DOM and visual order identical: the newest discovery is always at the top.
    $('#toast-region').prepend(el);activeToasts.push(record);schedule();
    fitToasts();
    el.addEventListener('pointerenter',e=>{if(flee&&!escaped&&!isReduced()&&e.pointerType==='mouse'&&!down){escaped=true;y=-Math.min(55,Math.max(0,el.getBoundingClientRect().top-12));el.style.transform=`translate(${x}px,${y}px)`;}});
    el.addEventListener('pointerdown',e=>{if(e.button!==0||down)return;clearTimeout(timer);const r=el.getBoundingClientRect();x=0;y=0;down={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,width:r.width,height:r.height};moved=false;el.style.position='fixed';el.style.left=r.left+'px';el.style.top=r.top+'px';el.style.width=r.width+'px';el.style.transform='none';el.style.zIndex='2';el.style.animation='none';el.classList.add('held');el.setPointerCapture(e.pointerId);});
    el.addEventListener('pointermove',e=>{if(!down||down.id!==e.pointerId)return;const d=Math.hypot(e.clientX-down.x,e.clientY-down.y);if(d>10)moved=true;const viewport=window.visualViewport;const top=viewport?.offsetTop||0,height=viewport?.height||innerHeight;x=Math.min(innerWidth-down.left-down.width-10,Math.max(10-down.left,e.clientX-down.x));y=Math.min(top+height-down.top-down.height-10,Math.max(top+10-down.top,e.clientY-down.y));el.style.transform=`translate(${x}px,${y}px)`;if(d>=60)emit('toastDrag');});
    el.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const wasMoved=moved;down=null;if(!wasMoved){emit('toast');if(flee)emit('catch');remove();}else schedule();});
    el.addEventListener('pointercancel',e=>{if(!down||down.id!==e.pointerId)return;down=null;schedule();});
    el.addEventListener('click',e=>{if(e.detail===0){emit('toast');if(flee)emit('catch');remove();}});
  }
  function openPanel(which){
    if(panel.open&&activePanel===which)return;
    activePanel=which;$('#panel-title').textContent={achievements:'実績',settings:'設定',results:'結果'}[which];
    if(which==='achievements')renderArchive();if(which==='settings')renderSettings();if(which==='results')renderResults();
    if(!panel.open)panel.showModal();panel.scrollTop=0;
    const event={achievements:'list',settings:'settings',results:'result'}[which];if(event)emit(event);
    // Opening a panel itself can unlock an achievement; refresh totals without resetting focus later.
    if(which==='achievements')renderArchive();if(which==='results')renderResults();
  }
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.open)));
  $('#close-panel').onclick=()=>panel.close();
  panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
  panel.addEventListener('close',()=>{activePanel='';lastActivity=performance.now();});
  $('#close-detail').onclick=()=>detail.close();
  $('#show-hint').onclick=()=>{if(currentDetail)$('#detail-hint').textContent=currentDetail.condition;};
function renderArchive(){
  const s=engine.summary();$('#panel-content').innerHTML=`<div class="archive-top"><span class="archive-number">${s.count} <small>/ ${s.total}</small></span></div><div class="progress-track"><span style="width:${s.percent}%"></span></div>${developmentMode?'<p class="setting-note dev-note">開発用：達成方法をすべて表示</p>':''}<div class="archive-tools"><button id="archive-replay" class="button">通知を再表示</button><button id="archive-keys" class="button">キー操作</button></div><div class="filters"><select id="rarity-filter" aria-label="実績の表示"><option value="all">すべて</option><option value="unlocked">解除済み</option><option value="locked">未解除</option><option value="rare">稀有</option></select></div><div id="achievement-list"></div><div class="archive-bottom"><button id="bottom-mark" aria-label="余白の印">＿</button></div>`;
  $('#archive-keys').onclick=()=>{panel.close();$('#touch-keys').showModal();};$('#archive-replay').onclick=replayNotification;$('#rarity-filter').value=currentFilter;
  $('#rarity-filter').onchange=e=>{currentFilter=e.target.value;if(currentFilter==='rare')emit('rare');drawCards();};
  $('#bottom-mark').onclick=()=>{emit('bottom');drawCards();};drawCards();
}
function drawCards(){
  const items=C.achievements.filter(a=>{const u=Object.hasOwn(engine.state.unlocked,a.id);return(currentFilter!=='unlocked'||u)&&(currentFilter!=='locked'||!u)&&(currentFilter!=='rare'||a.rarity===3);});
  const list=$('#achievement-list');if(!list)return;list.className=items.length?'achievement-grid':'';list.replaceChildren();
  if(!items.length){const p=document.createElement('p');p.className='empty-state';p.textContent='何も見つかりません。';list.append(p);}
  for(const a of items){
    const u=Object.hasOwn(engine.state.unlocked,a.id),visible=developmentMode||u||!a.hidden,b=document.createElement('button');
    b.className='achievement-card'+(u?'':' locked');b.dataset.achievement=a.id;
    b.innerHTML=`<span class="seal">${u?'◇':'·'}</span><span><strong>${visible?a.name:'???'}</strong><small>${u?a.rarityName:developmentMode||!a.hidden?a.rarityName+' · 未解除':'まだ、名前がありません。'}</small>${developmentMode?`<span class="achievement-condition">達成方法：${a.method}</span>`:u?`<span class="achievement-condition">条件：${a.condition}</span>`:''}</span>`;
    const drag=u?enableCardDrag(b):{didDrag:false};b.onclick=e=>{if(drag.didDrag&&e.detail!==0){drag.didDrag=false;return;}showAchievement(a);};list.append(b);
  }
}
function enableCardDrag(button){
  const state={didDrag:false};let start=null;
  button.classList.add('draggable-card');
  function finish(){start=null;button.style.transform='';button.classList.remove('dragging-card');}
  button.addEventListener('pointerdown',e=>{if(e.button!==0)return;state.didDrag=false;start={id:e.pointerId,x:e.clientX,y:e.clientY,version:runVersion};button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId)return;if(start.version!==runVersion){finish();return;}const dx=e.clientX-start.x,dy=e.clientY-start.y,d=Math.hypot(dx,dy);if(d>10){button.classList.add('dragging-card');button.style.transform=`translate(${Math.max(-100,Math.min(100,dx))}px,${Math.max(-60,Math.min(60,dy))}px)`;}if(d>=60&&!state.didDrag){state.didDrag=true;emit('toastDrag');}});
  button.addEventListener('pointerup',e=>{if(start?.id===e.pointerId)finish();});button.addEventListener('pointercancel',finish);return state;
}
function showAchievement(a){const u=Object.hasOwn(engine.state.unlocked,a.id),visible=developmentMode||u||!a.hidden;currentDetail=a;$('#detail-kicker').textContent=u?a.rarityName:'未解除';$('#detail-title').textContent=visible?a.name:'まだ、名前のないもの';$('#detail-body').textContent=developmentMode?a.method:u||!a.hidden?a.condition:'暗闇のどこかに、きっかけがある。';$('#detail-hint').textContent='';$('#show-hint').classList.toggle('hidden',u||developmentMode);detail.showModal();if(!u)emit('locked');}
  function replayNotification(){emit('replay');clearToasts();queueToast(C.byId.get('catch'),true);panel.close();}
function renderSettings(){
  const st=engine.state.settings;
  $('#panel-content').innerHTML=`<section class="setting-section"><label class="setting-row"><span>動きを減らす</span><input id="reduce" type="checkbox" ${st.reduceMotion?'checked':''}></label></section><section class="setting-section"><button id="replay-toast" class="button">通知をもう一度見る</button></section><section><div class="button-row"><button id="reset-data" class="button danger">最初からやり直す</button></div></section>`;
  $('#reduce').onchange=e=>{engine.settings({reduceMotion:e.target.checked});emit('motion');updateWorld();};
  $('#replay-toast').onclick=replayNotification;
  $('#reset-data').onclick=confirmReset;
}
  function confirmReset(){
    currentDetail=null;let restarted=false;
    $('#detail-kicker').textContent='';$('#detail-title').textContent='最初からやり直しますか？';
    $('#detail-body').textContent='このブラウザの実績・設定を消し、0個から始めます。';$('#detail-hint').textContent='';
    $('#show-hint').classList.remove('hidden');$('#show-hint').textContent='消してやり直す';
    const oldHandler=$('#show-hint').onclick;
    $('#show-hint').onclick=()=>{
      restarted=true;runVersion++;clearTimeout(titleTimer);clearTimeout(resizeTimer);clearGesture();touches.clear();corners.clear();sequence=[];
      lastTap=0;lastTapPoint=null;previousDirection='';lastDirectionAt=0;hiddenAt=null;currentFilter='all';
      engine.reset();discoveries.reset();engine.visit();clearToasts();
      detail.close();panel.close();updateWorld();lastActivity=performance.now();world.focus();message('実績0個から、始めました。');
    };
    $('#close-detail').textContent='続ける';$('#close-detail').onclick=()=>detail.close();
    detail.addEventListener('close',()=>{
      if(!restarted)emit('cancel');$('#show-hint').textContent='ヒントを見る';$('#show-hint').onclick=oldHandler;
      $('#close-detail').textContent='閉じる';$('#close-detail').onclick=()=>detail.close();
    },{once:true});detail.showModal();
  }
  function shareText(includeCopy=false){let state=engine.state;if(includeCopy&&!Object.hasOwn(state.unlocked,'copy')){state={...state,unlocked:{...state.unlocked,copy:1}};if(C.achievements.filter(a=>a.id!=='complete').every(a=>Object.hasOwn(state.unlocked,a.id)))state.unlocked.complete=1;}const s=C.summary(state);return`『何もありません。』\n${s.count}/${s.total} 実績発見\n称号：${s.title}\n最もレアな実績：${s.rarest?s.rarest.name:'まだ、何も。'}\n#何もありません`+(location.protocol.startsWith('http')?'\n'+location.href.split('?')[0].split('#')[0]:'');}
  function renderResults(){const s=engine.summary();$('#panel-content').innerHTML=`<div class="result-card"><div class="result-score">${String(s.count).padStart(2,'0')} <small>/ ${s.total}</small></div><div class="result-rank">${s.title}</div><dl class="result-stats"><div><dt>解除率</dt><dd>${s.percent}%</dd></div><div><dt>まだ見ぬ実績</dt><dd>${s.remaining}</dd></div></dl><p class="result-rare">最もレアな発見<br><span>${s.rarest?s.rarest.name+' · '+s.rarest.rarityName:'まだ、何も。'}</span></p></div><div class="button-row"><button id="share-x" class="button">Xで共有</button><button id="copy-result" class="button">テキストをコピー</button></div><p class="share-note">Xの投稿画面が開きます。投稿はご自身で確定してください。</p><div id="copy-fallback"></div>`;
    $('#copy-result').onclick=copyResult;$('#share-x').onclick=()=>window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText()),'_blank','noopener,noreferrer');
  }
  async function copyResult(){const version=runVersion;try{if(!navigator.clipboard?.writeText)throw Error('manual');await navigator.clipboard.writeText(shareText(true));if(version!==runVersion)return;emit('copy');message('投稿用テキストをコピーしました。');}catch{if(version!==runVersion)return;const host=$('#copy-fallback');host.innerHTML='<textarea id="manual-text" class="manual-copy" aria-label="コピーする結果テキスト" readonly></textarea><div class="button-row"><button id="copied-manually" class="button">コピーしました</button></div><p class="share-note">テキストを選択してコピーし、完了を押してください。</p>';$('#manual-text').value=shareText(true);$('#manual-text').focus();$('#manual-text').select();$('#manual-text').oncopy=()=>{emit('copy');message('投稿用テキストをコピーしました。');};$('#copied-manually').onclick=()=>{emit('copy');message('記録を持ち帰りました。');};}}
  function isNearCenter(clientX,clientY){
    const area=world.getBoundingClientRect(),title=$('#game-title').getBoundingClientRect();
    const x=clientX-area.left,y=clientY-area.top;
    const nearMiddle=Math.abs(x-area.width/2)<=Math.max(72,area.width*.12)&&Math.abs(y-area.height/2)<=Math.max(64,area.height*.12);
    const nearTitle=title.width>0&&title.height>0&&clientX>=title.left-24&&clientX<=title.right+24&&clientY>=title.top-24&&clientY<=title.bottom+24;
    return nearMiddle||nearTitle;
  }
  $('#game-title').onclick=e=>{emit('title');if(e.detail>0&&isNearCenter(e.clientX,e.clientY))emit('center');if(e.target.id==='period')emit('period');};
  let titleTimer;$('#game-title').addEventListener('pointerdown',()=>{titleTimer=setTimeout(()=>emit('selection'),1400);});for(const t of ['pointerup','pointercancel','pointerleave'])$('#game-title').addEventListener(t,()=>clearTimeout(titleTimer));
  function titleIsSelected(selection){
    if(!selection||selection.isCollapsed||!selection.toString().trim())return false;
    const title=$('#game-title');
    if(title.contains(selection.anchorNode)||title.contains(selection.focusNode))return true;
    for(let i=0;i<(selection.rangeCount||0);i++)if(selection.getRangeAt(i).intersectsNode(title))return true;
    return false;
  }
  document.addEventListener('selectionchange',()=>{if(titleIsSelected(window.getSelection()))emit('selection');});
  document.addEventListener('pointerdown',e=>{
    if($('#game-title').contains(e.target))return;
    clearTimeout(titleTimer);const selection=window.getSelection();if(titleIsSelected(selection))selection.removeAllRanges();
  },true);
  $('#game-title').addEventListener('dragstart',e=>e.preventDefault());
  $('#hidden-dot').onclick=()=>emit('dot');
  const corners=new Set();let gesture=null,holdTimer,lastTap=0,lastTapPoint=null,previousDirection='',lastDirectionAt=0;
  const touches=new Set();const interactive=target=>target.closest('button,input,a,select,textarea,dialog');
  world.addEventListener('pointerdown',e=>{
    if(interactive(e.target)||panel.open||detail.open)return;if(e.button!==0)return;
    world.focus({preventScroll:true});
    touches.add(e.pointerId);if(touches.size>=2){emit('two');emit('context');clearGesture();return;}
    emit('contact');if(e.shiftKey)emit('two');
    const r=world.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,w=r.width,h=r.height;
    if(isNearCenter(e.clientX,e.clientY))emit('center');if(Math.min(x,y,w-x,h-y)<=12)emit('edge');
    if((x<w*.15||x>w*.85)&&(y<h*.15||y>h*.85)){corners.add((x<w/2?'l':'r')+(y<h/2?'t':'b'));if(corners.size===4)emit('corners');}
    const now=performance.now();if(now-lastTap<380&&lastTapPoint&&Math.hypot(x-lastTapPoint.x,y-lastTapPoint.y)<40)emit('double');lastTap=now;lastTapPoint={x,y};
    gesture={id:e.pointerId,points:[{x,y}],start:now,x,y,w,h,moved:false};world.setPointerCapture(e.pointerId);
    const ring=$('#hold-ring');ring.style.left=(e.clientX-24)+'px';ring.style.top=(e.clientY-24)+'px';ring.style.display='block';ring.style.setProperty('--sweep','0deg');
    holdTimer=setTimeout(()=>{if(gesture&&!gesture.moved)emit('hold');},1600);
  });
  world.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const r=world.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};if(Math.hypot(p.x-gesture.x,p.y-gesture.y)>15){gesture.moved=true;clearTimeout(holdTimer);$('#hold-ring').style.display='none';}const last=gesture.points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)>5&&gesture.points.length<3000)gesture.points.push(p);if(!isReduced()){$('#trace').style.cssText=`display:block;left:${e.clientX}px;top:${e.clientY}px`;}});
  function direction(d){const now=performance.now();if(previousDirection&&previousDirection!==d&&now-lastDirectionAt<2000)emit('reverse');previousDirection=d;lastDirectionAt=now;}
  function clearGesture(){clearTimeout(holdTimer);gesture=null;$('#hold-ring').style.display='none';$('#trace').style.display='none';}
  world.addEventListener('pointerup',e=>{touches.delete(e.pointerId);if(!gesture||gesture.id!==e.pointerId)return;const g=gesture,elapsed=performance.now()-g.start;if(!g.moved){if(elapsed>=1600)emit('hold');if(elapsed>=2600&&elapsed<=3400)emit('timing');}for(const t of C.analyzeGesture(g.points,g.w,g.h)){if(t.startsWith('swipe'))direction(t==='swipeUp'?'up':'down');else emit(t);}clearGesture();});
  world.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);clearGesture();});
  world.addEventListener('contextmenu',e=>{e.preventDefault();if(!interactive(e.target)&&!panel.open&&!detail.open)emit('context');});
  world.addEventListener('wheel',e=>{if(!interactive(e.target)&&e.deltaY)direction(e.deltaY>0?'down':'up');},{passive:true});
  let sequence=[];const targetSequence=['↑','↑','↓','↓','←','→','←','→','B','A'];
  function handleKey(key){const k=({ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'}[key]||key).toUpperCase();emit('key');if(k==='ESCAPE')emit('escape');sequence.push(k);sequence=sequence.slice(-10);if(sequence.join(',')===targetSequence.join(','))emit('sequence');}
  document.addEventListener('keydown',e=>{
    if(e.isComposing)return;
    if(e.target.matches('input,textarea,select'))return;
    if(e.ctrlKey||e.metaKey){if(!panel.open&&!detail.open&&!e.altKey&&!e.shiftKey){const key=e.key.toLowerCase();if(key==='a')emit('selectAll');if(key==='z'){e.preventDefault();emit('undo');}}return;}
    if(e.altKey)return;
    if(e.key==='Escape'&&(panel.open||detail.open))return;
    if(e.key==='Escape'&&immersiveFallback){immersiveFallback=false;syncFullscreen();updateViewport();}
    if(e.key.length===1||['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','Backspace'].includes(e.key)){handleKey(e.key);if(!panel.open&&!detail.open&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();}
  });
  for(const ev of ['pointerdown','pointermove','keydown','wheel','input'])document.addEventListener(ev,()=>{lastActivity=performance.now();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=Date.now();clearGesture();touches.clear();}else{if(hiddenAt&&Date.now()-hiddenAt>=5000)emit('return');hiddenAt=null;lastActivity=performance.now();}});
  window.addEventListener('blur',()=>{clearGesture();touches.clear();});
  function updateViewport(){const v=window.visualViewport;document.documentElement.style.setProperty('--view-height',(v?.height||innerHeight)+'px');document.documentElement.style.setProperty('--view-top',(v?.offsetTop||0)+'px');document.body.classList.toggle('keyboard-open',!!v&&innerHeight-v.height>120);fitToasts();}
  updateViewport();window.visualViewport?.addEventListener('resize',updateViewport);window.visualViewport?.addEventListener('scroll',updateViewport);
  const initialSize={w:innerWidth,h:innerHeight};let resizeTimer;window.addEventListener('resize',()=>{updateViewport();clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!document.body.classList.contains('keyboard-open')&&(Math.abs(innerWidth-initialSize.w)>80||Math.abs(innerHeight-initialSize.h)>80))emit('resize');},300);});
  setInterval(()=>{if(document.hidden||panel.open||detail.open)return;const idle=performance.now()-lastActivity;if(idle>=10000)emit('idle10');if(idle>=45000)emit('idle45');if(gesture&&!gesture.moved)$('#hold-ring').style.setProperty('--sweep',Math.min(360,(performance.now()-gesture.start)/3000*360)+'deg');},80);
  // Keep time feedback running during a press, even though a press counts as activity.
  window.addEventListener('pagehide',()=>engine.save());
  const discoveries=window.NothingDiscoveriesUI.install({engine,emit,isReduced,getLastActivity:()=>lastActivity,handleKey});
  engine.visit();updateWorld();
})();
