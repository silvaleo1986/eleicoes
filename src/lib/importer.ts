import * as XLSX from 'xlsx'
import { supabase } from './supabase'
const clean=(v:any)=>v==null?null:String(v).trim()||null
const cpf=(v:any)=>{const s=clean(v)?.replace(/\D/g,'');return s||null}
const num=(v:any)=>{if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
const date=(v:any)=>{if(!v)return null;if(typeof v==='number'){const d=XLSX.SSF.parse_date_code(v);return d?`${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`:null}const s=String(v).trim();const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:s}
export type ImportPreview={total:number;detectedPolos:string[];zones:string[];sample:any[]}
export async function previewWorkbook(file:File):Promise<ImportPreview>{
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});const ws=wb.Sheets['Situação por rota']||wb.Sheets[wb.SheetNames[0]];if(!ws)throw new Error('Aba de rotas não encontrada.')
 const rows:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});const data=rows.slice(1).filter(r=>r.some(v=>v!=null&&v!==''));
 return {total:data.length,detectedPolos:[...new Set(data.map(r=>clean(r[0])).filter(Boolean))] as string[],zones:[...new Set(data.map(r=>clean(r[1])).filter(Boolean))] as string[],sample:data.slice(0,5)}
}
export async function importWorkbook(file:File,onProgress:(s:string)=>void,selectedPolo?:string){
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});const ws=wb.Sheets['Situação por rota']||wb.Sheets[wb.SheetNames[0]];if(!ws)throw new Error('Aba de rotas não encontrada.')
 const rows:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});if(rows.length<2)throw new Error('Planilha sem dados.')
 const source=rows.slice(1).filter(r=>r.some(v=>v!=null&&v!==''));const payload=source.map(r=>({polo:selectedPolo||clean(r[0]),zone:clean(r[1]),route_code:clean(r[2]),municipalities:clean(r[3]),urns:num(r[4]),operation_date:date(r[5]),vehicle:clean(r[6]),plate:clean(r[7]),driver:clean(r[8]),driver_cpf:cpf(r[9]),driver_phone:clean(r[10]),cnh:clean(r[11]),supplier:clean(r[12]),collaborator:clean(r[13]),collaborator_cpf:cpf(r[14]),collaborator_phone:clean(r[15]),situation:clean(r[16])||'Aguardando alocação',situation_manual:false}))
 onProgress(`Importando ${payload.length} rotas...`);for(let i=0;i<payload.length;i+=300){const {error}=await supabase.from('routes').insert(payload.slice(i,i+300));if(error)throw error;onProgress(`Rotas: ${Math.min(i+300,payload.length)}/${payload.length}`)}
 for(const sheet of ['Veículos','Motoristas']){const sh=wb.Sheets[sheet];if(!sh)continue;const data:any[][]=XLSX.utils.sheet_to_json(sh,{header:1,defval:null,raw:true});if(sheet==='Veículos'){const p=data.slice(1).filter(r=>r[0]).map(r=>({plate:clean(r[0]),model:clean(r[1]),brand:clean(r[2]),polo:selectedPolo||clean(r[3]),supplier:clean(r[4]),resource_type:clean(r[5]),situation:clean(r[6]),crlv:clean(r[7]),crlv_validity:date(r[8])}));for(let i=0;i<p.length;i+=300){const {error}=await supabase.from('vehicles').upsert(p.slice(i,i+300),{onConflict:'plate'});if(error)throw error}}else{const p=data.slice(1).filter(r=>r[0]).map(r=>({name:clean(r[0]),registration:clean(r[1]),phone:clean(r[2]),polo:selectedPolo||clean(r[3]),bond:clean(r[4]),situation:clean(r[5]),cnh_status:clean(r[6]),cnh_number:clean(r[7]),category:clean(r[8]),cnh_validity:date(r[9])}));for(let i=0;i<p.length;i+=300){const {error}=await supabase.from('drivers').insert(p.slice(i,i+300));if(error)throw error}}}
 onProgress('Importação concluída.')
}
