import { useState, useEffect, useRef } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const rand = (a, b) => Math.random() * (b - a) + a;
const ri = (a, b) => Math.floor(rand(a, b));
const pick = arr => arr[ri(0, arr.length)];
const p2 = n => String(n).padStart(2, "0");
const ts = () => { const d = new Date(); return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };
const fmtUSD = n => `$${Math.abs(n).toFixed(2)}`;

// ── Base chain log events ─────────────────────────────────
const EVTS = [
  { t:"SCAN",  c:"#22c55e", m:[
    "DexScreener — scanning Base chain tokens",
    "web3.py — Base chain 8453 connected",
    "Alchemy RPC — latency 2ms",
    "check_eth_balance_for_gas() — OK $4.82 ETH",
    "NemoClaw guardrails — ACTIVE",
    "hc-ping heartbeat — OK",
    "trade_log.csv — row appended",
    "USDC on Base 0x833589...verified",
    "Uniswap v3 Router — connected",
    "get_optimal_gas_price() — 0.001 gwei",
    "scan_and_trade() — cycle started",
    "mainnet.base.org — backup RPC OK",
  ]},
  { t:"CLAUDE",c:"#a78bfa", m:[
    "web_search: AERO Aerodrome sentiment Farcaster",
    "RSI(14): 58 — momentum zone",
    "resistance breakout: +2% above $1.82",
    "volume spike: 3.4× 7-day average",
    "sentiment_score: 82/100 — bullish",
    "confidence: 84/100 — SIGNAL",
    "model: claude-sonnet-4-6",
    "web_search: Base chain TVL March 2026",
    "token: BRETT — technical_score 71/100",
    "action: BUY — entry $1.847 SL $1.699",
    "analyse_token_with_claude() — complete",
  ]},
  { t:"SWAP",  c:"#F0652F", m:[
    "execute_uniswap_swap() — initiated",
    "approve USDC spend — tx pending",
    "swap $50 USDC → AERO — confirmed",
    "tx: 0x3f9a...c821 — basescan.org ✓",
    "gas fee: $0.007 — within budget",
    "slippage: 0.41% — below MAX_SLIPPAGE",
    "position opened: 27.09 AERO",
    "stop_loss set: $1.699 (-8%)",
    "take_profit set: $2.216 (+20%)",
    "REQUIRE_APPROVAL — human approved ✓",
    "log_trade() — CSV appended",
  ]},
  { t:"GUARD", c:"#f59e0b", m:[
    "MAX_POSITION_PCT 15% — within cap",
    "daily_loss: $4.20 / $100 cap",
    "MAX_DAILY_TRADES: 3 / 10",
    "MIN_CONFIDENCE=70 — threshold met",
    "MAX_NEWS_AGE_MINUTES — data fresh",
    "MAX_SLIPPAGE 2% — OK",
    "NemoClaw: action ALLOWED",
    "interact_with_unverified_contracts — BLOCKED",
    "approve_unlimited_spending — BLOCKED",
  ]},
  { t:"WARN",  c:"#ef4444", m:[
    "stale data — skipping signal",
    "gas spike — waiting for lower fees",
    "slippage exceeded MAX_SLIPPAGE — abort",
    "low ETH balance — gas warning",
    "liquidity thin on Uniswap pool",
    "price moved 5% since signal — recheck",
    "consecutive_errors: 2/3 — alerting",
  ]},
];

// ── Base chain tokens ─────────────────────────────────────
const INIT_TOKENS = [
  { sym:"AERO",  name:"Aerodrome Finance", addr:"0x940181a9...", p:1.847, ch:12.3, rsi:58, vol:3.4, conf:84, action:"BUY" },
  { sym:"BRETT", name:"Brett",             addr:"0x532f3EFf...", p:0.184, ch: 8.7, rsi:61, vol:2.1, conf:76, action:"BUY" },
  { sym:"DEGEN", name:"Degen",             addr:"0x4ed4E862...", p:0.018, ch: 4.2, rsi:52, vol:1.8, conf:65, action:"WATCH" },
  { sym:"HIGHER",name:"Higher",            addr:"0x0578d8A9...", p:0.041, ch:-2.1, rsi:44, vol:0.9, conf:38, action:"SKIP" },
  { sym:"TOSHI", name:"Toshi",             addr:"0xAC1Bd2486...", p:0.0003, ch:6.8, rsi:55, vol:2.6, conf:71, action:"WATCH" },
  { sym:"WETH",  name:"Wrapped ETH",       addr:"0x420000...0006", p:3241.0, ch: 1.4, rsi:49, vol:4.2, conf:55, action:"WATCH" },
];

const INIT_POSITIONS = [
  { sym:"AERO",  entry:1.847, current:1.891, size:50, sl:1.699, tp:2.216 },
  { sym:"BRETT", entry:0.184, current:0.201, size:25, sl:0.169, tp:0.221 },
];

const INIT_PRESS = [
  {id:"AERO",  b:72},{id:"BRETT",b:65},{id:"DEGEN",b:51},
  {id:"WETH",  b:48},{id:"TOSHI",b:58},{id:"ETH_GA",b:38},{id:"BASE_TV",b:71},
];

// ── Tiny components ───────────────────────────────────────
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
          <span style={{color:l.c,fontWeight:700,flexShrink:0,width:44}}>+{l.t}</span>
          <span style={{color:"#4ade80"}}>{l.m}</span>
        </div>
      ))}
      <div style={{padding:"2px 6px",fontFamily:"monospace"}}><Blink/></div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function App() {
  const [logs,setLogs]=useState(()=>{
    const a=[];
    for(let i=0;i<50;i++){const ev=pick(EVTS);a.push({ts:ts(),t:ev.t,c:ev.c,m:pick(ev.m)});}
    return a;
  });
  const [chart,setChart]=useState([{v:0}]);
  const [st,setSt]=useState({pnl:0,wr:0.78,trades:0,wins:0,scans:0,gas:0.007,ethBal:4.82,usdcBal:185});
  const [tokens,setTokens]=useState(INIT_TOKENS);
  const [positions,setPositions]=useState(INIT_POSITIONS);
  const [press,setPress]=useState(INIT_PRESS);
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
    },ri(300,1100));
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>{
      setSt(p=>{
        const win=Math.random()<p.wr;
        const delta=win?rand(1.2,12):-rand(0.5,5);
        const tr=p.trades+1,ws=p.wins+(win?1:0);
        return{...p,pnl:p.pnl+delta,trades:tr,wins:ws,wr:ws/tr,
          gas:+rand(0.003,0.015).toFixed(3),scans:p.scans+1,
          usdcBal:Math.max(0,p.usdcBal+delta*0.8)};
      });
      setChart(p=>[...p.slice(-120),{v:+(p[p.length-1].v+rand(-1.5,4)).toFixed(2)}]);
    },2200);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>{
      setTokens(p=>p.map(tk=>({...tk,
        p:+Math.max(0.00001,tk.p*(1+rand(-0.008,0.012))).toFixed(tk.p>100?1:tk.p>1?3:6),
        ch:+rand(-15,20).toFixed(1),
        rsi:+Math.max(20,Math.min(80,tk.rsi+rand(-3,3))).toFixed(0),
        vol:+Math.max(0.3,Math.min(8,tk.vol+rand(-0.3,0.4))).toFixed(1),
        conf:+Math.max(30,Math.min(95,tk.conf+rand(-4,4))).toFixed(0),
      })));
      setPositions(p=>p.map(pos=>({...pos,
        current:+Math.max(pos.sl*1.01,pos.current*(1+rand(-0.005,0.009))).toFixed(pos.current>100?1:3),
      })));
      setPress(p=>p.map(m=>({...m,b:Math.max(25,Math.min(75,m.b+ri(-3,4)))})));
    },2800);
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

      {/* ── TOP BAR ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"3px 10px",background:"#010801",borderBottom:"1px solid #0d2a0d",
        fontSize:10,flexShrink:0}}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <span style={{color:"#4ade80",fontWeight:900,letterSpacing:2,fontSize:11}}>⬡ OPENCLAW BASE SENTINEL</span>
          {[["SYS","v2.0.6"],["PID",pid],["CHAIN","BASE 8453"],["DEX","UNISWAP v3"]].map(([k,v])=>(
            <span key={k} style={{color:DG}}>{k} <span style={{color:G}}>{v}</span></span>
          ))}
          <span style={{color:DG}}>NET <Blink c="#22c55e" ms={1500}/></span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <span style={{color:DG}}>UPTIME <span style={{color:G}}>{uptime}</span></span>
          <span style={{color:DG}}>ETH <span style={{color:"#f59e0b"}}>{st.ethBal.toFixed(2)}</span></span>
          <span style={{color:DG}}>USDC <span style={{color:G}}>${st.usdcBal.toFixed(0)}</span></span>
          <Blink c="#4ade80" ms={1000}/><span style={{color:DG,marginLeft:2}}>LIVE</span>
          <span style={{color:"#ef4444",fontWeight:700,letterSpacing:1}}>SCANNING</span>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div style={{display:"flex",justifyContent:"space-around",borderBottom:"1px solid #081408",
        background:"rgba(0,0,0,0.25)",flexShrink:0}}>
        {[
          ["TOTAL P&L",`${st.pnl>=0?"+":""}$${Math.abs(st.pnl).toFixed(2)}`,"SESSION",pc],
          ["TRADES",st.trades,"EXECUTED",G],
          ["WIN RATE",`${(st.wr*100).toFixed(1)}%`,"ACCURACY","#4ade80"],
          ["GAS/TX",`$${st.gas}`,"BASE CHAIN","#f59e0b"],
          ["USDC BAL",`$${st.usdcBal.toFixed(0)}`,"HOT WALLET",G],
          ["ETH GAS",`${st.ethBal.toFixed(2)}`,"BUFFER","#a78bfa"],
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
          {HDR("EVENT STREAM — BASE CHAIN")}
          <Log logs={logs}/>
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

          {/* Token scanner table */}
          <div style={{flexShrink:0,...SEP}}>
            {HDR("TOKEN SCANNER — DEXSCREENER + CLAUDE ANALYSIS — BASE (8453)")}
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
              <thead>
                <tr style={{color:DG,...SEP}}>
                  {["TOKEN","PRICE","24H %","RSI(14)","VOL×AVG","CONF","ACTION"].map(h=>(
                    <th key={h} style={{padding:"2px 7px",textAlign:"left",fontWeight:400,letterSpacing:1}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokens.map(tk=>{
                  const actionColor=tk.action==="BUY"?G:tk.action==="SKIP"?"#ef4444":"#f59e0b";
                  const chColor=tk.ch>=0?G:"#ef4444";
                  const rsiColor=tk.rsi>65?"#ef4444":tk.rsi<40?"#60a5fa":G;
                  return (
                    <tr key={tk.sym} style={{borderBottom:"1px solid #050f05"}}>
                      <td style={{padding:"2px 7px",color:G}}>
                        <span style={{color:tk.action==="BUY"?G:DG,marginRight:4}}>●</span>
                        <span style={{color:"#4ade80",fontWeight:700}}>{tk.sym}</span>
                        <span style={{color:DG,fontSize:8,marginLeft:4}}>{tk.name}</span>
                      </td>
                      <td style={{padding:"2px 7px",color:"#a7f3a0"}}>${tk.p}</td>
                      <td style={{padding:"2px 7px",color:chColor}}>{tk.ch>=0?"+":""}{tk.ch}%</td>
                      <td style={{padding:"2px 7px",color:rsiColor}}>{tk.rsi}</td>
                      <td style={{padding:"2px 7px",color:tk.vol>=2?G:"#f59e0b"}}>{tk.vol}×</td>
                      <td style={{padding:"2px 7px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <div style={{width:35,height:5,background:"#0a180a",borderRadius:1}}>
                            <div style={{width:`${tk.conf}%`,height:"100%",background:tk.conf>=70?G:"#f59e0b",borderRadius:1}}/>
                          </div>
                          <span style={{color:tk.conf>=70?G:"#f59e0b"}}>{tk.conf}</span>
                        </div>
                      </td>
                      <td style={{padding:"2px 7px"}}>
                        <span style={{color:actionColor,background:`${actionColor}18`,
                          padding:"1px 5px",borderRadius:2,fontSize:8,letterSpacing:1}}>
                          {tk.action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Chart + right metrics */}
          <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
            {/* P&L Chart */}
            <div style={{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #081408"}}>
              {HDR("SESSION P&L — UNISWAP v3 TOKEN SWAPS — CLAUDE SONNET 4.6")}
              <div style={{flex:1,padding:"0 6px",minHeight:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{top:6,right:6,bottom:4,left:0}}>
                    <YAxis hide domain={["auto","auto"]}/>
                    <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{padding:"3px 8px",borderTop:"1px solid #081408",display:"flex",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:24,fontWeight:900,color:pc}}>{st.pnl>=0?"+":""}${Math.abs(st.pnl).toFixed(2)}</span>
              </div>
            </div>

            {/* Open positions + metrics */}
            <div style={{flex:"0 0 130px",display:"flex",flexDirection:"column",fontSize:9}}>
              {HDR("OPEN POSITIONS")}
              {positions.map(pos=>{
                const pnl=((pos.current-pos.entry)/pos.entry*100);
                const pnlCol=pnl>=0?G:"#ef4444";
                return (
                  <div key={pos.sym} style={{padding:"4px 8px",borderBottom:"1px solid #081408"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{color:"#4ade80",fontWeight:700}}>{pos.sym}</span>
                      <span style={{color:pnlCol}}>{pnl>=0?"+":""}{pnl.toFixed(1)}%</span>
                    </div>
                    <div style={{color:DG,fontSize:8}}>entry ${pos.entry} → ${pos.current}</div>
                    <div style={{color:DG,fontSize:8}}>SL ${pos.sl} · TP ${pos.tp}</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                      <span style={{color:DG,fontSize:8}}>size</span>
                      <span style={{color:G,fontSize:8}}>${pos.size} USDC</span>
                    </div>
                  </div>
                );
              })}
              {/* Quick stats */}
              {[
                ["WIN RATE",`${(st.wr*100).toFixed(1)}%`,"#4ade80"],
                ["GAS/TX",`$${st.gas}`,"#f59e0b"],
                ["TRADES",`${st.trades}/10`,"#a78bfa"],
              ].map(([lbl,val,col])=>(
                <div key={lbl} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",
                  alignItems:"center",borderBottom:"1px solid #081408",padding:"2px 0"}}>
                  <div style={{fontSize:8,color:DG,letterSpacing:1}}>{lbl}</div>
                  <div style={{fontSize:16,fontWeight:900,color:col,lineHeight:1.1}}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy bar */}
          <div style={{flexShrink:0,borderTop:"1px solid #081408",background:"rgba(0,0,0,0.3)",padding:"4px 8px"}}>
            <div style={{fontSize:8,color:DG,letterSpacing:2,marginBottom:2}}>STRATEGY ENGINE — BASE CHAIN</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:9,color:"#4ade80"}}>
              {[
                ["TRADE_SIZE","$50 USDC"],["MAX_SLIPPAGE","2%"],
                ["STOP_LOSS","8%"],["TAKE_PROFIT","20%"],
                ["MIN_CONF","70"],["APPROVAL","ON"],
                ["NEMOCLAW","ACTIVE"],["GAS_BUFFER","$5 ETH"],
              ].map(([k,v])=>(
                <span key={k}>{k}: <span style={{color:G}}>{v}</span></span>
              ))}
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:8,color:DG,marginTop:1}}>
              <span>Router: <span style={{color:"#1a5a1a"}}>0x2626664c2603336E57B271c5C0b26F421741e481</span></span>
              <span>USDC: <span style={{color:"#1a5a1a"}}>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</span></span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{flex:"0 0 195px",display:"flex",flexDirection:"column",
          overflow:"hidden",borderLeft:"1px solid #081408"}}>

          {/* Claude signal cards */}
          <div style={{flexShrink:0,borderBottom:"1px solid #081408"}}>
            {HDR("CLAUDE ANALYSIS")}
            {tokens.slice(0,4).map(tk=>{
              const sig=tk.action==="BUY";
              return (
                <div key={tk.sym} style={{padding:"3px 8px",borderBottom:"1px solid #050f05"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
                    <span style={{fontSize:9,color:"#4ade80",fontWeight:700}}>{tk.sym}</span>
                    <span style={{fontSize:8,color:sig?G:"#f59e0b"}}>{tk.action}</span>
                  </div>
                  <div style={{fontSize:8,color:DG}}>
                    RSI {tk.rsi} · Vol {tk.vol}× · Conf {tk.conf}%
                  </div>
                  <div style={{height:3,marginTop:2,background:"#0a180a",borderRadius:1,overflow:"hidden"}}>
                    <div style={{width:`${tk.conf}%`,height:"100%",
                      background:sig?G:"#f59e0b",transition:"width 0.8s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buy pressure */}
          <div style={{flex:1,overflow:"hidden",padding:"0 8px"}}>
            {HDR("TOKEN MOMENTUM — BUY / SELL")}
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

          {/* Dependencies */}
          <div style={{flexShrink:0,borderTop:"1px solid #081408",padding:"5px 8px"}}>
            {HDR("DEPENDENCY AUDIT")}
            {[
              ["web3.py","6.x ✓"],
              ["anthropic","0.21 ✓"],
              ["nemoclaw","2.0 ✓"],
              ["schedule","1.2 ✓"],
              ["websockets","12.0 ✓"],
              ["tenacity","8.x ✓"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:9,padding:"1px 0",color:G}}>
                <span>{k}</span><span style={{color:"#4ade80"}}>@ {v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
