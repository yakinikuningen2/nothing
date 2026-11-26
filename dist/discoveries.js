(function(root){
  'use strict';
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // Equal arc-length sampling avoids a slow corner or a fast edge biasing shape tests.
  function resample(points,step=6){
    if(!points.length)return [];
    const out=[points[0]];let carry=0,previous=points[0];
    for(let i=1;i<points.length;i++){
      const end=points[i];let length=distance(previous,end);
      while(carry+length>=step){const t=(step-carry)/length;previous={x:previous.x+(end.x-previous.x)*t,y:previous.y+(end.y-previous.y)*t};out.push(previous);length=distance(previous,end);carry=0;}
      carry+=length;previous=end;
    }
    if(distance(out.at(-1),points.at(-1))>1)out.push(points.at(-1));return out;
  }
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  function simplify(points,tolerance){
    if(points.length<3)return points;
    let far=0,index=0;for(let i=1;i<points.length-1;i++){const d=segmentDistance(points[i],points[0],points.at(-1));if(d>far){far=d;index=i;}}
    return far>tolerance?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[points[0],points.at(-1)];
  }
  function shapes(raw){
    if(raw.length<3||raw.length>3000||raw.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return [];
    let rawLength=0;const span=Math.max(...raw.map(p=>p.x))-Math.min(...raw.map(p=>p.x))+Math.max(...raw.map(p=>p.y))-Math.min(...raw.map(p=>p.y));
    for(let i=1;i<raw.length;i++){rawLength+=distance(raw[i-1],raw[i]);if(rawLength>span*8)return [];}
    const p=resample(raw);if(p.length<20)return [];
    const xs=p.map(v=>v.x),ys=p.map(v=>v.y),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),size=Math.max(w,h);
    if(Math.min(w,h)<75||distance(p[0],p.at(-1))>size*.18)return [];
    const cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;
    const radii=p.map(q=>Math.hypot(q.x-cx,q.y-cy)),radius=radii.reduce((a,b)=>a+b,0)/p.length;
    let angle=0,absolute=0,path=0;
    for(let i=1;i<p.length;i++){let d=Math.atan2(p[i].y-cy,p[i].x-cx)-Math.atan2(p[i-1].y-cy,p[i-1].x-cx);d=Math.atan2(Math.sin(d),Math.cos(d));angle+=d;absolute+=Math.abs(d);path+=distance(p[i],p[i-1]);}
    const error=Math.sqrt(radii.reduce((s,r)=>s+(r-radius)**2,0)/p.length)/radius;
    const circle=w/h>.72&&w/h<1.39&&error<.105&&Math.abs(angle)>Math.PI*1.8&&Math.abs(angle)<Math.PI*2.3&&absolute<Math.PI*2.5&&path/(Math.PI*2*radius)>.85&&path/(Math.PI*2*radius)<1.18;
    // Split the closed polygon at its furthest vertex, then simplify each open half.
    let far=1;for(let i=2;i<p.length;i++)if(distance(p[0],p[i])>distance(p[0],p[far]))far=i;
    let vertices=[...simplify(p.slice(0,far+1),size*.065).slice(0,-1),...simplify(p.slice(far),size*.065).slice(0,-1)];
    let changed=true;while(changed&&vertices.length>3){changed=false;for(let i=0;i<vertices.length;i++)if(segmentDistance(vertices[i],vertices[(i+vertices.length-1)%vertices.length],vertices[(i+1)%vertices.length])<size*.08){vertices.splice(i,1);changed=true;break;}}
    let triangle=false;
    if(vertices.length===3){const [a,b,c]=vertices,area=Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/2,edges=[distance(a,b),distance(b,c),distance(c,a)],perimeter=edges.reduce((a,b)=>a+b,0);triangle=area>w*h*.3&&Math.min(...edges)>size*.3&&path/perimeter<1.18&&p.every(q=>Math.min(segmentDistance(q,a,b),segmentDistance(q,b,c),segmentDistance(q,c,a))<size*.07);}
    return circle?['circle']:triangle?['triangle']:[];
  }
  function cornerAt(x,y,w,h){return (x<w*.15||x>w*.85)&&(y<h*.15||y>h*.85)?(x<w/2?0:1)+(y<h/2?0:2):-1;}
  // Deterministic schedule; positions depend only on the appearance number.
  function dotAt(activeMs,w,h){const slot=Math.floor(activeMs/18000),phase=activeMs%18000;return {visible:phase>=12000&&phase<15500,slot,x:w*(.18+((slot*73+29)%100)/100*.64),y:h*(.22+((slot*47+61)%100)/100*.48)};}
  function createTracker({emit,has=()=>false,getWalk=()=>0,setWalk=()=>{}}){
    let anchor=null,repeated=0,order=0,clicks=[],rush=null,lastMove=null,recent=[],vacation=null,wide=null,small=null;
    const goal=(id)=>{if(!has(id))emit(id);};
    function reset(){anchor=null;repeated=order=0;clicks=[];rush=null;lastMove=null;recent=[];vacation=null;wide=small=null;}
    function activity(now,idle,kind){if(kind==='click'&&idle>=10000&&!has('suddenRush'))rush={at:now,count:0};else if(kind!=='click')rush=null;}
    function click(x,y,w,h,now){
      if(!has('rageClick')){if(!anchor||distance(anchor,{x,y})>15){anchor={x,y};repeated=0;}if(++repeated>=20)goal('rageClick');}
      if(!has('cornerOrder')){const corner=cornerAt(x,y,w,h);if(corner===order){if(++order===4){goal('cornerOrder');order=0;}}else order=corner===0?1:0;}
      if(!has('rapidClick')){clicks=clicks.filter(t=>now-t<=1000);clicks.push(now);if(clicks.length>=8)goal('rapidClick');}
      if(rush){if(now-rush.at>2000)rush=null;else if(++rush.count>=3){goal('suddenRush');rush=null;}}
    }
    // Detect substantial alternating traversals, or tight reversals, independently.
    function oscillate(state,x,y,now,min,max,range,time){
      if(!state||now-state.at>time||Math.abs(y-state.y)>range)return {start:x,extreme:x,y,at:now,dir:0,turns:0};
      if(Math.abs(x-state.start)>range)return {start:x,extreme:x,y,at:now,dir:0,turns:0};
      const dx=x-state.extreme;
      if(!state.dir){if(Math.abs(dx)>=min){state.dir=Math.sign(dx);state.extreme=x;state.turns=1;state.at=now;}}
      else if(dx*state.dir>=0)state.extreme=x;
      else if(Math.abs(dx)>=min){if(Math.abs(dx)>max)return null;state.dir=-state.dir;state.extreme=x;state.turns++;state.at=now;}
      return state;
    }
    function move(x,y,w,h,now){
      if(!Number.isFinite(x)||!Number.isFinite(y)||!(w>0&&h>0)||x<0||y<0||x>w||y>h){lastMove=null;recent=[];vacation=null;wide=small=null;return;}
      const p={x,y,at:now};if(!lastMove){lastMove=p;return;}const dt=now-lastMove.at;if(dt<16)return;
      const previous=lastMove,d=distance(p,previous);lastMove=p;
      if(dt>1000||d>Math.hypot(w,h)*.8||d>Math.max(90,dt*4)){recent=[];vacation=null;wide=small=null;return;}
      if(d<1)return;
      if(!has('mouseWalk')){const total=Math.min(100,getWalk()+d/w);setWalk(total);if(total>=100)goal('mouseWalk');}
      if(!has('mouseVacation')){recent=recent.filter(s=>now-s.at<=3000);recent.push({at:now,d:d/w});if(recent.reduce((n,s)=>n+s.d,0)>=2)vacation=now;else if(vacation!==null)vacation=now;}
      const baseline=()=>({start:previous.x,extreme:previous.x,y:previous.y,at:previous.at,dir:0,turns:0});
      if(!has('sideSteps')){wide=oscillate(wide||baseline(),x,y,now,Math.max(60,w*.18),w,w,700);if(wide?.turns>=20)goal('sideSteps');}
      if(!has('shakyHand')){small=oscillate(small||baseline(),x,y,now,4,28,Math.min(65,w*.16),250);if(small?.turns>=60)goal('shakyHand');}
    }
    function tick(now){if(vacation!==null&&now-vacation>=10000){goal('mouseVacation');vacation=null;}}
    return {activity,click,move,tick,reset,beginTouch(x,y,now){lastMove={x,y,at:now};wide=small=null;}};
  }
  const api={shapes,cornerAt,dotAt,createTracker};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NothingDiscoveries=api;
})(typeof globalThis!=='undefined'?globalThis:this);
