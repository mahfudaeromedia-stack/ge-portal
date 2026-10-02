import { spawnSync } from 'node:child_process';
const r=spawnSync(process.execPath,['tests/canonical-regression.js'],{stdio:'inherit',cwd:process.cwd(),env:process.env});
if(r.status!==0){process.exitCode=r.status||1}else console.log('LOCAL_BUILD_CHAIN_PASS');
