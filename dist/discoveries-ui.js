(function(root){
  'use strict';
  function install({engine,emit,isReduced,getLastActivity,handleKey}){
    const D=root.NothingDiscoveries,$=s=>document.querySelector(s),world=$('#world');
    const point=$('#vanishing-dot'),hit=$('#invisible-button'),keys=$('#touch-keys');
    let pending=null,longTimer,activeTime=0,lastTick=performance.now(),lastSave=lastTick,dirty=false,shownSlot=-1;
    const unlocked=id=>Object.hasOwn(engine.state.unlocked,id);
    const tracker=D.createTracker({emit,has:unlocked,getWalk:()=>engine.state.progress.walkWidths,setWalk:value=>{engine.state.progress.walkWidths=value;dirty=true;}});
    const ordinaryUI=target=>target.closest('button,input,a,select,textarea,dialog');
    const modalOpen=()=>$('#panel').open||$('#detail').open||keys.open;
    const playing=()=>!document.hidden&&!modalOpen();
    function save(){if(dirty){engine.save();dirty=false;}lastSave=performance.now();}
    function pause(){tracker.reset();pending=null;clearTimeout(longTimer);point.classList.add('hidden');}
    $('#close-keys').onclick=()=>keys.close();
    keys.addEventListener('close',()=>{pause();lastTick=performance.now();});
    document.querySelectorAll('[data-virtual-key]').forEach(button=>button.onclick=()=>{
      const key=button.dataset.virtualKey;
      if(key==='selectAll'||key==='undo')emit(key);else handleKey(key);
    });
    hit.onclick=()=>{if(playing())emit('invisibleButton');};
    point.onclick=()=>{
      const p=D.dotAt(activeTime,innerWidth,innerHeight);
      if(playing()&&p.visible&&shownSlot===p.slot&&!point.classList.contains('hidden')){emit('vanishingDot');point.classList.add('hidden');}
    };
    world.addEventListener('pointerdown',e=>{
      if(!playing()||ordinaryUI(e.target)||e.button!==0)return;
      if(pending){pending=null;clearTimeout(longTimer);tracker.reset();return;}
      const now=performance.now();
      pending={id:e.pointerId,x:e.clientX,y:e.clientY,start:now,idle:now-getLastActivity(),moved:false,points:[{x:e.clientX,y:e.clientY}]};
      if(e.pointerType==='touch'){const r=world.getBoundingClientRect();tracker.beginTouch(e.clientX-r.left,e.clientY-r.top,now);}
      if(e.pointerType==='touch')longTimer=setTimeout(()=>{if(pending&&!pending.moved)emit('context');},1800);
    });
    world.addEventListener('pointermove',e=>{
      if(!playing()||ordinaryUI(e.target))return;
      if(e.pointerType==='touch'&&!pending)return;
      const r=world.getBoundingClientRect(),now=performance.now();tracker.move(e.clientX-r.left,e.clientY-r.top,r.width,r.height,now);
      if(pending&&pending.id===e.pointerId){
        if(Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>15){pending.moved=true;clearTimeout(longTimer);}
        if(pending.points.length<3000&&Math.hypot(e.clientX-pending.points.at(-1).x,e.clientY-pending.points.at(-1).y)>5)pending.points.push({x:e.clientX,y:e.clientY});
      }
    });
    world.addEventListener('pointerup',e=>{
      clearTimeout(longTimer);if(!pending||pending.id!==e.pointerId)return;
      const p=pending;pending=null;if(!playing())return;
      const now=performance.now(),r=world.getBoundingClientRect();
      if(!p.moved&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<=15&&now-p.start<1000){tracker.activity(now,p.idle,'click');tracker.click(e.clientX-r.left,e.clientY-r.top,r.width,r.height,now);}
      if(p.moved&&!unlocked('triangle')&&D.shapes(p.points).includes('triangle'))emit('triangle');
    });
    world.addEventListener('pointercancel',pause);
    world.addEventListener('pointerleave',()=>{if(!pending)tracker.reset();});
    // Any real input is shared with the base game's idle clock. UI input resets combos.
    for(const ev of ['pointerdown','pointermove','keydown','wheel','input'])document.addEventListener(ev,e=>{
      if(ev!=='pointerdown'||ordinaryUI(e.target)||!playing())tracker.activity(performance.now(),0,'other');
      if(modalOpen()||document.hidden)pause();
    },{passive:true});
    function suspend(){save();pause();lastTick=performance.now();}
    document.addEventListener('visibilitychange',suspend);root.addEventListener('blur',suspend);root.addEventListener('pagehide',save);
    root.addEventListener('resize',()=>{pause();lastTick=performance.now();});
    setInterval(()=>{
      const now=performance.now(),delta=now-lastTick;lastTick=now;
      if(!playing()){pause();return;}
      // Ignore long scheduler stalls as well as hidden-tab time.
      if(delta<500)activeTime+=Math.max(0,delta);
      tracker.tick(now);
      const p=D.dotAt(activeTime,innerWidth,innerHeight),visible=p.visible&&!unlocked('vanishingDot');
      if(visible){shownSlot=p.slot;point.style.left=p.x+'px';point.style.top=p.y+'px';}
      point.classList.toggle('hidden',!visible);
      if(dirty&&now-lastSave>=2000)save();
    },80);
    return {reset(){pause();if(keys.open)keys.close();activeTime=0;shownSlot=-1;lastTick=lastSave=performance.now();dirty=false;}};
  }
  root.NothingDiscoveriesUI={install};
})(typeof globalThis!=='undefined'?globalThis:this);
