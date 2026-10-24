export interface SourceLink {
  format:'dol-ui-source-index';
  snapshot:{revision:string;digest:string};
}

// Validate the fields consumed by the lab; retain the producer's full response.
export function isSourceLink(value:unknown):value is SourceLink {
  if(!value||typeof value!=='object'||Array.isArray(value)||!('format' in value)||value.format!=='dol-ui-source-index'||!('snapshot' in value))return false;
  const snapshot=value.snapshot;
  return !!snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot)
    &&'revision' in snapshot&&typeof snapshot.revision==='string'
    &&'digest' in snapshot&&typeof snapshot.digest==='string';
}
