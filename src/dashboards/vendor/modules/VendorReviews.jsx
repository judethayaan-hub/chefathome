import { useState } from "react";
import { B, SectionHeader, cardStyle, Icon, formatDate } from "../../shared/tokens.jsx";

const REVIEWS = [
  { id:1, customer:"Priya S.",   rating:5, date:"2026-12-10", text:"Absolutely stunning venue! The staff was incredibly attentive and everything was perfect.", event:"Wedding Reception", replied:false },
  { id:2, customer:"Kamal P.",   rating:5, date:"2026-12-08", text:"Best DJ in Colombo! The crowd loved every song. Will definitely book again for NYE.",      event:"Birthday Party",    replied:true  },
  { id:3, customer:"Nadia F.",   rating:4, date:"2026-12-05", text:"Great service overall. Minor delay in setup but the team handled it professionally.",         event:"Corporate Gala",    replied:false },
  { id:4, customer:"Ravi T.",    rating:5, date:"2026-12-01", text:"Courts were in excellent condition. Booking was smooth and staff very helpful.",              event:"Sports Event",      replied:true  },
  { id:5, customer:"Amara L.",   rating:3, date:"2026-11-28", text:"Decent experience but parking was a bit difficult. Food was excellent though.",               event:"Birthday Party",    replied:false },
  { id:6, customer:"Senith J.",  rating:5, date:"2026-11-20", text:"Exceptional quality and professionalism. The venue exceeded all our expectations!",           event:"Engagement Party",  replied:true  },
];

function StarRow({ rating }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i<=rating?"#D4AF6A":"#E4E1D9"} stroke={i<=rating?"#D4AF6A":"#E4E1D9"} strokeWidth="1">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function VendorReviews({ showToast }) {
  const [reviews, setReviews] = useState(REVIEWS);
  const [replyText, setReplyText] = useState({});
  const [replyOpen, setReplyOpen] = useState({});

  const avgRating = (reviews.reduce((s,r) => s+r.rating, 0) / reviews.length).toFixed(1);
  const dist = [5,4,3,2,1].map(r => ({ r, count: reviews.filter(x=>x.rating===r).length, pct: Math.round(reviews.filter(x=>x.rating===r).length / reviews.length * 100) }));

  const sendReply = (id) => {
    const text = replyText[id];
    if (!text?.trim()) return;
    setReviews(prev => prev.map(r => r.id===id ? {...r, replied:true} : r));
    setReplyOpen(prev => ({...prev, [id]:false}));
    setReplyText(prev => ({...prev, [id]:""}));
    showToast("Reply posted!");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Reviews & Ratings" sub={`${reviews.length} reviews · ${reviews.filter(r=>!r.replied).length} awaiting reply`} />

      {/* Rating summary */}
      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:24, ...cardStyle }}>
        <div style={{ textAlign:"center", paddingRight:24, borderRight:`1px solid ${B.border}` }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:700, color:B.accent, lineHeight:1 }}>{avgRating}</div>
          <StarRow rating={Math.round(parseFloat(avgRating))} />
          <div style={{ fontSize:11, color:B.textMuted, marginTop:6 }}>{reviews.length} reviews</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, justifyContent:"center" }}>
          {dist.map(d => (
            <div key={d.r} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ fontSize:11, color:B.textMuted, width:14, textAlign:"right", flexShrink:0 }}>{d.r}</div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4AF6A" stroke="#D4AF6A" strokeWidth="1" style={{ flexShrink:0 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <div style={{ flex:1, height:7, borderRadius:4, background:B.bg, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${d.pct}%`, background:B.accent, borderRadius:4 }} />
              </div>
              <div style={{ fontSize:11, color:B.textMuted, width:28, flexShrink:0 }}>{d.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Review list */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {reviews.map(r => (
          <div key={r.id} style={{ ...cardStyle }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:B.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>
                  {r.customer.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text }}>{r.customer}</div>
                  <div style={{ fontSize:10, color:B.textMuted }}>{r.event} · {formatDate(r.date)}</div>
                </div>
              </div>
              <StarRow rating={r.rating} />
            </div>
            <div style={{ fontSize:13, color:B.textMuted, lineHeight:1.6, marginBottom:10 }}>"{r.text}"</div>
            {r.replied ? (
              <div style={{ background:B.accentSoft, borderRadius:8, padding:"8px 12px", fontSize:12, color:B.textMuted, borderLeft:`3px solid ${B.accent}` }}>
                ✅ You have replied to this review
              </div>
            ) : (
              <div>
                {replyOpen[r.id] ? (
                  <div>
                    <textarea value={replyText[r.id]||""} onChange={e=>setReplyText(p=>({...p,[r.id]:e.target.value}))} placeholder="Write a professional reply..." rows={3} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:13, color:B.text, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", marginBottom:8 }} />
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => sendReply(r.id)} style={{ flex:1, padding:"9px", borderRadius:9, background:B.primary, color:"#fff", fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>Post Reply</button>
                      <button onClick={() => setReplyOpen(p=>({...p,[r.id]:false}))} style={{ padding:"9px 14px", borderRadius:9, background:B.bg, color:B.textMuted, fontWeight:600, fontSize:12, border:`1px solid ${B.border}`, cursor:"pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyOpen(p=>({...p,[r.id]:true}))} style={{ fontSize:12, fontWeight:700, color:B.accent, background:"none", border:"none", cursor:"pointer" }}>↩ Reply to review</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
