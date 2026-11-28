import test from 'node:test';
import assert from 'node:assert/strict';
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
