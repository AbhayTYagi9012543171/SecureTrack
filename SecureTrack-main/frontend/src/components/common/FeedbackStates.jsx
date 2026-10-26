import {Activity,ShieldAlert} from 'lucide-react';
export function Loading(){return <div className="skeleton-wrap" role="status" aria-label="Loading content"><div className="skeleton-line wide"/><div className="skeleton-grid">{[1,2,3,4].map(x=><div className="skeleton-card" key={x}/>)}</div><div className="skeleton-card tall"/></div>}
export function ErrorState({message,retry}){return <div className="empty-state error-state" role="alert"><ShieldAlert size={28}/><h3>Something went wrong</h3><p>{message}</p><button className="btn secondary" onClick={retry}>Try again</button></div>}
export function Empty({title,text}){return <div className="empty-inline"><div className="empty-icon"><Activity size={19}/></div><b>{title}</b><p>{text}</p></div>}
