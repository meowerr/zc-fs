export interface ParsedUserIdentity {
  displayName: string;
  studentId?: string;
}

export function parseUserIdentity(n?: string | null, e?: string | null): ParsedUserIdentity {
  const s = (n || '').trim();
  const m = s.match(/^(.*?)(?:[\s\-_/([#]+)?(\b\d{4,10}\b)[\s)\]]*$/);
  if (m && m[1].trim()) return { displayName: m[1].trim(), studentId: m[2] };
  const em = e?.match(/(\d{4,10})@/);
  return { displayName: s || 'Engineer', studentId: em?.[1] };
}

export function UserLabel({
  user,
  showId = false,
  className = '',
}: {
  user: { name?: string | null; full_name?: string | null; email?: string | null; id?: string };
  showId?: boolean;
  className?: string;
}) {
  const { displayName, studentId } = parseUserIdentity(user.full_name || user.name, user.email);
  return (
    <div className={`flex flex-col min-w-0 ${className}`}>
      <span className="font-semibold text-sm leading-tight truncate max-w-[160px] text-cyber-primary">
        {displayName}
      </span>
      {showId && (studentId || user.id) && (
        <span className="text-label font-mono text-cyber-muted leading-tight truncate">
          #{studentId || user.id}
        </span>
      )}
    </div>
  );
}
