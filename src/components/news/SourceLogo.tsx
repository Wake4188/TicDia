import { memo } from "react";

type SourceId = "nyt" | "bbc" | "franceinfo";

interface SourceLogoProps {
  source: SourceId;
  className?: string;
}

/**
 * Stylized brand-mark logos for news sources.
 * These are typographic marks (not the official trademarked logos) to give
 * each feed a recognizable identity in the Today page.
 */
const SourceLogo = memo(({ source, className = "" }: SourceLogoProps) => {
  if (source === "nyt") {
    // NYT — Old English style "T" in a black square (stylized homage)
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-md bg-foreground text-background font-serif font-black text-base leading-none select-none ${className}`}
        aria-label="The New York Times"
        style={{ fontFamily: '"Old English Text MT", "UnifrakturCook", Georgia, serif' }}
      >
        𝕿
      </span>
    );
  }

  if (source === "bbc") {
    // BBC — three red blocks with white letters
    return (
      <span
        className={`inline-flex gap-[2px] select-none ${className}`}
        aria-label="BBC News"
      >
        {["B", "B", "C"].map((l) => (
          <span
            key={l + Math.random()}
            className="inline-flex items-center justify-center w-[18px] h-[22px] bg-red-600 text-white font-black text-xs leading-none rounded-[2px]"
          >
            {l}
          </span>
        ))}
      </span>
    );
  }

  // France Info — blue "f" + amber "i" pill mark
  return (
    <span
      className={`inline-flex items-center select-none rounded-md overflow-hidden ${className}`}
      aria-label="France Info"
    >
      <span className="inline-flex items-center justify-center w-5 h-6 bg-blue-700 text-white font-black text-xs leading-none">
        f
      </span>
      <span className="inline-flex items-center justify-center w-5 h-6 bg-amber-400 text-slate-900 font-black text-xs leading-none">
        i
      </span>
    </span>
  );
});
SourceLogo.displayName = "SourceLogo";

export default SourceLogo;
