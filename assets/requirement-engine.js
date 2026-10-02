/* Pure, read-only requirement evaluation shared by Station/HO views. */
(function(root){
  'use strict';
  const rows=x=>Array.isArray(x)?x:[];
  function alignmentSummary(alignments,source){const raw=rows(alignments).filter(x=>x.relationship===source),keys=new Set(raw.map(x=>[x.airline,x.capability].join('|')));
    return {records:raw.length,combinations:keys.size,repeated:raw.length-keys.size,explicitStationScope:raw.filter(x=>rows(x.stations).length>0).length};
  }
  function evaluate(data,{source,station,partner=''}){const requirements=rows(data.requirements).filter(r=>r.source===source&&r.status==='Active'&&
      (r.scopeType==='ALL'||(r.scopeType==='SPECIFIC'&&rows(r.stationCodes).includes(station)))&&(!partner||!r.airlineId||r.airlineId===partner));
    const count={Available:0,Partial:0,Unavailable:0,Unknown:0},issues=[],mapped=[];let numerator=0,denominator=0;
    for(const r of requirements){const current=rows(data.current).find(x=>x.stationCode===station&&x.capabilityId===r.capabilityId);
      const evidence=!!(current?.sourceRef||current?.evidenceReference),status=evidence&&['Available','Partial','Unavailable'].includes(current?.availability)?current.availability:'Unknown';count[status]++;
      const weight=Number(r.weight);if(weight>0){denominator+=weight;if(status==='Available')numerator+=weight}else issues.push('WEIGHT_MISSING');
      if(!r.capabilityId)issues.push('CAPABILITY_MISSING');if(status==='Unknown')issues.push('CURRENT_UNVERIFIED');
      if(status==='Partial')issues.push('PARTIAL_RULE_PENDING');mapped.push({requirement:r,status,capability:current});
    }
    if(!requirements.length)issues.push('NO_REQUIREMENTS');
    if((source==='SkyTeam'||source==='Interline')&&!partner)issues.push('PARTNER_NOT_SELECTED');
    const canScore=!issues.length&&denominator>0;
    return {rows:mapped,counts:count,issues:[...new Set(issues)],numerator,denominator,percent:canScore?Math.round(numerator/denominator*100):null};
  }
  root.GERequirementEngine={alignmentSummary,evaluate};
})(typeof window!=='undefined'?window:globalThis);
