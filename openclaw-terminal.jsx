import { useState, useEffect, useRef } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const rand = (a, b) => Math.random() * (b - a) + a;
const ri = (a, b) => Math.floor(rand(a, b));
const pick = arr => arr[ri(0, arr.length)];
const p2 = n => String(n).padStart(2, "0");
const ts = () => { const d = new Date(); return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };

const EVTS = [
  { t:"SCAN",  c:"#22c55e", m:["Polymarket CLOB — 20 markets scanned","NemoClaw guardrails — ACTIVE","Alchemy RPC — latency 3ms","USDC.e verified on Polygon","hc-ping heartbeat — OK","py-clob-client v0.14.2 connected","trade_log.csv — row appended","check_wallet_tokens() — clean"] },
  { t:"CLAUDE",c:"#a78bfa", m:["web_search: BTC ETF inflows March 2026","estimating YES probability — 74%","confidence score: 81/100","EV check: +$14.22 after 1.56% fee","signal: BUY YES @ 0.47 — APPROVED","model: claude-sonnet-4-6 ✓","token usage: 487/512","web_search: Fed rate March decision"] },
  { t:"TRADE", c:"#F0652F", m:["maker order — Polygon CLOB placed","fill confirmed — $25 USDC → YES","spread capture: $0.029","tx: 0x7fa3...b91c CONFIRMED","slippage: 0.00% — within tolerance","REQUIRE_APPROVAL — human approved ✓","53.19 YES shares opened"] },
  { t:"GUARD", c:"#f59e0b", m:["MAX_POSITION_PCT 5% — within cap","daily_loss: $8.20 / $100 cap","MAX_DAILY_TRADES: 6 / 10","MIN_CONFIDENCE 70 — threshold met","MAX_NEWS_AGE_MINUTES — data fresh","NemoClaw: ALLOWED"] },
  { t:"WARN",  c:"#ef4444", m:["stale data detected — skipping","spread widened above threshold","rate limit — sleep 0.1s","liquidity thin — position skipped","VPIN > 0.8 — high adverse selection"] },
];

const MKTS = [
  { id:"BTC_95K",   l:"Will BTC close > $95K?",       s:"YES", p:0.47, e:0.26 },
  { id:"FED_CUT",   l:"Fed rate cut Q2 2026?",         s:"YES", p:0.58, e:0.14 },
  { id:"TRUMP_ANN", l:"Trump exec order today?",       s:"NO",  p:0.38, e:0.18 },
  { id:"ETH_3K",    l:"ETH closes > $3K this month?",  s:"YES", p:0.61, e:0.11 },
  { id:"SPX_5300",  l:"SPX above 5,300 by Friday?",    s:"YES", p:0.53, e:0.20 },
  { id:"GOLD_2400", l:"Gold > $2,400 end of week?",    s:"YES", p:0.44, e:0.22 },
];

const PRESS = [
  {id:"BTC_5M",b:63},{id:"FED_CUT",b:58},{id:"ETH_5M",b:51},
  {id:"TRUMP_8H",b:46},{id:"OIL_65",b:47},{id:"GOLD_1400",b:71},{id:"SPX_5M",b:38},
];

function Blink({c="#22c55e",ms=900}) {
  const [on,setOn]=useState(true);
  useEffect(()=>{const t=setInterval(()=>setOn(v=>!v),ms);return()=>clearInterval(t);},[ms]);
  return <span style={{color:c,opacity:on?1:0}}>█</span>;
}

function Log({logs}) {
  const r=useRef();
  useEffect(()=>{if(r.current)r.current.scrollTop=r.current.scrollHeight;},[logs]);
  return (
    <div ref={r} style={{flex:1,overflowY:"scroll",scrollbarWidth:"none",padding:"2px 0"}}>
      {logs.map((l,i)=>(
        <div key={i} style={{display:"flex",gap:4,padding:"0.5px 6px",fontSize:9,lineHeight:1.75,fontFamily:"monospace"}}>
          <span style={{color:"#1a3a1a",flexShrink:0,width:52}}>{l.ts}</span>
          <span style={{color:l.c,fontWeight:700,flexShrink:0,width:48}}>+{l.t}</span>
          <span style={{color:"#4ade80"}}>{l.m}</span>
        </div>
      ))}
      <div style={{padding:"2px 6px",fontFamily:"monospace"}}><Blink/></div>
    </div>
  );
}

export default function App() {
  const [logs,setLogs]=useState(()=>{
    const a=[];
    for(let i=0;i<50;i++){const ev=pick(EVTS);a.push({ts:ts(),t:ev.t,c:ev.c,m:pick(ev.m)});}
    return a;
  });
  const [chart,setChart]=useState([{v:0}]);
  const [st,setSt]=useState({pnl:0,wr:0.964,sharpe:2.49,spread:0.029,fills:16.2,trades:0,wins:0,scans:0});
  const [press,setPress]=useState(PRESS);
  const [mkts,setMkts]=useState(MKTS);
  const [uptime,setUptime]=useState("00:00:00");
  const [pid]=useState(()=>ri(40000,55000));
  const t0=useRef(Date.now());

  useEffect(()=>{
    const t=setInterval(()=>{
      const s=Math.floor((Date.now()-t0.current)/1000);
      setUptime(`${p2(Math.floor(s/3600))}:${p2(Math.floor((s%3600)/60))}:${p2(s%60)}`);
    },1000);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>{
      const ev=pick(EVTS);
      setLogs(p=>[...p.slice(-160),{ts:ts(),t:ev.t,c:ev.c,m:pick(ev.m)}]);
    },ri(280,1000));
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>{
      setSt(p=>{
        const win=Math.random()<p.wr;
        const d=win?rand(1.5,8):-rand(0.5,3.5);
        const tr=p.trades+1, ws=p.wins+(win?1:0);
        return{...p,pnl:p.pnl+d,trades:tr,wins:ws,wr:ws/tr,
          spread:+rand(0.020,0.038).toFixed(3),fills:+rand(14,19).toFixed(1),
          sharpe:+rand(2.2,2.9).toFixed(2),scans:p.scans+1};
      });
      setChart(p=>{
        const last=p[p.length-1].v;
        return[...p.slice(-120),{v:+(last+rand(-1,3.5)).toFixed(2)}];
      });
    },1800);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>{
      setPress(p=>p.map(m=>({...m,b:Math.max(25,Math.min(75,m.b+ri(-3,4)))})));
      setMkts(p=>p.map(m=>({...m,
        p:+Math.max(0.1,Math.min(0.9,m.p+rand(-0.01,0.01))).toFixed(2),
        e:+Math.max(0.05,Math.min(0.35,m.e+rand(-0.008,0.008))).toFixed(2),
      })));
    },2600);
    return()=>clearInterval(t);
  },[]);

  const pc=st.pnl>=0?"#22c55e":"#ef4444";
  const G="#22c55e",DG="#1a4a1a",B="#020a02";
  const MO={fontFamily:"monospace"};
  const SEP={borderBottom:"1px solid #081408"};
  const HDR=txt=>(
    <div style={{...MO,padding:"3px 8px",fontSize:9,color:DG,letterSpacing:2,...SEP,flexShrink:0,background:"rgba(0,0,0,0.15)"}}>
      {txt}
    </div>
  );

  return (
    <div style={{background:B,color:G,...MO,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      {/* scanlines */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:20,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)"}}/>

      {/* ── TOPBAR ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"3px 10px",background:"#010801",borderBottom:"1px solid #0d2a0d",
        fontSize:10,flexShrink:0,gap:8}}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <span style={{color:"#4ade80",fontWeight:900,letterSpacing:2,fontSize:11}}>⬡ OPENCLAW SENTINEL</span>
          {[["SYS","v2.0.6"],["PID",pid],["MODE","DEEP"],["MKTS","20"]].map(([k,v])=>(
            <span key={k} style={{color:DG}}>{k} <span style={{color:G}}>{v}</span></span>
          ))}
          <span style={{color:DG}}>NET <Blink c="#22c55e" ms={1500}/></span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <span style={{color:DG}}>OPTTIME <span style={{color:G}}>{uptime}</span></span>
          <Blink c="#4ade80" ms={1000}/><span style={{color:DG,marginLeft:2}}>LIVE</span>
          <span style={{color:"#ef4444",fontWeight:700,letterSpacing:1}}>SCANNING</span>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div style={{display:"flex",justifyContent:"space-around",borderBottom:"1px solid #081408",
        background:"rgba(0,0,0,0.25)",flexShrink:0}}>
        {[
          ["TOTAL P&L",`${st.pnl>=0?"+":""}$${st.pnl.toFixed(2)}`,"SESSION",pc],
          ["TRADES",st.trades,"EXECUTED",G],
          ["WIN RATE",(st.wr*100).toFixed(1)+"%","ACCURACY","#4ade80"],
          ["SHARPE",st.sharpe,"RATIO","#a78bfa"],
          ["SPREAD","$"+st.spread,"CAPTURE","#f59e0b"],
          ["FILLS/S",st.fills,"THROUGHPUT",G],
          ["SCANS",st.scans,"CYCLES",G],
        ].map(([lbl,val,sub,col])=>(
          <div key={lbl} style={{textAlign:"center",padding:"3px 6px"}}>
            <div style={{fontSize:8,color:DG,letterSpacing:1}}>{lbl}</div>
            <div style={{fontSize:15,fontWeight:900,color:col,lineHeight:1.2}}>{val}</div>
            <div style={{fontSize:8,color:DG}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* LEFT: LOG */}
        <div style={{flex:"0 0 205px",display:"flex",flexDirection:"column",
          borderRight:"1px solid #081408",overflow:"hidden"}}>
          {HDR("EVENT STREAM")}
          <Log logs={logs}/>
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

          {/* Market table */}
          <div style={{flexShrink:0,...SEP}}>
            {HDR("ACTIVE MARKETS — POLYMARKET CLOB — POLYGON (137)")}
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
              <thead>
                <tr style={{color:DG,...SEP}}>
                  {["REPOSITORY","STARS","FORKS","PERMS","SIZE","LOC","TRUST"].map(h=>(
                    <th key={h} style={{padding:"2px 7px",textAlign:"left",fontWeight:400,letterSpacing:1}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mkts.map(m=>{
                  const sig=m.e>0.15;
                  const trust=Math.round((m.e/0.30)*85+55);
                  const ev=(m.e*25).toFixed(2);
                  return (
                    <tr key={m.id} style={{borderBottom:"1px solid #050f05"}}>
                      <td style={{padding:"2px 7px",color:G}}>
                        <span style={{color:sig?G:DG,marginRight:4}}>●</span>
                        {m.l.length>30?m.l.slice(0,28)+"…":m.l}
                      </td>
                      <td style={{padding:"2px 7px",color:"#a7f3a0"}}>{ri(300,2000)}</td>
                      <td style={{padding:"2px 7px",color:"#a7f3a0"}}>{ri(50,400)}</td>
                      <td style={{padding:"2px 7px",color:m.s==="YES"?G:"#ef4444"}}>{m.s}</td>
                      <td style={{padding:"2px 7px",color:m.e>0.20?G:"#f59e0b"}}>+{(m.e*100).toFixed(0)}%</td>
                      <td style={{padding:"2px 7px",color:G}}>${ev}</td>
                      <td style={{padding:"2px 7px"}}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                          <span style={{color:sig?G:"#f59e0b"}}>{sig?"A":"B"}</span>
                          <div style={{width:40,height:6,background:"#0a180a",borderRadius:1,overflow:"hidden"}}>
                            <div style={{width:`${trust}%`,height:"100%",background:sig?G:"#f59e0b"}}/>
                          </div>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Chart + metrics */}
          <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
            {/* Chart */}
            <div style={{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #081408"}}>
              {HDR("SESSION P&L — SPREAD CAPTURE")}
              <div style={{flex:1,padding:"0 6px",minHeight:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{top:6,right:6,bottom:4,left:0}}>
                    <YAxis hide domain={["auto","auto"]}/>
                    <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{padding:"3px 8px",borderTop:"1px solid #081408",display:"flex",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:24,fontWeight:900,color:pc}}>{st.pnl>=0?"+":""}${st.pnl.toFixed(2)}</span>
              </div>
            </div>

            {/* Right metrics column */}
            <div style={{flex:"0 0 105px",display:"flex",flexDirection:"column",fontSize:10}}>
              {[
                ["WIN RATE",(st.wr*100).toFixed(1)+"%","#4ade80"],
                ["SHARPE",st.sharpe,"#a78bfa"],
                ["SPREAD","$"+st.spread,"#f59e0b"],
                ["FILLS/S",st.fills,G],
                ["INVENTORY","+0",G],
              ].map(([lbl,val,col])=>(
                <div key={lbl} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",
                  alignItems:"center",borderBottom:"1px solid #081408",padding:"2px 0"}}>
                  <div style={{fontSize:8,color:DG,letterSpacing:1}}>{lbl}</div>
                  <div style={{fontSize:18,fontWeight:900,color:col,lineHeight:1.1}}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy bar */}
          <div style={{flexShrink:0,borderTop:"1px solid #081408",background:"rgba(0,0,0,0.3)",padding:"4px 8px"}}>
            <div style={{fontSize:8,color:DG,letterSpacing:2,marginBottom:2}}>STRATEGY ENGINE</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:9,color:"#4ade80"}}>
              {[["post_bid P","0.47"],["post_ask P","0.54"],["spread",st.spread],
                ["VPIN","0.23"],["inventory","+5"],["APPROVAL","ON"]].map(([k,v])=>(
                <span key={k}>{k} = <span style={{color:G}}>{v}</span></span>
              ))}
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:8,color:DG,marginTop:1}}>
              <span>profit = spread×qty</span>
              <span>kill_switch = <span style={{color:"#22c55e"}}>STANDBY</span></span>
              <span>VPIN &gt; 0.8 = <span style={{color:"#ef4444"}}>HALT</span></span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{flex:"0 0 190px",display:"flex",flexDirection:"column",
          overflow:"hidden",borderLeft:"1px solid #081408"}}>

          {/* Threat intel / Claude signals */}
          <div style={{flexShrink:0,...SEP}}>
            {HDR("CLAUDE SIGNALS")}
            {[
              {id:"polymarket-copy-bot",note:"claude estimate 74% — mkt 47%",risk:"HIGH"},
              {id:"pa-arb-engine-v2",note:"EV +$14.22 after 1.56% fee",risk:"MED"},
              {id:"clob-trader-v0.9.1",note:"spread capture $0.029/fill",risk:"LOW"},
              {id:"defi-prediction-bot",note:"REQUIRE_APPROVAL — waiting",risk:"WARN"},
              {id:"NemoClaw-v2.0",note:"guardrails active — 0 blocks",risk:"OK"},
            ].map(({id,note,risk})=>(
              <div key={id} style={{padding:"3px 8px",borderBottom:"1px solid #050f05"}}>
                <div style={{fontSize:9,color:G,fontWeight:700}}>{id}</div>
                <div style={{fontSize:8,color:DG,marginTop:1}}>{note}</div>
                <span style={{fontSize:7,color:risk==="HIGH"?"#ef4444":risk==="WARN"?"#f59e0b":risk==="OK"?"#22c55e":"#a78bfa",
                  background:"rgba(0,0,0,0.3)",padding:"0 4px",borderRadius:1}}>{risk}</span>
              </div>
            ))}
          </div>

          {/* Pressure */}
          <div style={{flex:1,overflow:"hidden",padding:"0 8px"}}>
            {HDR("BUY — PRESSURE — SELL")}
            {press.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                <span style={{fontSize:9,color:G,width:60,flexShrink:0}}>{m.id}</span>
                <div style={{flex:1,height:10,background:"#081408",borderRadius:1,overflow:"hidden",display:"flex"}}>
                  <div style={{width:`${m.b}%`,background:"#16a34a",transition:"width 1s ease"}}/>
                  <div style={{flex:1,background:"#dc2626"}}/>
                </div>
                <span style={{fontSize:9,color:G,width:22,textAlign:"right"}}>{m.b}%</span>
              </div>
            ))}
          </div>

          {/* Dep audit */}
          <div style={{flexShrink:0,borderTop:"1px solid #081408",padding:"5px 8px"}}>
            {HDR("DEPENDENCY AUDIT")}
            {[["py-clob-client","0.14.2"],["web3.py","6.x"],["anthropic","0.21"],["schedule","1.2"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:9,padding:"1px 0",color:G}}>
                <span>{k}</span><span style={{color:"#4ade80"}}>@ {v} ✓</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
