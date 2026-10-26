import {motion} from 'framer-motion';
export default function StatCard({title,value,sub,icon:Icon,tone='blue'}){return <motion.div className="stat-card" whileHover={{y:-3}} transition={{type:'spring',stiffness:320,damping:24}}><div className={'stat-icon '+tone}>{Icon&&<Icon size={19}/>}</div><span className="stat-label">{title}</span><strong>{value??'—'}</strong><small>{sub}</small></motion.div>}
