"use client";

import { ArrowLeft, Boxes, Database, GitBranch, Link2, Network, RefreshCw, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

function titleCase(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function demoGraph() {
  const entities = [
    { id: "customer-alpha", entity_type: "customer", display_name: "Alpha Industrial Systems", canonical_key: "alpha-industrial-systems", attributes: {} },
    { id: "order-gx42", entity_type: "order", display_name: "SO-10482 · GX-42 Replacement", canonical_key: "so-10482", attributes: { value: 180000 } },
    { id: "product-gx42", entity_type: "product", display_name: "GX-42 Gearbox Assembly", canonical_key: "gx-42-gearbox-assembly", attributes: { partNumber: "GX42-BA-17" } },
    { id: "supplier-apex", entity_type: "supplier", display_name: "Apex Machining", canonical_key: "apex-machining", attributes: {} },
    { id: "asset-press", entity_type: "asset", display_name: "Press Line 3", canonical_key: "press-line-3", attributes: {} },
    { id: "gage-bore", entity_type: "asset", display_name: "G-1014 Bore Gage Set", canonical_key: "g-1014-bore-gage-set", attributes: {} },
    { id: "owner-quality", entity_type: "person", display_name: "Quality Manager", canonical_key: "quality-manager", attributes: {} },
    { id: "record-complaint", entity_type: "record", display_name: "CC-2026-0047 · Customer Assurance", canonical_key: "customer-assurance-cc-2026-0047", attributes: { sourceTool: "customer-assurance" } },
  ];
  const relationships = [
    { id: "r1", left_entity_id: "record-complaint", right_entity_id: "customer-alpha", relationship_type: "affects_customer", source_event_id: "e1", confidence: 100 },
    { id: "r2", left_entity_id: "record-complaint", right_entity_id: "order-gx42", relationship_type: "affects_order", source_event_id: "e1", confidence: 100 },
    { id: "r3", left_entity_id: "record-complaint", right_entity_id: "product-gx42", relationship_type: "affects_product", source_event_id: "e1", confidence: 100 },
    { id: "r4", left_entity_id: "record-complaint", right_entity_id: "supplier-apex", relationship_type: "involves_supplier", source_event_id: "e1", confidence: 90 },
    { id: "r5", left_entity_id: "record-complaint", right_entity_id: "gage-bore", relationship_type: "involves_asset", source_event_id: "e1", confidence: 100 },
    { id: "r6", left_entity_id: "record-complaint", right_entity_id: "owner-quality", relationship_type: "owned_by", source_event_id: "e1", confidence: 100 },
  ];
  const events = [{ id: "e1", event_title: "Critical customer recovery · Alpha Industrial Systems", source_tool: "customer-assurance", source_record_key: "CC-2026-0047", severity: "critical", summary: "Customer complaint, replacement delivery, measurement containment, supplier recovery, and corrective action are connected to one business event." }];
  const eventEntities = entities.map((entity) => ({ event_id: "e1", entity_id: entity.id, entity_role: entity.entity_type === "record" ? "source_record" : entity.entity_type }));
  return { entities, relationships, events, eventEntities };
}

export default function NorthstarEntityGraph() {
  const cloud = useCloudWorkspace();
  const demo = useMemo(() => demoGraph(), []);
  const [entities, setEntities] = useState(demo.entities);
  const [relationships, setRelationships] = useState(demo.relationships);
  const [events, setEvents] = useState(demo.events);
  const [eventEntities, setEventEntities] = useState(demo.eventEntities);
  const [selectedId, setSelectedId] = useState(demo.entities[0].id);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [mode, setMode] = useState("demo");
  const [notice, setNotice] = useState("Design-partner entity graph loaded.");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (cloud.status === "ready" && cloud.organizationId) loadSecure(false); }, [cloud.status, cloud.organizationId]);

  async function loadSecure(showNotice = true) {
    if (!cloud.organizationId) { setNotice("Sign in to Northstar Secure to load the tenant entity graph."); return; }
    const supabase = createClient(); if (!supabase) return;
    setBusy(true);
    try {
      const [entityResult, relationshipResult, eventEntityResult, eventResult] = await Promise.all([
        supabase.from("northstar_entities").select("*").eq("organization_id", cloud.organizationId).order("last_seen_at", { ascending: false }).limit(500),
        supabase.from("northstar_entity_relationships").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(1000),
        supabase.from("northstar_event_entities").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(1500),
        supabase.from("northstar_intelligence_events").select("id,event_title,source_tool,source_record_key,severity,summary,source_path").eq("organization_id", cloud.organizationId).order("source_submitted_at", { ascending: false }).limit(300),
      ]);
      const error = [entityResult, relationshipResult, eventEntityResult, eventResult].find((result) => result.error)?.error;
      if (error) throw error;
      if (!entityResult.data?.length) { if (showNotice) setNotice("The Entity Graph is active. Submit a connected tool record to create the first live relationships."); return; }
      setEntities(entityResult.data || []); setRelationships(relationshipResult.data || []); setEventEntities(eventEntityResult.data || []); setEvents(eventResult.data || []); setSelectedId(entityResult.data[0].id); setMode("secure");
      if (showNotice) setNotice(`${entityResult.data.length} entities and ${relationshipResult.data?.length || 0} evidence-backed relationships synchronized.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "The Entity Graph could not synchronize."); }
    finally { setBusy(false); }
  }

  function loadDemo() { const value = demoGraph(); setEntities(value.entities); setRelationships(value.relationships); setEvents(value.events); setEventEntities(value.eventEntities); setSelectedId(value.entities[0].id); setMode("demo"); setNotice("Design-partner entity graph loaded."); }

  const types = useMemo(() => [...new Set(entities.map((item) => item.entity_type))].sort(), [entities]);
  const filtered = useMemo(() => entities.filter((item) => (typeFilter === "all" || item.entity_type === typeFilter) && `${item.display_name} ${item.canonical_key}`.toLowerCase().includes(search.toLowerCase())), [entities, search, typeFilter]);
  const selected = entities.find((item) => item.id === selectedId) || filtered[0] || entities[0];
  const selectedRelationships = relationships.filter((item) => item.left_entity_id === selected?.id || item.right_entity_id === selected?.id);
  const related = selectedRelationships.map((relationship) => {
    const otherId = relationship.left_entity_id === selected?.id ? relationship.right_entity_id : relationship.left_entity_id;
    return { relationship, entity: entities.find((item) => item.id === otherId) };
  }).filter((item) => item.entity);
  const linkedEventIds = new Set(eventEntities.filter((item) => item.entity_id === selected?.id).map((item) => item.event_id));
  const linkedEvents = events.filter((item) => linkedEventIds.has(item.id));
  const typeCounts = types.map((type) => ({ type, count: entities.filter((item) => item.entity_type === type).length })).sort((a, b) => b.count - a.count);

  return <main className="eg-shell">
    <header className="eg-header"><a href="/" className="back"><ArrowLeft size={18}/></a><div className="brand"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/></div><div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar"/></div><div className="header-copy"><small>NORTHSTAR CLOSED-LOOP EXECUTION</small><strong>Entity Graph</strong></div><span className={`mode ${mode}`}>{mode === "secure" ? "Secure connected graph" : "Design-partner demonstration"}</span></header>

    <section className="hero"><div><div className="eyebrow"><Network size={17}/> CUSTOMERS · ORDERS · PRODUCTS · SUPPLIERS · ASSETS · PEOPLE · RECORDS</div><h1>See one business event across every department and Northstar application.</h1><p>The Entity Graph links the real-world people, customers, orders, products, suppliers, assets, sites, and controlled records referenced by Intelligence Bus events. Every relationship retains its originating event instead of relying on an unexplained AI assumption.</p><div className="chips"><span>{entities.length} entities</span><span>{relationships.length} relationships</span><span>{events.length} source events</span><span>Human-governed identity</span></div></div><article className="graph-card"><Network size={34}/><strong>{relationships.length}</strong><span>evidence-backed relationships</span><div><Database/><GitBranch/><Link2/><ShieldCheck/></div></article></section>

    <section className="toolbar"><button onClick={loadDemo}><Sparkles size={16}/>Load scenario</button><button onClick={() => loadSecure(true)} disabled={busy}><RefreshCw size={16}/>{busy ? "Synchronizing..." : "Sync secure graph"}</button><a href="/workforce-operations"><Network size={16}/>Open AI Workforce</a></section>
    {notice && <div className="notice">{notice}</div>}

    <section className="metrics"><article><small>Entities</small><strong>{entities.length}</strong><span>Normalized operating identities</span></article><article><small>Relationships</small><strong>{relationships.length}</strong><span>Source-event traceable</span></article><article><small>Connected events</small><strong>{events.length}</strong><span>Cross-tool operating context</span></article><article><small>Entity types</small><strong>{types.length}</strong><span>{types.join(" · ")}</span></article></section>

    <section className="workspace">
      <article className="panel browser"><div className="panel-title"><div><small>ENTITY REGISTER</small><h2>Connected operating identities</h2></div><Boxes size={23}/></div><div className="filters"><label><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search entity or key"/></label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All entity types</option>{types.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}</select></div><div className="type-strip">{typeCounts.map((item) => <button key={item.type} onClick={() => setTypeFilter(item.type)}><span>{titleCase(item.type)}</span><strong>{item.count}</strong></button>)}</div><div className="entity-list">{filtered.map((entity) => <button key={entity.id} className={selected?.id === entity.id ? "entity active" : "entity"} onClick={() => setSelectedId(entity.id)}><span className={`type ${entity.entity_type}`}>{entity.entity_type.slice(0, 2).toUpperCase()}</span><span><strong>{entity.display_name}</strong><small>{titleCase(entity.entity_type)} · {entity.canonical_key}</small></span></button>)}</div></article>

      <article className="panel detail"><div className="panel-title"><div><small>SELECTED ENTITY</small><h2>{selected?.display_name || "No entity selected"}</h2></div><Users size={23}/></div>{selected && <><div className="identity"><span className={`type large ${selected.entity_type}`}>{selected.entity_type.slice(0, 2).toUpperCase()}</span><div><strong>{titleCase(selected.entity_type)}</strong><small>Canonical key: {selected.canonical_key}</small></div></div><div className="attributes"><h3>Controlled attributes</h3><pre>{JSON.stringify(selected.attributes || {}, null, 2)}</pre></div><div className="related"><h3>Related entities</h3>{related.length ? related.map(({ relationship, entity }) => <article key={relationship.id}><span className={`type ${entity.entity_type}`}>{entity.entity_type.slice(0, 2).toUpperCase()}</span><div><strong>{entity.display_name}</strong><small>{titleCase(relationship.relationship_type)} · Confidence {relationship.confidence}%</small></div></article>) : <p>No relationships are available for this entity yet.</p>}</div><div className="events"><h3>Source Intelligence Bus events</h3>{linkedEvents.length ? linkedEvents.map((event) => <article key={event.id}><span className={`severity ${event.severity}`}>{event.severity}</span><div><strong>{event.event_title}</strong><small>{titleCase(event.source_tool)} · {event.source_record_key}</small><p>{event.summary}</p></div></article>) : <p>No source events are linked.</p>}</div></>}</article>
    </section>

    <p className="boundary"><strong>Boundary:</strong> The Entity Graph identifies and connects operating context; it does not merge customer, supplier, employee, product, or financial master records without human governance.</p>
    <style>{`
      *{box-sizing:border-box}body{margin:0;background:#edf3f8;color:#10253a;font-family:Inter,Arial,sans-serif}.eg-shell{min-height:100vh;padding-bottom:70px}.eg-header{position:sticky;top:0;z-index:20;min-height:68px;display:flex;align-items:center;gap:13px;padding:8px 20px;border-bottom:1px solid #294b68;color:white;background:linear-gradient(90deg,#06172b,#0b365e)}.back{width:38px;height:38px;display:grid;place-items:center;border:1px solid #426787;border-radius:10px;color:white}.brand,.northstar{height:46px;display:flex;align-items:center;padding:4px 8px;border-radius:10px;background:white}.northstar{background:#020914}.brand img,.northstar img{max-width:150px;max-height:38px}.header-copy{margin-right:auto}.header-copy small,.header-copy strong{display:block}.header-copy small{color:#94c0e5;font-size:9px;letter-spacing:.13em;font-weight:900}.mode{padding:8px 11px;border-radius:999px;font-size:10px;font-weight:900}.mode.secure{color:#c7f4e2;background:#146143}.mode.demo{color:#ffe7aa;background:#6b4c14}.hero{max-width:1500px;margin:22px auto 0;display:grid;grid-template-columns:1.35fr .65fr;gap:18px;padding:0 22px}.hero>div,.graph-card{padding:28px;border-radius:23px;color:white;background:linear-gradient(135deg,#07192c,#0b477c 65%,#0a66ff);box-shadow:0 22px 60px rgba(9,48,83,.23)}.eyebrow{display:flex;align-items:center;gap:7px;color:#9ed5ff;font-size:10px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:940px;margin:13px 0;font-size:clamp(31px,4vw,56px);line-height:1.03}.hero p{max-width:930px;margin:0;color:#d7e9f7;line-height:1.65}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.chips span{padding:7px 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.08);font-size:9px;font-weight:850}.graph-card{display:grid;place-items:center;align-content:center;text-align:center;background:linear-gradient(150deg,#07192c,#0a3158)}.graph-card>strong{margin-top:10px;font-size:54px}.graph-card>span{color:#a9c8e2;font-size:11px;font-weight:850}.graph-card>div{display:flex;gap:15px;margin-top:20px;color:#7fdbff}.toolbar,.notice,.metrics,.workspace,.boundary{max-width:1500px;margin-left:auto;margin-right:auto}.toolbar{display:flex;gap:9px;flex-wrap:wrap;padding:15px 22px 0}.toolbar button,.toolbar a{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 13px;border:1px solid #b9cddd;border-radius:10px;color:#214d70;background:white;font-size:11px;font-weight:850;text-decoration:none;cursor:pointer}.notice{margin-top:13px;padding:11px 14px;border:1px solid #9dc8eb;border-radius:11px;color:#174d78;background:#e9f5ff;font-size:12px;font-weight:800}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;padding:16px 22px 0}.metrics article,.panel{border:1px solid #d9e4ec;border-radius:18px;background:white;box-shadow:0 12px 30px rgba(23,52,76,.07)}.metrics article{padding:17px}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70869a;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.metrics strong{margin-top:7px;font-size:28px}.metrics span{margin-top:4px;color:#60778c;font-size:10px}.workspace{display:grid;grid-template-columns:.85fr 1.15fr;gap:18px;padding:17px 22px 0}.panel{padding:19px}.panel-title{display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-title small{color:#0a66ff;font-size:9px;font-weight:900;letter-spacing:.12em}.panel-title h2{margin:5px 0 0}.filters{display:grid;grid-template-columns:1fr 180px;gap:9px;margin-top:15px}.filters label{display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid #cbd8e2;border-radius:10px}.filters input,.filters select,.filters>select{width:100%;min-height:40px;border:0;outline:0;background:white}.filters>select{padding:0 10px;border:1px solid #cbd8e2;border-radius:10px}.type-strip{display:flex;gap:7px;overflow:auto;margin-top:12px;padding-bottom:4px}.type-strip button{min-width:105px;display:flex;justify-content:space-between;gap:9px;padding:8px 9px;border:1px solid #d4e0e9;border-radius:9px;color:#426078;background:#f5f8fa;font-size:9px;font-weight:850;cursor:pointer}.entity-list{display:grid;gap:8px;max-height:650px;overflow:auto;margin-top:13px}.entity{display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #d8e2ea;border-radius:12px;text-align:left;background:white;cursor:pointer}.entity.active{border-color:#63a7e5;background:#edf7ff}.entity>span:nth-child(2){min-width:0}.entity strong,.entity small{display:block}.entity strong{color:#162c40}.entity small{margin-top:4px;color:#74899b;font-size:9px}.type{width:33px;height:33px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;color:#07509b;background:#dff0ff;font-size:9px;font-weight:950}.type.customer{color:#7b3f05;background:#fff0d7}.type.supplier{color:#6b2e72;background:#f5e4f7}.type.asset{color:#236041;background:#e2f6ea}.type.person{color:#8a3d2c;background:#ffe8e2}.type.order{color:#6a4b00;background:#fff3bf}.type.record{color:#164d7c;background:#e1f1ff}.type.large{width:52px;height:52px;border-radius:14px;font-size:13px}.identity{display:flex;align-items:center;gap:12px;margin-top:18px;padding:15px;border-radius:14px;background:#f0f6fb}.identity strong,.identity small{display:block}.identity small{margin-top:4px;color:#72889a}.attributes,.related,.events{margin-top:17px}.attributes h3,.related h3,.events h3{margin:0 0 10px}.attributes pre{max-height:180px;overflow:auto;margin:0;padding:12px;border-radius:11px;color:#dceeff;background:#07192c;font-size:10px}.related{display:grid;gap:8px}.related h3{grid-column:1/-1}.related article{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #dbe5ed;border-radius:11px}.related strong,.related small{display:block}.related small{margin-top:4px;color:#71869a;font-size:9px}.related p,.events>p{color:#71869a}.events article{display:flex;gap:10px;padding:12px 0;border-top:1px solid #e0e8ee}.events strong,.events small{display:block}.events small{margin-top:4px;color:#6e8395;font-size:9px}.events p{margin:6px 0 0;color:#4b657a;font-size:11px;line-height:1.5}.severity{height:max-content;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:950;text-transform:uppercase}.severity.critical{color:#8f1f2c;background:#ffe7ea}.severity.high{color:#85520a;background:#fff0d5}.severity.medium{color:#19517e;background:#e6f3ff}.severity.low{color:#22704f;background:#e5f8ef}.boundary{margin-top:17px;padding:13px 22px;color:#5d7488;font-size:11px;line-height:1.55}@media(max-width:950px){.hero,.workspace{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}.eg-header .brand,.eg-header .northstar{display:none}}@media(max-width:600px){.metrics{grid-template-columns:1fr}.filters{grid-template-columns:1fr}.eg-header{padding:8px 10px}.mode{display:none}.hero,.workspace,.metrics,.toolbar{padding-left:12px;padding-right:12px}.notice{margin-left:12px;margin-right:12px}.hero h1{font-size:34px}}
    `}</style>
  </main>;
}
