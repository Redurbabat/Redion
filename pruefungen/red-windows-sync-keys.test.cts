const test=require('node:test');
const assert=require('node:assert/strict');
const {account,createWindowsSyncKeyStore}=require('../tools/red-windows-sync-keys.cts');
const scope: {origin:string;owner:string;app:string;purpose:string}={origin:'https://home.example.test',owner:'owner',app:'red-ion',purpose:'sync'};
test('Windows key scope isolates account, origin, app and purpose',()=>{
 const original=account(scope);assert.match(original,/^[a-f0-9]{64}$/);
 for(const changed of [{owner:'other'},{origin:'https://other.example.test'},{app:'red-fit'},{purpose:'localSync'},{purpose:'file'}])assert.notEqual(account({...scope,...changed}),original);
 for(const changed of [{owner:''},{origin:'http://home.example.test'},{origin:'https://home.example.test/path'},{app:'bad'},{purpose:'bad'}])assert.throws(()=>account({...scope,...changed}));
 assert.throws(()=>createWindowsSyncKeyStore('.', {isEncryptionAvailable:()=>false}));
});
