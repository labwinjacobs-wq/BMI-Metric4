const $=s=>document.querySelector(s);
const ACT=[1.2,1.375,1.55,1.725];
const TYPES={lean:{bmi:20,pr:1.4,name:"lean and toned"},balanced:{bmi:21.5,pr:1.0,name:"balanced"},athletic:{bmi:22,pr:1.6,name:"athletic"},strong:{bmi:23,pr:1.8,name:"strong and muscular"}};
const KID={f:[[5,8,1200,1700],[9,13,1400,2100],[14,17,1800,2400]],m:[[5,8,1300,1900],[9,13,1600,2400],[14,17,2000,3000]]};
const SLOTS=[["Breakfast",.25],["Lunch",.30],["Snack",.15],["Dinner",.30]];
/* l: 0 vegan, 1 vegetarian, 2 with eggs, 3 non-veg. k kcal and p protein for one serving */
const MEALS=window.MEALS_DATA;

function calc(i){
  const hm=i.h/100, bmi=i.w/(hm*hm), adult=i.age>=18, senior=i.age>=60;
  const cut=i.asian?{over:23,obese:25}:{over:25,obese:30};
  let cat,key;
  if(!adult){cat="";key="kid"}
  else if(bmi<18.5){cat="underweight";key="under"}
  else if(bmi<cut.over){cat="healthy";key="ok"}
  else if(bmi<cut.obese){cat="overweight";key="over"}
  else{cat="obese";key="obese"}
  const lowW=18.5*hm*hm, highW=(cut.over-.1)*hm*hm;
  const group=i.age<13?"child":i.age<18?"teen":i.age<60?"adult":"senior";
  const R={i,bmi,adult,senior,cut,cat,key,lowW,highW,group,notes:[]};
  let kcal,goal="maintain";
  if(adult){
    const bmr=10*i.w+6.25*i.h-5*i.age+(i.sex==="m"?5:-161);
    R.tdee=bmr*ACT[i.act];
    const T=TYPES[i.bt];
    const minW=Math.ceil(lowW*10)/10, ask=i.gw>0?i.gw:0;
    let tw=ask||T.bmi*hm*hm;
    if(ask){R.custom=true;R.asked=ask;if(tw<minW){tw=minW;R.floored=true}tw=Math.round(tw*10)/10}
    else{tw=Math.max(tw,lowW);tw=Math.round(tw*2)/2}
    R.tw=tw;R.twBmi=tw/(hm*hm);
    const diff=tw-i.w; R.diff=diff;
    if(Math.abs(diff)<1.5)goal="maintain"; else goal=diff<0?"lose":"gain";
    if(goal==="lose"){const d=senior?250:Math.min(500,Math.round(R.tdee*.2));kcal=Math.max(i.sex==="m"?1500:1200,R.tdee-d);R.pace=senior?.25:.45}
    else if(goal==="gain"){kcal=R.tdee+300;R.pace=.25}
    else kcal=R.tdee;
    if(goal!=="maintain")R.weeks=Math.ceil(Math.abs(diff)/R.pace);
    R.rate=senior?Math.max(1.2,T.pr):T.pr;
    R.ref=goal==="lose"?tw:i.w;
  }else{
    const b=KID[i.sex].find(x=>i.age>=x[0]&&i.age<=x[1])||KID[i.sex][0];
    kcal=b[2]+(b[3]-b[2])*i.act/3; R.range=[b[2],b[3]]; R.rate=1.0; R.ref=i.w;
  }
  R.goal=goal; R.kcal=Math.round(kcal/10)*10;
  R.protein=Math.round(R.rate*R.ref);
  R.fat=Math.round(R.kcal*.27/9);
  R.carb=Math.max(0,Math.round((R.kcal-R.protein*4-R.fat*9)/4));
  R.water=Math.max(1.2,Math.round(i.w*.033*10)/10);
  const n=R.notes;
  if(!adult)n.push("Children and teens are still growing. Do not cut calories. Ask your pediatrician to plot BMI on an age and sex growth chart.");
  if(key==="under")n.push("Your BMI is below 18.5. Eat more often, add nuts, nut butters, olive oil, milk, cheese or eggs, and see a doctor to check for a cause.");
  if(adult&&goal==="lose")n.push("Aim for about "+pcs(R.pace)+" a week. Faster loss costs muscle and is harder to keep off.");
  if(adult&&goal==="gain")n.push("Eat a little above your needs and train with weights two or three times a week so the gain is muscle.");
  if(adult&&goal==="maintain")n.push("You are already close to your target. Keep your calories steady and keep moving.");
  if(adult&&(i.bt==="athletic"||i.bt==="strong"))n.push("Muscle weighs more than fat, so the scale may move slowly. Track your waist and your strength too.");
  if(senior)n.push("After 60, protect muscle. Eat protein at every meal and walk daily. Ask your doctor before starting a weight-loss plan.");
  if(adult&&i.bt==="lean"&&key==="ok")n.push("You are already in the healthy range. Going leaner is optional and should never take you below BMI 18.5. If worry about food or weight takes over, speak to a doctor.");
  if(adult&&R.floored)n.push("Your goal of "+wd(R.asked)+" would put you below a BMI of 18.5, so the plan aims for "+wd(R.tw)+", the lowest weight in the healthy range for your height.");
  if(adult&&R.custom&&!R.floored&&R.tw>R.highW)n.push("Your goal is above the healthy range for your height, which tops out near "+wd(R.highW)+". Ask your doctor what is right for you.");
  return R;
}

const f1=x=>(Math.round(x*10)/10).toString();
const LB=2.2046226218,INCH=2.54;
let UNIT="metric";
const cv=kg=>UNIT==="metric"?kg:kg*LB;
const ul=()=>UNIT==="metric"?"kg":"lb";
const wd=kg=>f1(cv(kg))+" "+ul();
const pcs=p=>UNIT==="metric"?p+" kg":f1(p*LB)+" lb";
const num=x=>Math.round(x).toLocaleString();
function renderResult(R,sample){
  const i=R.i; const lo=15,hi=35,span=hi-lo;
  const pos=v=>Math.min(100,Math.max(0,(Math.min(Math.max(v,lo),hi)-lo)/span*100));
  let verdict,bar="";
  if(R.adult){
    verdict='That is <b class="c-'+R.key+'">'+R.cat+'</b>'+(i.asian?' on the Asian scale.':'.');
    const a=pos(18.5),b=pos(R.cut.over),c=pos(R.cut.obese);
    bar='<div class="bar" role="img" aria-label="BMI '+f1(R.bmi)+' on a scale from 15 to 35"><i style="width:'+a+'%;background:var(--b-under)"></i><i style="width:'+(b-a)+'%;background:var(--b-ok)"></i><i style="width:'+(c-b)+'%;background:var(--b-over)"></i><i style="width:'+(100-c)+'%;background:var(--b-obese)"></i><span class="mk" style="left:'+pos(R.bmi)+'%"></span></div><div class="bar-l"><span style="left:0">15</span><span style="left:'+a+'%">18.5</span><span style="left:'+b+'%">'+R.cut.over+'</span><span style="left:'+c+'%">'+R.cut.obese+'</span><span style="left:100%">35</span></div>';
  }else{
    verdict='At your age BMI has to be read on a growth chart, so ask your pediatrician to plot it.';
  }
  let target;
  if(R.adult){
    const pace=pcs(R.pace),dw=wd(Math.abs(R.diff));
    const move=R.goal==="lose"||R.goal==="gain"?'To get there you would '+R.goal+' about <b>'+dw+'</b>, which takes roughly <b>'+R.weeks+' weeks</b> at '+pace+' a week.':'That is close to where you are, so the aim is to hold your weight.';
    const lead=R.custom?'Your goal weight is <b class="n">'+wd(R.tw)+'</b>, a BMI of <b class="n">'+f1(R.twBmi)+'</b>.':'For a <b>'+TYPES[i.bt].name+'</b> build at your height, a good weight is about <b class="n">'+wd(R.tw)+'</b>.';
    const left=R.goal==="maintain"?"Hold steady":(R.goal==="lose"?"Lose ":"Gain ")+dw;
    target='<div class="stats"><div><span>Now</span><b>'+wd(i.w)+'</b></div><div><span>Goal</span><b>'+wd(R.tw)+'</b></div><div><span>To go</span><b>'+left+'</b></div></div><p class="para">'+lead+' The healthy range for your height is '+wd(R.lowW)+' to '+wd(R.highW)+'. '+move+'</p>';
  }else{
    target='<p class="para">Children and teens need about <b class="n">'+num(R.range[0])+' to '+num(R.range[1])+' kcal</b> a day depending on age and activity. The figure below sits inside that range.</p>';
  }
  const rows=[["Energy",num(R.kcal)+" kcal"],["Protein",R.protein+" g"],["Carbohydrate",R.carb+" g"],["Fat",R.fat+" g"],["Water",UNIT==="metric"?R.water+" litres":Math.round(R.water*33.814)+" fl oz"]]
    .map(r=>'<tr><th scope="row">'+r[0]+'</th><td>'+r[1]+'</td></tr>').join("");
  $("#result").innerHTML=
    '<p>Your BMI is</p><div class="bignum n">'+f1(R.bmi)+'</div><p class="verdict">'+verdict+'</p>'+bar+
    (sample?'<p class="sample">These are sample numbers so you can see how the page works. Go to Your details, change the sentence and press Work it out.</p>':'')+
    target+
    '<table class="daily"><caption>What you need each day</caption><tbody>'+rows+'</tbody></table>'+
    '<ul class="notes">'+R.notes.map(t=>'<li>'+t+'</li>').join("")+'</ul>'+
    '<p class="act"><button class="linkbtn" type="button" data-tab="meals">See what to eat</button><button class="linkbtn" type="button" data-tab="details">Change my details</button></p>';
}

let seed=1;
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function renderPlan(R){
  const CH=hs([R.i.diet,R.goal,R.i.act,R.group,R.i.sex,R.i.bt,R.i.asian?1:0,MIX,Math.round(R.kcal/50)].join("|"));
  const r=rng(seed*7919+CH);
  let hasMore=false;$("#mixnv").hidden=R.i.diet<3;if(R.i.diet<3&&MIX==="nonveg"){MIX="bal";markMix()}
  $("#slots").innerHTML=SLOTS.map(([name,share])=>{
    const tgt=R.kcal*share;
    const score=m=>{let x=0;if(MIX==="veg"){if(isVeg(m))x-=2;if(m.l===3)x+=1}if(MIX==="nonveg"&&m.l===3)x-=2;if(MIX==="protein")x-=m.p/m.k*20;return x};
    const allowed=MEALS[name].filter(m=>m.l<=R.i.diet);
    if(3+MORE*3<allowed.length)hasMore=true;
    const pool=allowed.map(m=>[r()+score(m),m]).sort((a,b)=>a[0]-b[0]).slice(0,3+MORE*3).map(x=>x[1]);
    const opts=pool.map(m=>{
      let s=Math.min(2.5,Math.max(.5,tgt/m.k)); s=Math.round(s*4)/4;
      const sv=s===1?"1 serving":s+" servings";
      return '<div class="opt"><div class="t"><i class="dot'+(m.l>=2?' nv':'')+'"></i><span class="nm">'+m.n+'</span></div><div class="m n">'+sv+', '+Math.round(m.k*s)+' kcal, '+Math.round(m.p*s)+' g protein</div></div>';
    }).join("");
    return '<div class="meal"><h3>'+name+'<small class="n">about '+(Math.round(tgt/10)*10)+' kcal</small></h3><div class="opts">'+opts+'</div></div>';
  }).join("");
  $("#moremeals").hidden=!hasMore;$("#lessmeals").hidden=MORE===0;
  const prot=["Beans, lentils, tofu and nuts","Beans, lentils, tofu, yogurt and cheese","Beans, lentils, yogurt, cheese and eggs","Beans, lentils, eggs, fish or poultry"][R.i.diet]+" for protein";
  const more=[prot,"Vegetables and salad filling half the plate","Whole grains: oats, brown rice, quinoa, whole-wheat bread","Fruit, nuts and water between meals"];
  const less=["Fried snacks like chips and fries","Sweets, sugary drinks and packaged juices","White bread, pastries and bakery items","Eating late at night or in front of a screen"];
  if(R.goal==="gain"){more.push("Nuts, nut butters, olive oil and bananas for extra calories");less.pop()}
  if(R.group==="child"||R.group==="teen"){less[2]="Sugary drinks, instant noodles and cookies";more.push(R.i.diet===0?"Fortified plant milk and tofu for strong bones":"Milk, yogurt or cheese for strong bones")}
  if(R.senior){more.push("Calcium and B12 sources: milk, yogurt, eggs, fortified foods")}
  $("#eat").innerHTML='<div><h3>Eat more of</h3><ul>'+more.map(t=>'<li>'+t+'</li>').join("")+'</ul></div><div><h3>Go easy on</h3><ul>'+less.map(t=>'<li>'+t+'</li>').join("")+'</ul></div>';
  document.querySelectorAll("dl.ages>div").forEach(e=>e.classList.toggle("you",e.dataset.g===R.group));
  renderWeek(R,CH);
}

function renderWeek(R,CH){
  const D=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const sc=m=>{let x=0;if(MIX==="veg"){if(isVeg(m))x-=2;if(m.l===3)x+=1}if(MIX==="nonveg"&&m.l===3)x-=2;if(MIX==="protein")x-=m.p/m.k*20;return x};
  const L=SLOTS.map(([n,sh])=>{const o=MEALS[n].filter(m=>m.l<=R.i.diet).map(m=>[sc(m)*1e9+hs(m.n+CH)%1e9,m]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);return{n,t:R.kcal*sh,o,s:hs(n+CH)%Math.max(1,o.length-6)}});
  $("#week").innerHTML='<h2 style="margin-top:48px">Your week of meals</h2><p class="empty" style="max-width:60ch">A full day for each weekday, with no repeats where the menu is big enough. Change any detail and the whole week changes. Menu code '+CH.toString(36).toUpperCase().slice(0,6)+'.</p>'+D.map((d,di)=>{
    let tot=0;
    const rows=L.map(s=>{const m=s.o[(s.s+di)%s.o.length];let k=Math.min(2.5,Math.max(.5,s.t/m.k));k=Math.round(k*4)/4;const kc=Math.round(m.k*k);tot+=kc;
      return '<div class="opt"><div class="t"><i class="dot'+(m.l>=2?' nv':'')+'"></i><span class="nm">'+m.n+'</span></div><div class="m n">'+s.n+', '+(k===1?"1 serving":k+" servings")+', '+kc+' kcal</div></div>'}).join("");
    return '<div class="meal"><h3>'+d+'<small class="n">about '+Math.round(tot/10)*10+' kcal</small></h3><div class="opts">'+rows+'</div></div>'}).join("");
}

let last=null,sample=true;
function read(){
  const m=UNIT==="metric",g=+$("#gw").value,gk=m?g:g/LB;
  const h=m?+$("#h").value:Math.round((+$("#h").value*12+(+$("#hi").value||0))*INCH*10)/10;
  return{age:+$("#age").value,sex:$("#sex").value,h,w:m?+$("#w").value:+$("#w").value/LB,act:+$("#act").value,diet:+$("#diet").value,bt:$("#bt").value,gw:gk>=8&&gk<=250?gk:0,asian:$("#asian").checked};
}
function syncAge(){const a=+$("#age").value;const kid=a>0&&a<18;$("#btline").hidden=kid;$("#gline").hidden=kid;$("#gnote").hidden=kid;$("#kidnote").hidden=!kid}
function run(){
  const i=read();
  const er=$("#err"),bad=!(i.age>=2&&i.age<=110)?"Age needs to be between 2 and 110.":!(i.h>=70&&i.h<=230)?"That height looks off. Check the number and the unit.":!(i.w>=8&&i.w<=250)?"That weight looks off. Check the number and the unit.":"";
  if(er)er.textContent=bad;if(bad)return false;
  syncAge();
  if(i.age<5){
    $("#result").innerHTML='<h2>Under 5 years</h2><p class="para">Toddlers and young children are measured on WHO growth charts and have specific feeding needs, so please ask your pediatrician. This page starts at age 5.</p>';
    $("#slots").innerHTML="";$("#eat").innerHTML="";return;
  }
  last=calc(i); renderResult(last,sample); renderPlan(last);renderWorkout();
  drawLog();drawWater();
}
$("#f").addEventListener("submit",e=>{e.preventDefault();sample=false;if(run()===false){sample=true;return}showTab("numbers");window.scrollTo(0,0)});
$("#age").addEventListener("input",syncAge);
$("#shuffle").addEventListener("click",()=>{seed++;if(last)renderPlan(last)});

/* food mix */
let MIX="bal",MORE=0;
const isVeg=m=>!!m.g||/vegetable|salad|greens|spinach|broccoli|soup|stew|chili|stir-fry|roasted|fruit|carrot|cucumber|berries/i.test(m.n);
function markMix(){document.querySelectorAll("[data-mix]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.mix===MIX))}
document.addEventListener("click",e=>{const b=e.target.closest("[data-mix]");if(b){MIX=b.dataset.mix;MORE=0;markMix();if(last)renderPlan(last)}});
$("#moremeals").addEventListener("click",()=>{MORE++;if(last)renderPlan(last)});
$("#lessmeals").addEventListener("click",()=>{MORE=0;if(last)renderPlan(last)});

/* workout planner */
const EX=window.EX_DATA;
const WKTYPE={full:["Full body",["legs","push","pull","legs","core","push","pull"]],upper:["Upper body",["push","pull","push","pull","push","pull","core"]],lower:["Lower body",["legs","legs","legs","legs","core","legs","core"]],pushd:["Push",["push","push","push","push","push","core"]],pulld:["Pull",["pull","pull","pull","pull","pull","core"]],legsd:["Legs",["legs","legs","legs","legs","core","legs"]]};
const SPLIT={2:["full","full"],3:["full","full","full"],4:["upper","lower","upper","lower"],5:["pushd","pulld","legsd","upper","lower"],6:["pushd","pulld","legsd","pushd","pulld","legsd"]};
const DAYIDX={2:[0,3],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,4,5],6:[0,1,2,3,4,5]};
const DN=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
let WK={goal:null,lvl:"b",days:3,min:45,env:"g"};
try{Object.assign(WK,JSON.parse(localStorage.getItem("bmimetrics-workout")||"{}"))}catch(e){}
if(!DAYIDX[WK.days])WK.days=3;
function saveWK(){try{localStorage.setItem("bmimetrics-workout",JSON.stringify(WK))}catch(e){}}
function wkMonday(){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
let DONE={w:wkMonday(),d:{}};
try{const x=JSON.parse(localStorage.getItem("bmimetrics-wkdone")||"null");if(x&&x.w===DONE.w&&x.d)DONE=x}catch(e){}
function saveDone(){try{localStorage.setItem("bmimetrics-wkdone",JSON.stringify(DONE))}catch(e){}}
const hs=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const ADV=/Barbell|Bulgarian|Romanian|Pike|Hanging/;
let H=0,BT="balanced";
function pickEx(slots,n,env,off,easy){
  const used=new Set(),out=[],cnt={};
  slots.forEach((g,si)=>{
    if(out.length>=n)return;
    let pool=EX[g].filter(e=>e[1].includes(env));const sa=pool.filter(e=>!(easy&&ADV.test(e[0])));if(sa.length>1)pool=sa;pool=pool.slice().sort((a,b)=>hs(a[0]+H+"|"+off)-hs(b[0]+H+"|"+off));const comp=pool.filter(e=>e[2]),iso=pool.filter(e=>!e[2]);
    const ord=si<3?comp.concat(iso):iso.concat(comp),k=cnt[g]||0;
    for(let j=0;j<ord.length;j++){const e=ord[(k+j)%ord.length];if(!used.has(e[0])){used.add(e[0]);out.push(e);break}}
    cnt[g]=k+1;
  });
  return out;
}
function exLine(e,idx,age){
  const comp=e[2],nm=e[0];let sets,reps,rest;
  if(age>=60){sets=idx<2?3:2;reps="10–12";rest="60–90 sec"}
  else if(WK.goal==="lose"){sets=3;reps=comp?"10–15":"12–15";rest="45–60 sec"}
  else if(WK.goal==="muscle"){sets=(WK.lvl==="i"&&idx<2)?4:3;reps=comp?(WK.lvl==="i"?"6–10":"8–12"):"10–15";rest=comp?"90–120 sec":"60 sec"}
  else{sets=3;reps="10–12";rest="60–75 sec"}
  if(age>=18&&age<60&&WK.goal!=="lose"){if(BT==="strong"&&comp){reps="5–8";sets=idx<2?4:3}else if(BT==="lean")reps=comp?"12–15":"15–20";else if(BT==="athletic"&&comp)reps="8–10"}
  if(/Plank|Wall sit|Superman/.test(nm))reps="20–40 sec hold";
  else{reps+=" reps";if(/lunges|Step-ups|split squat|One-arm|Bird dog|Dead bug/.test(nm))reps+=" each side"}
  return '<li>'+nm+'<small class="n">'+sets+' sets × '+reps+', rest '+rest+'</small></li>';
}
function renderWorkout(){
  const C=$("#wkctl"),V=$("#wkadvice"),P=$("#wkplan");
  const age=last?last.i.age:30;
  if(WK.goal===null)WK.goal=last&&last.adult?(last.goal==="lose"?"lose":last.goal==="gain"?"muscle":"fit"):"fit";
  if(age<13){C.innerHTML="";P.innerHTML="";V.innerHTML='<p class="advice">Gym workouts aren’t advised at this age. Aim for about an hour of active play every day, like running, cycling, swimming or sport, and let a pediatrician guide anything more.</p>';return}
  BT=last?last.i.bt:"balanced";H=hs([WK.goal,WK.lvl,WK.days,WK.min,WK.env,age<18?"y":age>=60?"s":"a",last?last.i.sex:"f",BT].join("|"));
  if(DONE.w!==wkMonday())DONE={w:wkMonday(),d:{}};
  const S=(label,key,opts)=>'<div><h3>'+label+'</h3><div class="seg" role="group" aria-label="'+label+'">'+opts.map(o=>'<button type="button" data-wk="'+key+'" data-v="'+o[0]+'" aria-pressed="'+(String(WK[key])===String(o[0]))+'">'+o[1]+'</button>').join("")+'</div></div>';
  C.innerHTML=S("My goal","goal",[["lose","Lose fat"],["muscle","Build muscle"],["fit","Stay fit"]])+S("My level","lvl",[["b","Beginner"],["i","Some experience"]])+S("Days a week","days",[[2,"2"],[3,"3"],[4,"4"],[5,"5"],[6,"6"]])+S("Time per session","min",[[30,"30 min"],[45,"45 min"],[60,"60 min"],[75,"75 min"]])+S("Where I train","env",[["g","Full gym"],["d","Dumbbells at home"],["b","No equipment"]]);
  const rec=Math.min(WK.lvl==="i"?4:3,(age>=60||age<18)?3:9);
  const n=Math.max(3,Math.min(8,Math.floor((WK.min-10-(WK.goal==="lose"?10:0))/8)));
  const gname={lose:"lose fat",muscle:"build muscle",fit:"stay fit"}[WK.goal],lname=WK.lvl==="i"?"has some experience":"is a beginner";
  let a='For someone who '+lname+' and wants to '+gname+', <b>'+rec+' days a week</b> is a strong plan.';
  if(WK.days>rec)a+=' You picked '+WK.days+'. That is a lot, and more is not always better: muscles grow while you rest, and starting too hard is the most common reason people quit. Consider '+rec+' days and walk on the others. <button class="linkbtn" data-usewk="'+rec+'">Use '+rec+' days</button>';
  else if(WK.days<rec)a+=' You picked '+WK.days+'. That still works, especially if you are busy. Make each session count and add a 20–30 minute walk on other days. <button class="linkbtn" data-usewk="'+rec+'">Use '+rec+' days</button>';
  else a+=' You are right on target.';
  const notes=['Each session runs about '+WK.min+' minutes: 5 to warm up, '+n+' exercises'+(WK.goal==="lose"?', 10 of cardio':'')+' and 5 to cool down. A longer session means more exercises, not rushing the rest breaks.'];
  notes.push(WK.goal==="lose"?'Food does most of the work in fat loss. Lifting protects your muscle while the weight comes off, so keep the calories from Your numbers.':WK.goal==="muscle"?'Eat the protein from Your numbers and try to add a little weight or one more rep each week.':'Mix lifting and cardio, and keep it fun enough that you will still do it next month.');
  notes.push(WK.env==="g"?'Ask a gym trainer to check your form in the first session.':WK.env==="d"?'Pick weights where the last 2 reps feel hard but your form stays clean.':'No equipment? Fill a backpack with books for extra weight and lower slowly on each rep.');
  if(age<18)notes.push('Under 18: keep weights light, focus on form, train with a coach or adult if you can, and never test your one-rep max.');
  if(age>=60)notes.push('After 60: move slowly, use light to moderate weights, hold something stable for lunges and step-ups, and check with your doctor before starting.');
  V.innerHTML='<p class="advice">'+a+'</p>'+notes.map(t=>'<p class="advice">'+t+'</p>').join("")+'<p class="note n" style="margin-top:12px">Plan code '+H.toString(36).toUpperCase().slice(0,6)+'. Change your goal, level, days, time, place, age group, sex or body type and you get a different plan.</p>';
  const cio=WK.env==="g"?"treadmill incline walk, bike or cross-trainer":"brisk walk, stair climbing or skipping rope";
  const finish=WK.goal==="lose"?"10 min of "+cio:WK.goal==="fit"?"10 min of easy cardio ("+cio+")":"optional 5 min of easy cardio";
  const sp=(WK.env!=="g"&&WK.days>=5)?(WK.days===5?["upper","lower","full","upper","lower"]:["upper","lower","full","upper","lower","full"]):SPLIT[WK.days];
  const di=DAYIDX[WK.days],cnt={},tot={};sp.forEach(t=>tot[t]=(tot[t]||0)+1);
  const easy=WK.lvl==="b"||age<18||age>=60,CF=WK.env==="g"?["incline treadmill walk","bike intervals, 30 sec hard and 60 sec easy","steady cross-trainer","easy rowing machine"]:["brisk walk","skipping rope, 1 min on and 1 min off","stair climbing","shadow boxing rounds"],FO=["slow 3-second lowering on every rep","a 1-second pause at the hardest point","a steady 2-1-2 tempo","explode up, lower with control","last set to 1–2 reps from failure","stopping every set with 2 clean reps in reserve"],FS=easy?FO.slice(0,3):FO,fin=k=>{const c=CF[hs("c"+H+k)%CF.length];return WK.goal==="lose"?"10 min of "+c:WK.goal==="fit"?"10 min of easy cardio ("+c+")":"optional 5 min of easy cardio"};
  const rows=sp.map((t,k)=>{
    cnt[t]=(cnt[t]||0)+1;const ty=WKTYPE[t],lab=ty[0]+(tot[t]>1?" "+"ABC"[cnt[t]-1]:"");
    const ex=pickEx(ty[1],n,WK.env,k,easy);
    return '<div class="meal"><h3>'+DN[di[k]]+'<small>'+lab+', about '+WK.min+' min</small></h3><div class="opts"><p class="note">Warm-up, 5 min: easy walking or biking, arm circles, bodyweight squats, then one light practice set of your first exercise.</p><ol class="exl">'+ex.map((e,j)=>exLine(e,j,age)).join("")+'</ol><p class="note">Focus today: '+FS[hs("f"+H+k)%FS.length]+'. Finish: '+fin(k)+', then 5 min of stretching.</p><label class="done"><input type="checkbox" data-done="'+k+'"'+(DONE.d[k]?" checked":"")+'> Done this week</label></div></div>';
  }).join("");
  const off=WK.goal==="lose"?"walk 30–45 minutes or aim for 8,000 to 10,000 steps":WK.goal==="muscle"?"rest, stretch or take an easy 20 minute walk, and sleep 7 to 9 hours because that is when you recover":"walk, cycle or swim for 20–30 minutes";
  P.innerHTML=rows+'<div class="meal"><h3>Other days<small>Rest and move</small></h3><div class="opts"><p>On the other days, '+off+'.</p></div></div><p class="fine">This is general guidance, not medical advice. Learn each move slowly, stop if you feel sharp pain, and see a doctor first if you have a heart, joint or blood pressure condition, are pregnant, or have not exercised in a long time.</p>';
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-wk]");
  if(b){const v=b.dataset.v;WK[b.dataset.wk]=/^\d+$/.test(v)?+v:v;saveWK();renderWorkout();return}
  const u=e.target.closest("[data-usewk]");
  if(u){WK.days=+u.dataset.usewk;saveWK();renderWorkout()}
});
document.addEventListener("change",e=>{const c=e.target.closest&&e.target.closest("[data-done]");if(c){if(c.checked)DONE.d[c.dataset.done]=1;else delete DONE.d[c.dataset.done];saveDone()}});

/* water tracker */
const WATERKEY="bmimetrics-water";
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function getWater(){try{const w=JSON.parse(localStorage.getItem(WATERKEY)||"null");if(w&&w.d===todayStr())return w.n|0}catch(e){}return 0}
function setWater(n){try{localStorage.setItem(WATERKEY,JSON.stringify({d:todayStr(),n}))}catch(e){}}
function drawWater(){
  const goal=Math.min(16,Math.max(4,Math.ceil((last&&last.water?last.water:2)*4))),n=Math.min(getWater(),goal);
  $("#wtxt").textContent=n+" of "+goal+" glasses so far today (about 250 ml or 8 fl oz each).";
  let h="";for(let k=1;k<=goal;k++)h+='<button type="button" class="cup" data-cup="'+k+'" aria-label="Glass '+k+'" aria-pressed="'+(k<=n)+'"></button>';
  $("#cups").innerHTML=h;
}
document.addEventListener("click",e=>{const c=e.target.closest("[data-cup]");if(c){const k=+c.dataset.cup;setWater(getWater()===k?k-1:k);drawWater()}});

/* weight log, stored in this browser only */
const KEY="bmimetics-log";
let log=[];
try{log=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){log=[]}
if(!Array.isArray(log))log=[];
log=log.filter(x=>x&&typeof x.d==="string"&&/^\d{4}-\d\d-\d\d$/.test(x.d)&&isFinite(x.w)&&x.w>0);
function save(){try{localStorage.setItem(KEY,JSON.stringify(log))}catch(e){}}
function drawLog(){
  const L=[...log].sort((a,b)=>a.d.localeCompare(b.d)).map(x=>({d:x.d,w:cv(x.w)}));
  $("#entries").innerHTML=L.slice().reverse().map(x=>'<li><span>'+x.d+'</span><span class="n">'+f1(x.w)+' '+ul()+'</span><button type="button" data-d="'+x.d+'">Remove</button></li>').join("");
  const tw=last&&last.tw?cv(last.tw):0;
  if(L.length<2){
    $("#chart").innerHTML='<p class="empty" style="margin-top:16px">Add two or more entries to see your trend'+(tw?' against your target of '+f1(tw)+' '+ul():'')+'.</p>';return;
  }
  const W=720,H=240,pl=44,pr=14,pt=16,pb=30;
  const ws=L.map(x=>x.w).concat(tw?[tw]:[]);
  let mn=Math.floor(Math.min(...ws)-1),mx=Math.ceil(Math.max(...ws)+1);
  const t0=new Date(L[0].d).getTime(),t1=new Date(L[L.length-1].d).getTime(),dt=Math.max(1,t1-t0);
  const X=d=>pl+(new Date(d).getTime()-t0)/dt*(W-pl-pr),Y=v=>pt+(mx-v)/(mx-mn)*(H-pt-pb);
  let g="";
  for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4;g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" style="stroke:var(--line)"/><text x="'+(pl-6)+'" y="'+(Y(v)+4)+'" text-anchor="end" style="fill:var(--muted);font:12px var(--f)">'+Math.round(v)+'</text>'}
  if(tw)g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(tw)+'" y2="'+Y(tw)+'" style="stroke:var(--chilli)" stroke-width="2" stroke-dasharray="6 5"/><text x="'+(W-pr)+'" y="'+(Y(tw)-6)+'" text-anchor="end" style="fill:var(--chilli);font:700 12px var(--f)">Target '+f1(tw)+' '+ul()+'</text>';
  g+='<polyline points="'+L.map(x=>X(x.d)+","+Y(x.w)).join(" ")+'" fill="none" style="stroke:var(--accent)" stroke-width="2.5"/>';
  g+=L.map((x,k)=>'<circle cx="'+X(x.d)+'" cy="'+Y(x.w)+'" r="'+(k===L.length-1?6:3.5)+'" style="fill:var(--accent)"/>').join("");
  g+='<text x="'+pl+'" y="'+(H-8)+'" style="fill:var(--muted);font:12px var(--f)">'+L[0].d+'</text><text x="'+(W-pr)+'" y="'+(H-8)+'" text-anchor="end" style="fill:var(--muted);font:12px var(--f)">'+L[L.length-1].d+'</text>';
  $("#chart").innerHTML='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Weight over time in kilograms">'+g+'</svg>';
}
$("#ladd").addEventListener("click",()=>{
  const d=$("#ld").value,v=+$("#lw").value,w=UNIT==="metric"?v:Math.round(v/LB*1000)/1000;
  if(!d||!(w>=8&&w<=250)){$("#lmsg").textContent="Enter a date and a realistic weight.";return}
  log=log.filter(x=>x.d!==d);log.push({d,w});save();$("#lmsg").textContent="Saved.";$("#lw").value="";drawLog();
});
$("#entries").addEventListener("click",e=>{const d=e.target.dataset&&e.target.dataset.d;if(d){log=log.filter(x=>x.d!==d);save();drawLog()}});
$("#ld").value=new Date().toISOString().slice(0,10);

let SET={theme:"system",unit:"metric"};
try{Object.assign(SET,JSON.parse(localStorage.getItem("bmimetrics-settings")||"{}"))}catch(e){}
function saveSet(){try{localStorage.setItem("bmimetrics-settings",JSON.stringify(SET))}catch(e){}}
function markSet(){
  document.querySelectorAll("[data-set-theme]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setTheme===SET.theme));
  document.querySelectorAll("[data-set-unit]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setUnit===SET.unit));
}
function applyTheme(t){const r=document.documentElement;if(t==="system")r.removeAttribute("data-theme");else r.setAttribute("data-theme",t==="dark"?"dark":"light")}
function setUnit(u){
  if(u===UNIT)return;
  const m0=UNIT==="metric";
  const hOld=m0?+$("#h").value:(+$("#h").value*12+(+$("#hi").value||0))*INCH;
  const wOld=m0?+$("#w").value:+$("#w").value/LB, gOld=m0?+$("#gw").value:+$("#gw").value/LB;
  UNIT=u;const m=u==="metric";
  $("#hu").textContent=m?"cm":"ft";$("#hiw").hidden=m;
  ["#wu","#gwu","#lwu"].forEach(k=>$(k).textContent=ul());
  $("#h").min=m?70:2;$("#h").max=m?230:7;
  ["#w","#gw","#lw"].forEach(k=>{$(k).min=m?8:18;$(k).max=m?250:550});
  if(hOld>0){if(m)$("#h").value=Math.round(hOld);else{const t=Math.round(hOld/INCH);$("#h").value=Math.floor(t/12);$("#hi").value=t%12}}
  const cw=v=>v>0?Math.round((m?v:v*LB)*10)/10:"";
  $("#w").value=cw(wOld);$("#gw").value=cw(gOld);
  $("#lw").value="";
  run();
}
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-set-theme]"),u=e.target.closest("[data-set-unit]");
  if(t){SET.theme=t.dataset.setTheme;applyTheme(SET.theme)}
  else if(u){SET.unit=u.dataset.setUnit;setUnit(SET.unit)}
  else return;
  saveSet();markSet();
});
applyTheme(SET.theme);markSet();
const TABS=["details","numbers","meals","workout","log","ages","account","contact","preferences"];
function showTab(id){
  if(!TABS.includes(id))id="details";
  TABS.forEach(t=>{const on=t===id,b=$("#t-"+t);b.setAttribute("aria-selected",on);b.tabIndex=on?0:-1;$("#p-"+t).hidden=!on});
  if(id==="log"){drawLog();drawWater()}
}
function goTab(id){showTab(id);try{if(location.hash!=="#"+id)location.hash=id}catch(e){}window.scrollTo(0,0)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)goTab(b.dataset.tab)});
$(".tabs").addEventListener("keydown",e=>{
  const k=TABS.findIndex(t=>$("#t-"+t).tabIndex===0);let n;
  if(e.key==="ArrowRight")n=(k+1)%TABS.length;else if(e.key==="ArrowLeft")n=(k+TABS.length-1)%TABS.length;
  else if(e.key==="Home")n=0;else if(e.key==="End")n=TABS.length-1;else return;
  e.preventDefault();goTab(TABS[n]);$("#t-"+TABS[n]).focus();
});
window.addEventListener("hashchange",()=>showTab(location.hash.slice(1)));
if(SET.unit==="imperial")setUnit("imperial");
const AKEY="bmimetrics-account";
function getAcc(){try{const a=JSON.parse(localStorage.getItem(AKEY)||"null");return a&&typeof a==="object"?a:null}catch(e){return null}}
function drawAcc(){const a=getAcc();$("#hello").textContent=a&&a.name?" · Hey, "+a.name:"";if(a&&a.name)$("#an").value=a.name;$("#aout").hidden=!a}
function putDetails(i){const m=UNIT==="metric";$("#age").value=i.age;$("#sex").value=i.sex;$("#act").value=i.act;$("#diet").value=i.diet;$("#bt").value=i.bt;$("#asian").checked=!!i.asian;
  if(m)$("#h").value=Math.round(i.h);else{const t=Math.round(i.h/INCH);$("#h").value=Math.floor(t/12);$("#hi").value=t%12}
  $("#w").value=Math.round((m?i.w:i.w*LB)*10)/10;$("#gw").value=i.gw>0?Math.round((m?i.gw:i.gw*LB)*10)/10:""}
$("#asave").addEventListener("click",()=>{const name=$("#an").value.trim().slice(0,40);if(!name){$("#amsg").textContent="Add your name first.";return}
  try{localStorage.setItem(AKEY,JSON.stringify({name,i:read()}));$("#amsg").textContent="Saved on this device."}catch(e){$("#amsg").textContent="Couldn’t save in this browser."}drawAcc()});
$("#aload").addEventListener("click",()=>{const a=getAcc();if(!a||!a.i){$("#amsg").textContent="Nothing saved yet.";return}putDetails(a.i);sample=false;run();$("#amsg").textContent="Loaded your saved details."});
$("#aout").addEventListener("click",()=>{try{localStorage.removeItem(AKEY)}catch(e){}$("#an").value="";$("#amsg").textContent="Signed out. Saved profile cleared.";drawAcc()});
{const a=getAcc();if(a&&a.i){putDetails(a.i);sample=false}drawAcc()}
run();
showTab(location.hash.slice(1));

/* print: show every plan, then restore the tab you were on */
let _tab;
addEventListener("beforeprint",()=>{_tab=TABS.find(t=>!$("#p-"+t).hidden);["numbers","meals","workout","log"].forEach(t=>$("#p-"+t).hidden=false)});
addEventListener("afterprint",()=>showTab(_tab||"details"));
$("#print").addEventListener("click",()=>window.print());
if("serviceWorker"in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register("sw.js").catch(()=>{});
