export default function HeartMeter({ value }) {
  const fillHeight = `${value}%`;

  return (
    <div className="relative h-[300px] w-[300px]">
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full">
        <path
          d="M12 21s-7.2-4.35-9.6-8.25C.3 9.25 2.1 5.5 5.7 5.5c2.25 0 3.6 1.25 4.3 2.3.7-1.05 2.05-2.3 4.3-2.3 3.6 0 5.4 3.75 3.3 7.25C19.2 16.65 12 21 12 21z"
          fill="#2f343f"
        />
      </svg>

      <div
        className="absolute inset-0 overflow-hidden transition-[height] duration-500 ease-out"
        style={{ height: fillHeight, top: `${100 - value}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-full w-full">
          <path
            d="M12 21s-7.2-4.35-9.6-8.25C.3 9.25 2.1 5.5 5.7 5.5c2.25 0 3.6 1.25 4.3 2.3.7-1.05 2.05-2.3 4.3-2.3 3.6 0 5.4 3.75 3.3 7.25C19.2 16.65 12 21 12 21z"
            fill="#ef4444"
          />
        </svg>
      </div>
    </div>
  );
}
