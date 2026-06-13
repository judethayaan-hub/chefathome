import { useState } from "react";
import { B, SectionHeader, cardStyle, Icon, formatDate } from "../../shared/tokens.jsx";

const CONVERSATIONS = [
  { id:1, customer:"Priya S.",  avatar:"PS", time:"2m ago",   last:"Thanks! Can you confirm the menu?",           unread:2, active:true  },
  { id:2, customer:"Kamal P.",  avatar:"KP", time:"1h ago",   last:"Will there be parking available?",            unread:0, active:false },
  { id:3, customer:"Nadia F.",  avatar:"NF", time:"3h ago",   last:"Please share the invoice for the event.",     unread:1, active:false },
  { id:4, customer:"Ravi T.",   avatar:"RT", time:"Yesterday",last:"Thank you for the amazing service!",          unread:0, active:false },
  { id:5, customer:"Amara L.",  avatar:"AL", time:"2 days ago",last:"Could we reschedule to January?",           unread:0, active:false },
];

const MOCK_MESSAGES = {
  1: [
    { from:"customer", text:"Hi! I booked the venue for Dec 24th. Can you confirm the vegetarian menu?", time:"10:30 AM" },
    { from:"vendor",   text:"Hello Priya! Yes, confirmed. We'll have a dedicated vegetarian section with 8 dishes.", time:"10:45 AM" },
    { from:"customer", text:"Thanks! Can you confirm the menu?", time:"11:02 AM" },
  ],
  2: [
    { from:"customer", text:"Will there be parking available on Dec 31st?", time:"Yesterday 3PM" },
  ],
};

export default function VendorMessages({ showToast }) {
  const [activeConv, setActiveConv] = useState(1);
  const [input, setInput] = useState("");
  const [convs, setConvs] = useState(CONVERSATIONS);
  const [msgMap, setMsgMap] = useState(MOCK_MESSAGES);

  const send = () => {
    if (!input.trim()) return;
    setMsgMap(prev => ({
      ...prev,
      [activeConv]: [...(prev[activeConv]||[]), { from:"vendor", text:input.trim(), time:"Just now" }],
    }));
    setInput("");
  };

  const messages = msgMap[activeConv] || [];
  const conv = convs.find(c => c.id === activeConv);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <SectionHeader title="Messages" sub={`${convs.filter(c=>c.unread>0).length} unread conversations`} />
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, height:"70vh" }}>
        {/* Conversation list */}
        <div style={{ ...cardStyle, padding:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"14px 14px 10px", borderBottom:`1px solid ${B.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:B.bg, borderRadius:8, padding:"8px 10px" }}>
              <Icon.Search />
              <input placeholder="Search..." style={{ flex:1, border:"none", background:"none", fontSize:12, color:B.text, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {convs.map(c => (
              <div key={c.id} onClick={() => { setActiveConv(c.id); setConvs(prev => prev.map(x => x.id===c.id?{...x,unread:0}:x)); }} style={{ padding:"12px 14px", borderBottom:`1px solid ${B.border}`, cursor:"pointer", background:activeConv===c.id?B.accentSoft:"transparent", display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:activeConv===c.id?B.dark:B.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:activeConv===c.id?"#fff":B.textMuted, flexShrink:0 }}>{c.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div style={{ fontSize:13, fontWeight:c.unread?700:600, color:B.text }}>{c.customer}</div>
                    <div style={{ fontSize:10, color:B.textLight }}>{c.time}</div>
                  </div>
                  <div style={{ fontSize:11, color:B.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:2 }}>{c.last}</div>
                </div>
                {c.unread > 0 && <div style={{ width:18, height:18, borderRadius:"50%", background:B.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:B.dark, flexShrink:0 }}>{c.unread}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ ...cardStyle, padding:0, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:B.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{conv?.avatar}</div>
            <div style={{ fontSize:14, fontWeight:700, color:B.text }}>{conv?.customer}</div>
            {conv?.active && <div style={{ width:7, height:7, borderRadius:"50%", background:"#4ADE80", marginLeft:2 }} />}
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.from==="vendor"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"72%", padding:"10px 13px", borderRadius:m.from==="vendor"?"14px 14px 3px 14px":"14px 14px 14px 3px", background:m.from==="vendor"?B.dark:B.surface, border:m.from==="vendor"?"none":`1px solid ${B.border}` }}>
                  <div style={{ fontSize:13, color:m.from==="vendor"?"#fff":B.text, lineHeight:1.5 }}>{m.text}</div>
                  <div style={{ fontSize:10, color:m.from==="vendor"?"rgba(255,255,255,0.4)":B.textLight, marginTop:4, textAlign:"right" }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:"12px 18px", borderTop:`1px solid ${B.border}`, display:"flex", gap:10 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message..." style={{ flex:1, padding:"10px 13px", borderRadius:10, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:13, color:B.text, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
            <button onClick={send} disabled={!input.trim()} style={{ width:38, height:38, borderRadius:10, background:B.dark, border:"none", cursor:input.trim()?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", opacity:input.trim()?1:0.4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
