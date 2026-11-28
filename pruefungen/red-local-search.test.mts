import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedLocalSearch,type RedSearchEntry} from '../red-sdk/client.mts';
const row=(id:string,title:string,extra:Partial<RedSearchEntry>={}):RedSearchEntry=>({id:id.repeat(32),title,kind:'document',tags:[],summary:'',...extra});
test('local search ranks titles, matches multiple terms and folds diacritics',()=>{
 const search=createRedLocalSearch();
 search.replace([row('a','Kräfte und Elektrizität',{tags:['Physik']}),row('b','Physik',{summary:'Kräfte und Elektrizität'}),row('c','Kurdî Türkçe',{kind:'note',tags:['Işık']}),row('d','Strasse')]);
 assert.deepEqual(search.search('krafte elektrizitat').map(r=>r.id),['a'.repeat(32),'b'.repeat(32)]);
 assert.equal(search.search('kurdi turkce')[0]?.id,'c'.repeat(32));
 assert.equal(search.search('isik',{kind:'note'})[0]?.title,'Kurdî Türkçe');
 assert.equal(search.search('Straße')[0]?.title,'Strasse');
 assert.deepEqual(search.search('physik',{kind:'file'}),[]);
 assert.equal(search.search('physik',{limit:1}).length,1);
 assert.deepEqual(search.search(''),[]);
 search.dispose();assert.throws(()=>search.search('physik'));
});
test('search index isolates copies, rejects invalid snapshots and can be cleared',()=>{
 const search=createRedLocalSearch(),a=row('a','RED ION',{tags:['sync']});
 search.replace([a]);a.title='changed';a.tags.push('private');
 assert.equal(search.search('red ion')[0]?.title,'RED ION');assert.deepEqual(search.search('private'),[]);
 assert.throws(()=>search.replace([row('b','new'),row('b','duplicate')]));
 assert.equal(search.search('red')[0]?.id,'a'.repeat(32));
 const hit=search.search('sync')[0]!;hit.tags.push('other');
 assert.deepEqual(search.search('other'),[]);
 search.upsert(row('a','RED FIT'));assert.deepEqual(search.search('ion'),[]);
 search.remove('a'.repeat(32));assert.deepEqual(search.search('fit'),[]);
 assert.throws(()=>search.upsert(row('z','invalid')));
 search.upsert(row('c','test'));search.clear();assert.deepEqual(search.search('test'),[]);
});
