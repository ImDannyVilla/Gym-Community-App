import { useState } from "react";

const C = {
  bg: "#0B0B0B", surface: "#161616", card: "#1E1E1E",
  border: "#252525", accent: "#C5F74F", accentDim: "#7A9A28",
  text: "#F0F0F0", muted: "#666", red: "#FF3B3B", white: "#fff",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; } input, textarea, button { font-family: 'Barlow', sans-serif; }
::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }`;

// ─────────────── SHARED COMPONENTS ───────────────
const Btn = ({ children, onClick, variant = "accent", style = {} }) => (
  <button onClick={onClick} style={{
    background: variant === "accent" ? C.accent : variant === "ghost" ? "transparent" : variant === "surface" ? C.surface : "transparent",
    border: variant === "ghost" ? `1px solid ${C.border}` : variant === "red" ? `1px solid ${C.red}` : "none",
    color: variant === "accent" ? "#000" : variant === "red" ? C.red : C.text,
    borderRadius: 10, padding: "8px 16px", fontWeight: 800, fontSize: 13,
    cursor: "pointer", letterSpacing: 0.3, ...style,
  }}>{children}</button>
);

const Tag = ({ children, color = C.accent }) => (
  <span style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 9px", fontSize: 11, color, fontWeight: 700 }}>{children}</span>
);

// ─────────────── BOTTOM NAV ───────────────
const HIDE_NAV = ["logWorkout", "saveWorkout", "explore", "programDetail"];
function BottomNav({ active, nav }) {
  if (HIDE_NAV.includes(active)) return null;
  const tabs = [["feed","⚡","Feed"],["workout","🏋️","Workout"],["checkin","📱","Check In"],["profile","👤","Me"]];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 68, background: C.surface, borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
      {tabs.map(([id, icon, label]) => (
        <button key={id} onClick={() => nav(id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active === id ? C.accent : C.muted, padding: 0, position: "relative" }}>
          {active === id && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, background: C.accent, borderRadius: "0 0 3px 3px" }} />}
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────── SCREENS ───────────────
function FeedScreen({ nav }) {
  const posts = [
    { user: "alexfit", time: "2h", desc: "New PR on bench! 225lbs × 5 🔥 feeling unstoppable", workout: "Push Day A", emoji: "🏋️", likes: 42 },
    { user: "sara_moves", time: "5h", desc: "Morning flow session. Start every day intentional 🌅", workout: null, emoji: "🧘", likes: 31 },
    { user: "mikegains", time: "8h", desc: "5k in 22min. Back-to-back cardio weeks paying off", workout: "Cardio Burn", emoji: "🏃", likes: 18 },
  ];
  return (
    <div style={{ background: C.bg, height: "100%", overflowY: "auto", paddingBottom: 68 }}>
      <div style={{ padding: "18px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.accent, letterSpacing: 3 }}>GRIND</span>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ fontSize: 20, cursor: "pointer" }}>🔔</span>
          <span style={{ fontSize: 20, cursor: "pointer" }}>✉️</span>
        </div>
      </div>
      {/* Stories */}
      <div style={{ display: "flex", gap: 10, padding: "0 16px 14px", overflowX: "auto" }}>
        {["you","alex","sara","mike","jess","tony","ray"].map((u, i) => (
          <div key={u} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: i === 0 ? C.card : `${C.accent}22`, border: i === 0 ? `2px dashed ${C.border}` : `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: i === 0 ? 20 : 16, color: C.accent }}>
              {i === 0 ? "+" : u[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 10, color: C.muted }}>{u}</span>
          </div>
        ))}
      </div>
      {posts.map((p, i) => (
        <div key={i} style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: 2, background: C.surface }}>
          <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000", flexShrink: 0 }}>{p.user[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{p.user}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{p.time} ago</div>
            </div>
            <Btn variant="ghost" style={{ padding: "4px 12px", fontSize: 11, borderColor: C.accentDim, color: C.accent }}>Follow</Btn>
          </div>
          <div style={{ height: 200, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{p.emoji}</div>
          <div style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
              {["🤍","💬","↗️"].map(e => <span key={e} style={{ fontSize: 20, cursor: "pointer" }}>{e}</span>)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>{p.likes} likes</div>
            <div style={{ fontSize: 12, color: C.text }}><span style={{ fontWeight: 700 }}>{p.user}</span> {p.desc}</div>
            {p.workout && (
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 10px" }}>
                <span style={{ fontSize: 11 }}>🏋️</span>
                <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>{p.workout}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkoutScreen({ nav }) {
  const routines = [
    { name: "Push Day A", count: 6 }, { name: "Pull Day B", count: 5 },
    { name: "Leg Day C", count: 7 }, { name: "Upper Body", count: 5 }, { name: "Cardio Burn", count: 4 },
  ];
  return (
    <div style={{ background: C.bg, height: "100%", overflowY: "auto", paddingBottom: 68 }}>
      <div style={{ padding: "18px 16px 8px" }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Wednesday, March 4</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.text, letterSpacing: 1, lineHeight: 1 }}>MY WORKOUTS</div>
      </div>
      {/* Bubble stats */}
      <div style={{ margin: "12px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 8px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[["47","Workouts"],["384","Sets Done"],["12 🔥","Day Streak"]].map(([v,l]) => (
          <div key={l} style={{ textAlign: "center", padding: "0 4px" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: C.accent, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Quick start */}
      <div style={{ padding: "0 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => nav("logWorkout")} style={{ background: "transparent", border: `2px dashed ${C.border}`, borderRadius: 14, padding: "18px 10px", color: C.text, cursor: "pointer", textAlign: "center" }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>⚡</div>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Empty Workout</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Start fresh</div>
        </button>
        <button onClick={() => nav("explore")} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 10px", color: C.text, cursor: "pointer", textAlign: "center" }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>🔍</div>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Explore</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Find programs</div>
        </button>
      </div>
      {/* Routines */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: C.text }}>My Routines</div>
          <button style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", color: C.muted, cursor: "pointer", fontSize: 13 }}>📁 +</button>
        </div>
        {routines.map((r, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{r.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.count} exercises</div>
            </div>
            <Btn onClick={() => nav("logWorkout")} style={{ padding: "6px 14px", fontSize: 12 }}>Start</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogWorkoutScreen({ nav }) {
  const [sets, setSets] = useState([{ set: 1, prev: "135×8", lbs: "", reps: "" }]);
  return (
    <div style={{ background: C.bg, height: "100%", overflowY: "auto", paddingBottom: 20 }}>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.bg, borderBottom: `1px solid ${C.border}`, zIndex: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: C.text }}>Log Workout</div>
        <Btn onClick={() => nav("saveWorkout")}>Finish</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "13px 16px", borderBottom: `1px solid ${C.border}` }}>
        {[["⏱","0:14:22","Duration"],["⚖️","1,215 lbs","Volume"],["✅","6","Sets"]].map(([ic,v,l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{l}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Empty state */}
      <div style={{ padding: "30px 16px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💪</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Get Started</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Add exercises to begin logging</div>
        <Btn variant="ghost" style={{ width: "100%", padding: "12px", fontSize: 14, borderStyle: "dashed" }}>+ Add Exercise</Btn>
      </div>
      {/* Exercise card */}
      <div style={{ margin: "0 16px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.accent }}>Bench Press</div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 14, color: C.muted, cursor: "pointer" }}>⏱ Rest</span>
            <span style={{ fontSize: 14, color: C.muted, cursor: "pointer" }}>•••</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 62px 56px 30px", gap: 6, padding: "8px 14px", borderBottom: `1px solid ${C.border}` }}>
          {["Set","Previous","lbs","Reps","✓"].map((h,i) => (
            <div key={i} style={{ fontSize: 10, color: C.muted, textAlign: i > 0 ? "center" : "left", textTransform: "uppercase", fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {sets.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 62px 56px 30px", gap: 6, padding: "7px 14px", alignItems: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.muted }}>{s.set}</div>
            <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>{s.prev}</div>
            <input placeholder="0" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 2px", textAlign: "center", color: C.text, fontSize: 13, fontWeight: 800, width: "100%", outline: "none" }} />
            <input placeholder="0" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 2px", textAlign: "center", color: C.text, fontSize: 13, fontWeight: 800, width: "100%", outline: "none" }} />
            <div style={{ width: 20, height: 20, border: `1.5px solid ${C.border}`, borderRadius: 5, cursor: "pointer" }} />
          </div>
        ))}
        <div style={{ padding: "0 14px 12px", display: "flex", gap: 8 }}>
          <button onClick={() => setSets([...sets, { set: sets.length + 1, prev: "—", lbs: "", reps: "" }])} style={{ flex: 1, background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "8px", color: C.muted, fontSize: 11, cursor: "pointer" }}>+ Add Set</button>
          <button style={{ flex: 1, background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "8px", color: C.muted, fontSize: 11, cursor: "pointer" }}>+ Warmup</button>
        </div>
      </div>
      <button style={{ display: "block", width: "calc(100% - 32px)", margin: "0 16px", background: "transparent", border: `2px dashed ${C.border}`, borderRadius: 12, padding: "14px", color: C.accent, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Add Exercise</button>
    </div>
  );
}

function SaveWorkoutScreen({ nav }) {
  const [vis, setVis] = useState("Everyone");
  return (
    <div style={{ background: C.bg, height: "100%", overflowY: "auto", paddingBottom: 30 }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <button onClick={() => nav("logWorkout")} style={{ background: "none", border: "none", color: C.text, fontSize: 22, cursor: "pointer" }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 16, color: C.text }}>Save Workout</div>
        <Btn onClick={() => nav("workout")}>Save</Btn>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 11 }}>
        <input placeholder="Workout Title" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, padding: "13px 15px", color: C.text, fontSize: 16, fontWeight: 700, outline: "none", width: "100%" }} />
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 15 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: C.muted, marginBottom: 11, textTransform: "uppercase", letterSpacing: 1 }}>Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[["⏱","54 min","Duration"],["⚖️","12,400","Volume"],["✅","24","Sets"]].map(([ic,v,l]) => (
              <div key={l} style={{ textAlign: "center", background: C.card, borderRadius: 10, padding: "10px 4px" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{ic}</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: C.accent }}>{v}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>📅 When</span>
          <span style={{ fontSize: 13, color: C.muted }}>Wed, March 4, 2026</span>
        </div>
        <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 13, padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
          <span style={{ fontSize: 26 }}>📷</span>
          <span style={{ fontSize: 12, color: C.muted }}>Add photo or video</span>
        </div>
        <textarea placeholder="Add a description..." rows={3} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 15px", color: C.text, fontSize: 13, outline: "none", resize: "none", width: "100%", fontFamily: "inherit" }} />
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 15px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 10 }}>👁 Visibility</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Everyone","Private"].map(v => (
              <button key={v} onClick={() => setVis(v)} style={{ flex: 1, background: vis === v ? C.accent : "transparent", border: `1px solid ${vis === v ? C.accent : C.border}`, borderRadius: 9, padding: "9px", fontWeight: 800, fontSize: 12, color: vis === v ? "#000" : C.muted, cursor: "pointer" }}>{v}</button>
            ))}
          </div>
        </div>
        <button onClick={() => nav("workout")} style={{ background: "transparent", border: `1px solid ${C.red}`, borderRadius: 12, padding: "13px", color: C.red, fontWeight: 800, fontSize: 13, cursor: "pointer", width: "100%" }}>Discard Workout</button>
      </div>
    </div>
  );
}

function ExploreScreen({ nav }) {
  const programs = [
    { name: "5×5 Strength Builder", level: "Intermediate", routines: 3, desc: "Classic compound-focused strength program", emoji: "🏋️" },
    { name: "Hypertrophy Max", level: "Advanced", routines: 5, desc: "Volume-based muscle building split", emoji: "💪" },
    { name: "Beginner Foundations", level: "Beginner", routines: 3, desc: "Start your fitness journey right", emoji: "⚡" },
    { name: "Athletic Performance", level: "Intermediate", routines: 4, desc: "Power, speed and functional strength", emoji: "🏃" },
  ];
  return (
    <div style={{ background: C.bg, height: "100%", overflowY: "auto", paddingBottom: 30 }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => nav("workout")} style={{ background: "none", border: "none", color: C.text, fontSize: 22, cursor: "pointer" }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: C.text }}>Explore Programs</div>
      </div>
      <div style={{ padding: "11px 16px", display: "flex", gap: 7, borderBottom: `1px solid ${C.border}` }}>
        {[["⚙️ Filters","ghost"],["Level ▾","ghost"],["Duration ▾","ghost"]].map(([label]) => (
          <button key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px", color: C.text, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>{label}</button>
        ))}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: C.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>Programs</div>
        {programs.map((p, i) => (
          <div key={i} onClick={() => nav("programDetail")} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, marginBottom: 11, overflow: "hidden", cursor: "pointer", display: "flex" }}>
            <div style={{ width: 80, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, flexShrink: 0 }}>{p.emoji}</div>
            <div style={{ padding: "11px 12px", flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 13, color: C.text, marginBottom: 3 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 7 }}>{p.desc}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Tag>{p.level}</Tag>
                <Tag color={C.muted}>{p.routines} routines</Tag>
              </div>
            </div>
            <div style={{ padding: "10px 10px 0", color: C.muted, fontSize: 16 }}>🔖</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramDetailScreen({ nav }) {
  const routines = [
    { name: "Push Day A", exs: ["Bench Press 4×8", "OHP 3×10", "Lateral Raise 3×15", "Tricep Dips 3×12"] },
    { name: "Pull Day B", exs: ["Deadlift 4×5", "Barbell Row 4×8", "Pull-up 3×10", "Face Pull 3×15"] },
    { name: "Leg Day C", exs: ["Squat 4×8", "Leg Press 3×12", "Leg Curl 3×15", "Calf Raise 4×20"] },
  ];
  return (
    <div style={{ background: C.bg, height: "100%", overflowY: "auto", paddingBottom: 80 }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => nav("explore")} style={{ background: "none", border: "none", color: C.text, fontSize: 22, cursor: "pointer" }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 16, color: C.text }}>Program Detail</div>
        <span style={{ fontSize: 20, cursor: "pointer" }}>🔖</span>
      </div>
      <div style={{ height: 150, background: `linear-gradient(135deg, #1A2200 0%, #0B1A00 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏋️</div>
      <div style={{ padding: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 1, lineHeight: 1, marginBottom: 8 }}>5×5 STRENGTH BUILDER</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>Build raw strength with the classic 5×5 methodology. Focused on compound movements and progressive overload. Ideal for lifters ready to push past plateaus.</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
          <Tag>Intermediate</Tag>
          <Tag color={C.muted}>3 routines</Tag>
          <Tag color={C.muted}>3×/week</Tag>
          <Tag color={C.muted}>~60 min/session</Tag>
        </div>
        <div style={{ fontWeight: 700, fontSize: 11, color: C.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>Routines</div>
        {routines.map((r, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 15px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: C.accent }}>{r.name}</div>
            </div>
            <div style={{ padding: "10px 15px" }}>
              {r.exs.map((e, j) => (
                <div key={j} style={{ fontSize: 12, color: C.muted, padding: "4px 0", borderBottom: j < r.exs.length - 1 ? `1px solid ${C.border}` : "none" }}>• {e}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "sticky", bottom: 0, padding: "12px 16px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <Btn onClick={() => nav("workout")} style={{ width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, letterSpacing: 1 }}>Save Program</Btn>
      </div>
    </div>
  );
}

function CheckInScreen() {
  const bars = Array.from({ length: 52 }, (_, i) => ({ w: [2,3,2,4,2,3,2,2][i%8], gap: i%13===0 ? 5 : 1 }));
  return (
    <div style={{ background: C.bg, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 18, paddingBottom: 88 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.text, letterSpacing: 3 }}>GYM CHECK-IN</div>
      <div style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>Show this at the front desk or scan at the entrance kiosk</div>
      <div style={{ background: "white", borderRadius: 16, padding: "22px 18px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 80 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ width: b.w, height: i%9===0 ? 64 : i%5===0 ? 80 : 72, background: "#111", marginLeft: b.gap - 1 }} />
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#111", letterSpacing: 5, fontFamily: "monospace" }}>MEMBER-00428</div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Member Since</div>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>January 2024</div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.accent}30`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Current Streak</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: C.accent, lineHeight: 1 }}>12 DAYS 🔥</div>
      </div>
    </div>
  );
}

function ProfileScreen() {
  const [chartMode, setChartMode] = useState("Duration");
  const data = { Duration: [3,5,4,6,3,4,5,3,6,4,5,4], Volume: [4,6,3,5,4,6,5,4,7,5,6,5], Sets: [2,4,3,5,2,4,3,5,4,3,5,4] };
  const vals = data[chartMode];
  const max = Math.max(...vals);
  const gridItems = ["🏋️","💪","🏃","🧘","⚡","🏋️","💪","🏃","🧘"];
  return (
    <div style={{ background: C.bg, height: "100%", overflowY: "auto", paddingBottom: 68 }}>
      <div style={{ padding: "18px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text, letterSpacing: 1 }}>MY PROFILE</div>
        <span style={{ fontSize: 20, cursor: "pointer" }}>⚙️</span>
      </div>
      <div style={{ padding: "18px 16px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 28, color: "#000", flexShrink: 0, border: `3px solid ${C.accentDim}` }}>D</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 17, color: C.text }}>Danny Villa</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>@dannyvilla · GRIND Member</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            {[["47","Workouts"],["128","Followers"],["64","Following"]].map(([v,l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 17, color: C.text }}>{v}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ margin: "0 16px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 15 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>Activity · Last 3 Months</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["Duration","Volume","Sets"].map(m => (
              <button key={m} onClick={() => setChartMode(m)} style={{ background: chartMode === m ? C.accent : C.card, border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: chartMode === m ? "#000" : C.muted, cursor: "pointer" }}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 56 }}>
          {vals.map((v, i) => (
            <div key={i} style={{ flex: 1, background: i === vals.length - 1 ? C.accent : `${C.accent}40`, borderRadius: "3px 3px 0 0", height: `${(v / max) * 100}%`, transition: "height 0.4s ease" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          {["Jan","Feb","Mar"].map(m => <span key={m} style={{ fontSize: 10, color: C.muted }}>{m}</span>)}
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 10 }}>Workout Log</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
          {gridItems.map((emoji, i) => (
            <div key={i} style={{ aspectRatio: "1", background: C.surface, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
              <span style={{ fontSize: 26 }}>{emoji}</span>
              <span style={{ fontSize: 9, color: C.muted }}>Mar {3 - Math.floor(i/3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────── FLOWCHART ───────────────
function FlowChart({ nav }) {
  const Node = ({ id, label, color, onClick }) => (
    <button onClick={onClick} style={{
      background: `${color}18`, border: `1.5px solid ${color}70`,
      borderRadius: 10, color, fontWeight: 800, fontSize: 12,
      cursor: "pointer", padding: "9px 10px", textAlign: "center",
      lineHeight: 1.3, fontFamily: "'Barlow', sans-serif",
      transition: "all 0.15s", width: "100%",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}35`; e.currentTarget.style.transform = "scale(1.03)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.transform = "scale(1)"; }}
    >{label}</button>
  );

  const Arrow = ({ label, dashed }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "3px 0" }}>
      {label && <span style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{label}</span>}
      <div style={{ width: 1.5, height: 18, background: dashed ? `repeating-linear-gradient(to bottom, ${C.accentDim} 0px, ${C.accentDim} 4px, transparent 4px, transparent 7px)` : C.border }} />
      <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${dashed ? C.accentDim : C.border}` }} />
    </div>
  );

  const HArrow = ({ label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
      {label && <span style={{ fontSize: 9, color: C.muted }}>{label}</span>}
      <div style={{ height: 1.5, width: 16, background: C.border }} />
      <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `6px solid ${C.border}` }} />
    </div>
  );

  return (
    <div style={{ padding: "16px 14px 24px" }}>
      <div style={{ fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 14, letterSpacing: 1.5, textTransform: "uppercase" }}>Tap any screen to preview →</div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {[["Main Tabs", C.accent], ["Sub-screens", "#5BA4FF"], ["Post-workout", "#FF9F40"]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: `${c}35`, border: `1.5px solid ${c}80` }} />
            <span style={{ fontSize: 10, color: C.muted }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Nav Bar */}
      <div style={{ border: `1.5px dashed ${C.accentDim}`, borderRadius: 12, padding: "10px 12px", marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>Bottom Navigation Bar</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {[["feed","⚡ Feed",C.accent],["workout","🏋️ Workout",C.accent],["checkin","📱 Check In",C.accent],["profile","👤 Profile",C.accent]].map(([id,label,color]) => (
            <Node key={id} id={id} label={label} color={color} onClick={() => nav(id)} />
          ))}
        </div>
      </div>

      {/* Arrow down to workout column */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Arrow label="Navigate" />
      </div>

      {/* Workout sub-screens */}
      <div style={{ border: `1px solid #5BA4FF40`, borderRadius: 12, padding: "10px 12px", marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: "#5BA4FF", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>Workout Sub-screens</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Node id="logWorkout" label="⚡ Log Workout" color="#5BA4FF" onClick={() => nav("logWorkout")} />
          <Node id="explore" label="🔍 Explore" color="#5BA4FF" onClick={() => nav("explore")} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px" }}>
          <Arrow label="Finish" />
          <Arrow label="Open" />
        </div>
        {/* Post-workout */}
        <div style={{ border: `1px solid #FF9F4040`, borderRadius: 10, padding: "10px 10px", background: "#FF9F4008" }}>
          <div style={{ fontSize: 10, color: "#FF9F40", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>Post-workout</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Node id="saveWorkout" label="💾 Save Workout" color="#FF9F40" onClick={() => nav("saveWorkout")} />
            <Node id="programDetail" label="📋 Program Detail" color="#FF9F40" onClick={() => nav("programDetail")} />
          </div>
        </div>
        {/* Save back to workout */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 6, marginTop: 8, paddingLeft: 8 }}>
          <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `6px solid ${C.accentDim}` }} />
          <div style={{ height: 1.5, flex: 1, background: `repeating-linear-gradient(to right, ${C.accentDim} 0px, ${C.accentDim} 5px, transparent 5px, transparent 9px)` }} />
          <span style={{ fontSize: 9, color: C.accentDim }}>Save → back to Workout tab</span>
        </div>
      </div>

      {/* Other top-level screens */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Arrow label="Navigate" />
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>Other Tabs</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Node id="checkin" label="📱 Check In" color={C.accent} onClick={() => nav("checkin")} />
          <Node id="profile" label="👤 Profile" color={C.accent} onClick={() => nav("profile")} />
        </div>
      </div>
    </div>
  );
}

// ─────────────── ROOT ───────────────
export default function GymAppProto() {
  const [view, setView] = useState("flowchart");
  const [screen, setScreen] = useState("feed");

  const nav = (s) => { setScreen(s); setView("screens"); };

  const renderScreen = () => {
    switch (screen) {
      case "feed":          return <FeedScreen nav={nav} />;
      case "workout":       return <WorkoutScreen nav={nav} />;
      case "logWorkout":    return <LogWorkoutScreen nav={nav} />;
      case "saveWorkout":   return <SaveWorkoutScreen nav={nav} />;
      case "explore":       return <ExploreScreen nav={nav} />;
      case "programDetail": return <ProgramDetailScreen nav={nav} />;
      case "checkin":       return <CheckInScreen />;
      case "profile":       return <ProfileScreen />;
      default:              return <FeedScreen nav={nav} />;
    }
  };

  const SCREEN_BTNS = [
    { id: "feed", label: "Feed" }, { id: "workout", label: "Workout" },
    { id: "logWorkout", label: "Log" }, { id: "saveWorkout", label: "Save" },
    { id: "explore", label: "Explore" }, { id: "programDetail", label: "Program" },
    { id: "checkin", label: "Check In" }, { id: "profile", label: "Profile" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#070707", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Barlow', sans-serif", color: C.text, paddingBottom: 40 }}>
      <style>{FONTS}</style>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 480, padding: "20px 20px 0" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.muted, letterSpacing: 4, marginBottom: 4 }}>GRIND APP</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 2, lineHeight: 1, marginBottom: 16 }}>FRONTEND BLUEPRINT</div>
        {/* View toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["flowchart","📊 Flow Map"],["screens","📱 Screens"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, background: view === v ? C.accent : C.surface, border: `1px solid ${view === v ? C.accent : C.border}`, borderRadius: 10, padding: "10px", fontWeight: 900, fontSize: 13, color: view === v ? "#000" : C.muted, cursor: "pointer", letterSpacing: 0.5, fontFamily: "'Barlow',sans-serif", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>
        {/* Screen picker (shown in screens view) */}
        {view === "screens" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {SCREEN_BTNS.map(s => (
              <button key={s.id} onClick={() => setScreen(s.id)} style={{ background: screen === s.id ? C.accent : C.surface, border: `1px solid ${screen === s.id ? C.accent : C.border}`, borderRadius: 8, padding: "5px 12px", fontWeight: 700, fontSize: 11, color: screen === s.id ? "#000" : C.muted, cursor: "pointer", fontFamily: "'Barlow',sans-serif", transition: "all 0.15s" }}>{s.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {view === "flowchart" ? (
        <div style={{ width: "100%", maxWidth: 560, marginTop: 10 }}>
          <FlowChart nav={nav} />
        </div>
      ) : (
        <div style={{ marginTop: 20, position: "relative" }}>
          {/* Phone frame */}
          <div style={{ width: 360, height: 720, background: C.bg, borderRadius: 44, overflow: "hidden", border: "7px solid #1C1C1C", boxShadow: "0 0 0 1px #333, 0 50px 100px rgba(0,0,0,0.9)", position: "relative" }}>
            {/* Notch / status bar */}
            <div style={{ height: 42, background: C.bg, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>9:41</span>
              <div style={{ width: 80, height: 20, background: "#111", borderRadius: 10 }} />
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.text }}>●●●</span>
                <span style={{ fontSize: 11, color: C.text }}>🔋</span>
              </div>
            </div>
            {/* Screen */}
            <div style={{ height: "calc(100% - 42px)", position: "relative", overflow: "hidden" }}>
              {renderScreen()}
              <BottomNav active={screen} nav={nav} />
            </div>
          </div>
          {/* Phone notch side buttons */}
          <div style={{ position: "absolute", left: -9, top: 120, width: 7, height: 36, background: "#1C1C1C", borderRadius: "4px 0 0 4px" }} />
          <div style={{ position: "absolute", left: -9, top: 166, width: 7, height: 36, background: "#1C1C1C", borderRadius: "4px 0 0 4px" }} />
          <div style={{ position: "absolute", right: -9, top: 150, width: 7, height: 60, background: "#1C1C1C", borderRadius: "0 4px 4px 0" }} />
        </div>
      )}
    </div>
  );
}
