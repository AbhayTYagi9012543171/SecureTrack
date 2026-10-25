import dns from 'node:dns/promises';
import net from 'node:net';
function ipv4Blocked(ip){const p=ip.split('.').map(Number); if(p.length!==4||p.some(n=>!Number.isInteger(n)||n<0||n>255))return true; const [a,b]=p; return a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===0||b===2||b===168)||a===198&&(b===18||b===19||b===51)||a===100&&b>=64&&b<=127||a===203&&b===0&&p[2]===113;}
function ipv6Blocked(ip){
  const x=ip.toLowerCase().split('%')[0];
  // IPv4-mapped IPv6 addresses must receive the same checks as native IPv4.
  const mapped=x.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if(mapped) return ipv4Blocked(mapped[1]);
  // Block unspecified/loopback, unique-local, link-local, multicast and
  // non-global special-purpose ranges. Public IPv6 unicast is 2000::/3.
  if(x==='::'||x==='::1'||x.startsWith('fc')||x.startsWith('fd')||/^fe[89ab]/.test(x)||x.startsWith('ff')) return true;
  if(!/^2[0-9a-f]{3}:/.test(x)) return true;
  // Documentation, benchmarking, ORCHID and 6to4 ranges are not public targets.
  if(/^2001:(?:db8|0|2|10|20):/.test(x)||x.startsWith('2002:')) return true;
  return false;
}
export async function validateTarget(raw){let u; try{u=new URL(raw)}catch{throw Object.assign(new Error('Enter a valid website URL'),{statusCode:400})} if(!['https:','http:'].includes(u.protocol)) throw Object.assign(new Error('Only HTTP and HTTPS URLs are supported'),{statusCode:400}); if(u.username||u.password)throw Object.assign(new Error('URLs containing credentials are not allowed'),{statusCode:400}); const port=u.port|| (u.protocol==='https:'?'443':'80'); if(!['80','443'].includes(port))throw Object.assign(new Error('Only ports 80 and 443 are allowed'),{statusCode:400}); const host=u.hostname.toLowerCase().replace(/^\[|\]$/g,''); if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))throw Object.assign(new Error('Private and local targets are not allowed'),{statusCode:400}); const type=net.isIP(host); if(type===4&&ipv4Blocked(host)||type===6&&ipv6Blocked(host))throw Object.assign(new Error('Private or reserved IP targets are not allowed'),{statusCode:400}); if(!type){let addresses; try{addresses=await dns.lookup(host,{all:true,verbatim:true})}catch{throw Object.assign(new Error('Target DNS could not be resolved'),{statusCode:400})} if(!addresses.length||addresses.some(a=>a.family===4?ipv4Blocked(a.address):ipv6Blocked(a.address))) throw Object.assign(new Error('Target resolves to a private or reserved address'),{statusCode:400});} return u; }
