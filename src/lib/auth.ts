export const ADMIN_CPF='01636486541'
export const normalizeLogin=(v:string)=>v.replace(/\D/g,'')
export const loginToEmail=(v:string)=>`${normalizeLogin(v)}@eleicoes.local`
