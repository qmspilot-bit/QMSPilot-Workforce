"use client";

import { ArrowLeft, CheckCircle2, ClipboardCheck, FileUp, Save, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { FieldDef, WorkflowTool, WorkspaceConfig } from "@/lib/smart-workflow-config";
import { iconMap, makeRecordId, today } from "./shared";

type BranchSubmission={
 schema:string;workspace:string;toolId:string;toolName:string;recordId:string;organization:string;site:string;eventDate:string;
 values:Record<string,string>;owner:string;dueDate:string;priority:string;status:string;evidence:string[];submittedAt:string;
};

export function BranchGuidedWorkflow({config,tool,onBack}:{config:WorkspaceConfig;tool:WorkflowTool;onBack:()=>void}){
 const Icon=iconMap[tool.icon]??ClipboardCheck;
 const blank=Object.fromEntries(tool.fields.map(field=>[field.key,""]));
 const key=`qmspilot:smart-branch:draft:${tool.id}`;
 const [values,setValues]=useState<Record<string,string>>(blank);
 const [organization,setOrganization]=useState("QMSPilot Design Partner");
 const [site,setSite]=useState("Primary Branch");
 const [recordId,setRecordId]=useState(makeRecordId(config,tool));
 const [eventDate,setEventDate]=useState(today());
 const [owner,setOwner]=useState("");
 const [due,setDue]=useState("");
 const [priority,setPriority]=useState("Medium");
 const [evidence,setEvidence]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 const [issues,setIssues]=useState<string[]>([]);
 const [submitted,setSubmitted]=useState<BranchSubmission|null>(null);

 useEffect(()=>{try{const raw=localStorage.getItem(key);if(!raw)return;const d=JSON.parse(raw);setValues({...blank,...d.values});setOrganization(d.organization||"QMSPilot Design Partner");setSite(d.site||"Primary Branch");setRecordId(d.recordId||makeRecordId(config,tool));setEventDate(d.eventDate||today());setOwner(d.owner||"");setDue(d.due||"");setPriority(d.priority||"Medium");setEvidence(d.evidence||[]);setNotice("Saved Smart Branch draft restored.")}catch{localStorage.removeItem(key)}},[key]);

 const required=useMemo(()=>tool.fields.filter(f=>f.required),[tool.fields]);
 const completeCount=[organization,site,recordId,eventDate,owner,due,...required.map(f=>values[f.key])].filter(v=>String(v||"").trim()).length;
 const completion=Math.round(completeCount/Math.max(6+required.length,1)*100);

 const saveDraft=()=>{localStorage.setItem(key,JSON.stringify({values,organization,site,recordId,eventDate,owner,due,priority,evidence}));setNotice("Smart Branch draft saved in this browser.")};
 const addEvidence=(event:ChangeEvent<HTMLInputElement>)=>{const names=Array.from(event.target.files||[]).map(f=>f.name);if(names.length){setEvidence(current=>[...current,...names]);setNotice(`${names.length} evidence item${names.length===1?"":"s"} attached.`)}event.target.value=""};
 const validate=()=>{const blocked:string[]=[];if(!organization.trim())blocked.push("Organization");if(!site.trim())blocked.push("Branch / site");if(!recordId.trim())blocked.push("Record ID");if(!eventDate)blocked.push("Record date");if(!owner.trim())blocked.push("Accountable owner");if(!due)blocked.push("Due date");required.forEach(field=>{if(!String(values[field.key]||"").trim())blocked.push(field.label)});setIssues(blocked);return blocked};
 const submit=()=>{if(validate().length){setNotice("Complete the highlighted required fields before submitting.");return}const record:BranchSubmission={schema:"qmspilot.northstar.smart-branch.v1",workspace:config.name,toolId:tool.id,toolName:tool.name,recordId,organization,site,eventDate,values,owner,dueDate:due,priority,status:"Open",evidence,submittedAt:new Date().toISOString()};const records=JSON.parse(localStorage.getItem("qmspilot:northstar:smart-branch-records")||"[]");localStorage.setItem("qmspilot:northstar:smart-branch-records",JSON.stringify([record,...records].slice(0,500)));const all=JSON.parse(localStorage.getItem("qmspilot:northstar:guided-records")||"[]");localStorage.setItem("qmspilot:northstar:guided-records",JSON.stringify([record,...all].slice(0,500)));localStorage.removeItem(key);window.dispatchEvent(new CustomEvent("qmspilot:smart-branch-record-submitted",{detail:record}));setSubmitted(record);setNotice(`${tool.name} submitted and added to Smart Branch records.`);window.scrollTo({top:0,behavior:"smooth"})};
 const newRecord=()=>{localStorage.removeItem(key);setValues(blank);setRecordId(makeRecordId(config,tool));setEventDate(today());setOwner("");setDue("");setPriority("Medium");setEvidence([]);setIssues([]);setSubmitted(null);setNotice("New Smart Branch record started.")};

 return <section className="guided-workflow">
  <button className="guided-back" onClick={onBack}><ArrowLeft size={16}/> Back to Smart Branch</button>
  <div className="guided-head"><span><Icon/></span><div><small>{tool.group.toUpperCase()}</small><h1>{tool.name}</h1><p>{tool.description}</p></div><div className="completion"><strong>{completion}%</strong><small>record readiness</small><div><i style={{width:`${completion}%`}}/></div></div></div>
  {notice&&<div className="guided-notice"><Sparkles size={17}/>{notice}</div>}
  {submitted&&<div className="guided-success"><CheckCircle2/><div><strong>Submitted to Smart Branch</strong><span>{submitted.recordId} · visible in branch record storage</span></div></div>}
  {issues.length>0&&<div className="guided-errors"><strong>Required before submission</strong><div>{issues.map(item=><span key={item}>{item}</span>)}</div></div>}
  <section className="procedure-banner"><div><ClipboardCheck/><span><small>CONTROLLED BRANCH WORKFLOW</small><strong>{tool.procedure.id} · {tool.procedure.title}</strong><em>{tool.procedure.revision} · Owner: {tool.procedure.owner}</em></span></div><p>This record feeds the Smart Branch operating record and remains available in this browser until connected persistence is enabled.</p></section>
  <section className="stage-strip">{tool.stages.map((name,index)=><button key={name} className={index===0?"active":""}><span>{index+1}</span><strong>{name}</strong></button>)}</section>
  <div className="guided-layout"><div className="guided-form-column">
   <article className="guided-card"><div className="guided-title"><div><small>RECORD CONTROL</small><h2>Identity, ownership, and timing</h2></div><ClipboardCheck/></div><div className="record-grid">
    <label>Organization *<input value={organization} onChange={e=>setOrganization(e.target.value)}/></label><label>Branch / site *<input value={site} onChange={e=>setSite(e.target.value)}/></label><label>Record ID *<input value={recordId} onChange={e=>setRecordId(e.target.value)}/></label><label>Record date *<input type="date" value={eventDate} onChange={e=>setEventDate(e.target.value)}/></label><label>Accountable owner *<input value={owner} onChange={e=>setOwner(e.target.value)}/></label><label>Due date *<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
   </div></article>
   {(["Record Context","Evaluation","Response & Action","Closure"] as const).map(section=>{const fields=tool.fields.filter(f=>f.section===section);return fields.length?<article className="guided-card" key={section}><div className="guided-title"><div><small>{section.toUpperCase()}</small><h2>{section}</h2></div><ClipboardCheck/></div><div className="field-grid">{fields.map(field=><BranchField key={field.key} field={field} value={values[field.key]||""} change={value=>{setValues(current=>({...current,[field.key]:value}));setIssues([]);setSubmitted(null)}}/>)}</div></article>:null})}
  </div><aside className="guided-side"><article className="guided-card"><div className="guided-title"><div><small>EVIDENCE</small><h2>Attach proof of work</h2></div><FileUp/></div><label className="capture-button"><FileUp size={17}/> Add photos or documents<input hidden multiple type="file" onChange={addEvidence}/></label><div className="evidence-list">{evidence.length?evidence.map((name,index)=><div key={`${name}-${index}`}><strong>{name}</strong><button onClick={()=>setEvidence(current=>current.filter((_,i)=>i!==index))}>Remove</button></div>):<p>No evidence attached yet.</p>}</div></article><article className="guided-card"><div className="guided-title"><div><small>RECORD ACTIONS</small><h2>Save or submit</h2></div><Send/></div><button className="guided-primary" onClick={submit}><Send size={16}/> Submit to Smart Branch</button><button className="guided-secondary" onClick={saveDraft}><Save size={16}/> Save draft</button><button className="guided-secondary" onClick={newRecord}>Start new record</button></article></aside></div>
 </section>;
}

function BranchField({field,value,change}:{field:FieldDef;value:string;change:(value:string)=>void}){
 const common={value,onChange:(event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>change(event.target.value)};
 return <label>{field.label}{field.required?" *":""}{field.type==="textarea"?<textarea {...common}/>:field.type==="select"?<select {...common}><option value="">Select...</option>{field.options?.map(option=><option key={option}>{option}</option>)}</select>:<input {...common} type={field.type}/>}</label>;
}
