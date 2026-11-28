import test from 'node:test';
import assert from 'node:assert/strict';
import {cryptProtected,noNestedMounts} from '../deploy/home/storage-check.mts';
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
