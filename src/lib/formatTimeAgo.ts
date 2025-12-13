export default function formatTimeAgo(date: Date | string): string {
if (!date) return "0m"
  const now = new Date().getTime();
  const time = new Date(date).getTime();
  if (!time) return "0m"
  const diff = Math.floor((now - time) / 1000); // in seconds

  if (diff < 60) return `${diff}s ago`; // seconds
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; // minutes
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; // hours
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`; // days
  if (diff < 2419200) return `${Math.floor(diff / 604800)}w ago`; // weeks (4 weeks)
  return `${Math.floor(diff / 31536000)}y ago`; // years
}