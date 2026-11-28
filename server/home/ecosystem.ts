import {RED_APPS} from './red-id.ts';
/** Deliberately static, non-sensitive metadata, available only from the
 * opt-in private Home MCP transport after its normal OAuth checks. */
export function homeEcosystemCapabilities(vaultEnabled:boolean){
 return {version:1,mode:'private-home',apps:[...RED_APPS],services:{
  identity:{version:2,explicitApproval:true},
  sync:{version:1,scope:'same-owner-app',explicitGrant:true,revisionConflicts:true},
  files:{version:1,scope:'same-owner-app',explicitGrant:true,maxPlaintextBytes:44000,streaming:false},
  share:{version:1,explicitDirectionalGrant:true,clientEncryption:true},
  vault:{blobEncryptionEnabled:vaultEnabled,sqliteEncryptionVerified:false},
  backup:{offline:true,encrypted:true},update:{stagingOnly:true},
  mcp:{scope:'redion-workspaces',externalAppActions:false,encryptedContentAccess:false}
 },limits:{recordCount:1024,encodedBytes:16*1024*1024},note:'Catalog is not a live app connection or permission inventory.'};
}
