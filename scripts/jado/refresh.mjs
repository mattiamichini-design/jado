import { readFile, writeFile, mkdir, rm, realpath, lstat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prepareGlobal, prepareLocalUpdate } from './setup.mjs';
import { applyInstall, hash, json } from './install.mjs';
import { atomicWrite } from '../../lib/jado/store.ts';

const run = promisify(execFile);
const source = fileURLToPath(new URL('../../',import.meta.url));
const read = async file => { try { return await readFile(file,'utf8'); } catch(e) { if(e.code === 'ENOENT') return null; throw e; } };
const xml = value => String(value).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const validDays = days => { if (!Number.isSafeInteger(days) || days < 1 || days > 365) throw new Error('Frequency must be an integer from 1 to 365 days.'); return days; };

export async function refreshLocation({global = false,target,userRoot = homedir()}) {
  userRoot = await realpath(userRoot);
  if (!global && !target) throw new Error('Specify --global or --local --target /repo.');
  const root = path.join(global ? userRoot : await realpath(target),'.jado');
  if (!(await lstat(root)).isDirectory()) throw new Error('The JADO directory must be a real directory.');
  const manifest = JSON.parse(await readFile(path.join(root,'install.json'),'utf8'));
  if (manifest.scope === 'linked') throw new Error('This project uses the global installation: configure refresh with --global.');
  if (manifest.scope !== (global ? 'global' : 'local')) throw new Error('JADO scope mismatch.');
  return {root,userRoot,target:path.dirname(root),global,manifest};
}

export function refreshDue(settings, now = new Date()) {
  if (!settings.enabled) return false;
  validDays(settings.everyDays);
  if (!settings.lastRun) return true;
  const last = Date.parse(settings.lastRun);
  if (!Number.isFinite(last)) throw new Error('Invalid refresh date.');
  return now.getTime() - last >= settings.everyDays * 86400000;
}

export async function configureRefresh(location,{enable = false,everyDays = 7,checkOnly = false,dryRun = false,platform = process.platform,launch = run} = {}) {
  // ponytail: launchd for the current macOS environment; add an OS adapter when another scheduler is needed.
  if (platform !== 'darwin') throw new Error('Automatic activation is available on macOS; on other systems, call refresh --due from your scheduler.');
  validDays(everyDays);
  const lease = path.join(location.root,'.refresh.lock');
  if (!dryRun) await writeFile(lease,'JADO refresh configuration\n',{flag:'wx'});
  try {
    const stateFile = path.join(location.root,'refresh.json');
    const oldState = await read(stateFile), previous = oldState ? JSON.parse(oldState) : {enabled:false};
    const label = `com.jado.refresh.${hash(location.root).slice(0,16)}`;
    const plist = path.join(location.userRoot,'Library/LaunchAgents',`${label}.plist`);
    const oldPlist = await read(plist);
    if (oldPlist && !previous.enabled) throw new Error(`Existing job is not owned by JADO: ${plist}`);
    const args = [process.execPath,path.join(source,'scripts/jado/cli.mjs'),'refresh',...(location.global ? ['--global'] : ['--local','--target',location.target]),'--user-root',location.userRoot,'--due','--yes'];
    const logs = path.join(location.root,'refresh.log');
    const content = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array>${args.map(a => `<string>${xml(a)}</string>`).join('')}</array><key>WorkingDirectory</key><string>${xml(source)}</string><key>StartInterval</key><integer>${everyDays * 86400}</integer><key>StandardOutPath</key><string>${xml(logs)}</string><key>StandardErrorPath</key><string>${xml(logs)}</string></dict></plist>\n`;
    const settings = {enabled:enable,everyDays,checkOnly,lastRun:previous.lastRun ?? null,sourceRoot:source};
    if (dryRun) return {status:'planned',settings,plist,content:enable ? content : null};
    const domain = `gui/${process.getuid()}`;
    if (previous.enabled) await launch('launchctl',['bootout',`${domain}/${label}`]);
    try {
      if (enable) { await mkdir(path.dirname(plist),{recursive:true}); await atomicWrite(plist,content); }
      else await rm(plist,{force:true});
      await atomicWrite(stateFile,json(settings));
      if (enable) await launch('launchctl',['bootstrap',domain,plist]);
    } catch(e) {
      if (oldPlist !== null) await atomicWrite(plist,oldPlist); else await rm(plist,{force:true});
      if (oldState !== null) await atomicWrite(stateFile,oldState); else await rm(stateFile,{force:true});
      if (previous.enabled) {
        try { await launch('launchctl',['bootstrap',domain,plist]); }
        catch (restore) { throw new Error(`${e.message}; scheduler restoration failed: ${restore.message}`); }
      }
      throw e;
    }
    return {status:enable ? 'enabled' : 'disabled',settings,plist};
  } finally { if (!dryRun) await rm(lease,{force:true}); }
}

export async function refresh(location,{due = false,checkOnly,yes = false,dryRun = false,now = new Date(),prepare,apply = applyInstall} = {}) {
  const stateFile = path.join(location.root,'refresh.json');
  const lease = path.join(location.root,'.refresh.lock');
  await writeFile(lease,'JADO refresh\n',{flag:'wx'});
  try {
    const settings = JSON.parse(await read(stateFile) ?? '{"enabled":false,"everyDays":7}');
    if (due && !refreshDue(settings,now)) return {status:settings.enabled ? 'not_due' : 'disabled'};
    checkOnly ??= settings.checkOnly ?? false;
    const plan = await (prepare ?? (location.global ? prepareGlobal : prepareLocalUpdate))({tools:location.manifest.tools,userRoot:location.userRoot,target:location.target,component:'skills'});
    if (dryRun || !yes && !checkOnly) return {status:'planned',plan:plan.summary};
    const result = checkOnly || !plan.changes.length ? null : await apply(plan,plan.revision);
    await atomicWrite(stateFile,json({...settings,lastRun:now.toISOString()}));
    return {status:checkOnly ? plan.changes.length ? 'updates_available' : 'current' : 'updated',changes:plan.changes.length,backup:result?.backup ?? null};
  } finally { await rm(lease,{force:true}); }
}

export async function runRefresh(args) {
  const {values} = parseArgs({args,options:{global:{type:'boolean'},local:{type:'boolean'},target:{type:'string'},'user-root':{type:'string'},enable:{type:'boolean'},disable:{type:'boolean'},'every-days':{type:'string'},'check-only':{type:'boolean'},due:{type:'boolean'},yes:{type:'boolean'},'dry-run':{type:'boolean'},help:{type:'boolean'}}});
  if (values.help) { console.log('JADO refresh --global | --local --target /repo\n--enable --every-days 7 [--check-only] | --disable\nManual refresh: --yes to apply; --dry-run to preview the plan. --due respects activation and frequency. Native macOS scheduler; no automatic Git updates.'); return; }
  if (values.global && values.local || values.enable && values.disable) throw new Error('Choose one destination and one action.');
  const location = await refreshLocation({global:values.global,target:values.target,userRoot:values['user-root']});
  const options = {everyDays:values['every-days'] ? validDays(Number(values['every-days'])) : 7,checkOnly:values['check-only'],dryRun:values['dry-run']};
  const result = values.enable || values.disable ? await configureRefresh(location,{...options,enable:values.enable}) : await refresh(location,{...options,due:values.due,yes:values.yes});
  if (values.disable || !['not_due','disabled'].includes(result.status)) console.log(json(result));
}
