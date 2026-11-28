import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,delimiter} from 'node:path';
import {cryptProtected,noNestedMounts,expectedStorageMount} from '../deploy/home/storage-check.mts';
test('storage preflight requires every inverse branch encrypted and local',()=>{
 const disk={type:'disk','maj:min':'8:0'};
 const partition={type:'part','maj:min':'8:1',children:[disk]};
 const crypt={type:'crypt','maj:min':'253:0',children:[partition]};
 const lvm={type:'lvm','maj:min':'253:1',children:[crypt]};
 const check=(n:unknown)=>cryptProtected({blockdevices:[n]},'253:1');
 assert.equal(check(lvm),true);
 assert.equal(check({...lvm,children:[crypt,partition]}),false);
 assert.equal(check({...lvm,children:[partition]}),false);
 assert.equal(check({...lvm,children:[{type:'crypt','maj:min':'253:0'}]}),false);
 assert.equal(check({...lvm,children:[{type:'loop','maj:min':'7:0',children:[crypt]}]}),false);
 assert.equal(check(disk),false);
});
test('nested mounts are rejected without inspecting keys or writing data',()=>{
 assert.equal(noNestedMounts({filesystems:[{target:'/'},{target:'/srv/redion'},{target:'/srv/other'}]},'/srv/redion'),true);
 assert.equal(noNestedMounts({filesystems:[{target:'/srv/redion/blobs'}]},'/srv/redion'),false);
});

test('expected encrypted SSD identity refuses fallback, wrong UUID and bind subroot',()=>{
 const uuid='12345678-1234-1234-1234-123456789abc',mount='/srv/redion-ssd',data=mount+'/data';
 const fs={target:mount,uuid,fsroot:'/',fstype:'ext4','maj:min':'253:0'};
 const check=(filesystems:unknown)=>expectedStorageMount({filesystems},data,mount,uuid);
 assert.equal(check([fs]),true);
 assert.equal(check([{...fs,target:'/'}]),false);
 assert.equal(check([{...fs,uuid:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}]),false);
 assert.equal(check([{...fs,fsroot:'/other'}]),false);
 assert.equal(check([{...fs,fstype:'tmpfs'}]),false);
 assert.equal(check([{...fs,'maj:min':'unknown'}]),false);
 assert.equal(check([fs,fs]),false);
 assert.equal(check([]),false);
 assert.equal(expectedStorageMount({filesystems:[fs]},mount+'-other/data',mount,uuid),false);
 assert.equal(expectedStorageMount({filesystems:[fs]},data,'/',uuid),false);
 assert.equal(expectedStorageMount({filesystems:[fs]},data,mount,'bad'),false);
});

test('Linux host preflight shell rejects fallback, unencrypted and changing mounts',{skip:process.platform!=='linux'},()=>{
 const root=mkdtempSync(join(tmpdir(),'red-storage-shell-'));
 try{
  const bin=join(root,'bin'),mount=join(realpathSync(root),'ssd'),data=join(mount,'data');
  mkdirSync(bin);mkdirSync(data,{recursive:true});
  const sentinel=join(data,'untouched.txt');writeFileSync(sentinel,'synthetic fixture');
  const uuid='12345678-1234-1234-1234-123456789abc';
  const count=join(root,'count');
  writeFileSync(join(bin,'findmnt'),`#!/bin/bash
set -euo pipefail
case "$*" in
  *TARGET,UUID,FSROOT,FSTYPE,MAJ:MIN*)
    n=0; if [[ -f "$RED_TEST_COUNT" ]]; then read -r n < "$RED_TEST_COUNT"; fi
    n=$((n+1)); echo "$n" > "$RED_TEST_COUNT"
    target="$RED_TEST_MOUNT"; uuid="$RED_TEST_UUID"
    if [[ "$RED_TEST_MODE" == fallback ]]; then target=/; fi
    if [[ "$RED_TEST_MODE" == changed && "$n" -gt 1 ]]; then uuid=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa; fi
    printf '{"filesystems":[{"target":"%s","uuid":"%s","fsroot":"/","fstype":"ext4","maj:min":"253:0"}]}\\n' "$target" "$uuid"
    ;;
  *MAJ:MIN*) echo 253:0 ;;
  *FSTYPE*) echo ext4 ;;
  *TARGET*) printf '{"filesystems":[{"target":"/"},{"target":"%s"}]}\\n' "$RED_TEST_MOUNT" ;;
  *) exit 9 ;;
esac
`,{mode:0o700});
  writeFileSync(join(bin,'lsblk'),`#!/bin/bash
if [[ "$RED_TEST_MODE" == plain ]]; then
 echo '{"blockdevices":[{"type":"part","maj:min":"253:0"}]}'
else
 echo '{"blockdevices":[{"type":"crypt","maj:min":"253:0","children":[{"type":"part","maj:min":"8:1"}]}]}'
fi
`,{mode:0o700});
  const script=resolve(import.meta.dirname,'../deploy/home/storage-check.sh');
  const run=(mode:string)=>{
   rmSync(count,{force:true});
   return spawnSync('bash',[script,data,mount,uuid],{encoding:'utf8',timeout:15000,env:{...process.env,
    PATH:bin+delimiter+process.env.PATH,RED_TEST_COUNT:count,RED_TEST_MOUNT:mount,RED_TEST_UUID:uuid,RED_TEST_MODE:mode}});
  };
  const good=run('good');assert.equal(good.status,0,good.stderr);assert.match(good.stdout,/Expected filesystem UUID and mountpoint matched/);
  for(const mode of ['fallback','plain','changed']){
   const result=run(mode);assert.equal(result.status,2,mode+': '+result.stderr);assert.doesNotMatch(result.stdout,/dm-crypt dependency check passed/);
  }
  assert.equal(readFileSync(sentinel,'utf8'),'synthetic fixture');
 }finally{rmSync(root,{recursive:true,force:true});}
});
