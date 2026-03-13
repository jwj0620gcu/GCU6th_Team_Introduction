import { useState } from 'react';

function MemberPhoto({ name, src }) {
  const [hasError, setHasError] = useState(false);
  const initial = name?.trim()?.charAt(0) ?? '?';

  return (
    <div className="h-32 w-32 overflow-hidden rounded-xl border border-white/15 bg-white/8">
      {src && !hasError ? (
        <img
          src={src}
          alt={`${name} profile`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-base font-bold text-white/80">
          {initial}
        </div>
      )}
    </div>
  );
}

export default MemberPhoto;
