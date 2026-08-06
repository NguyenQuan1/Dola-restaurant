import { Link } from 'react-router-dom'

export default function AuthArt({ eyebrow, title, quote, author, placement = 'left' }) {
  const isRight = placement === 'right'

  return (
    <div
      className={`relative hidden w-[46%] overflow-hidden ${isRight ? 'rounded-l-[28px]' : 'rounded-r-[28px]'} border border-white/5 bg-jade-900 shadow-[0_10px_30px_rgba(0,0,0,0.16)] lg:flex`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,214,102,0.24),_transparent_38%),linear-gradient(135deg,_rgba(11,57,49,0.98),_rgba(7,34,29,0.99))]" />
      <div className="absolute inset-0 bg-[linear-gradient(125deg,_rgba(255,255,255,0.12),_transparent_45%,_rgba(255,255,255,0.05))]" />
      <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

      {/* line-art motif: waves + sun rings, echoes Vietnamese lacquer trays */}
      <svg
        className="absolute -right-28 -top-28 h-[560px] w-[560px] text-gold/10"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" />
        <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1" />
        <path d="M20 260c40-28 80-28 120 0s80 28 120 0s80-28 120 0" stroke="currentColor" strokeWidth="1" />
        <path d="M0 300c40-28 80-28 120 0s80 28 120 0s80-28 120 0s80-28 120 0" stroke="currentColor" strokeWidth="1" />
        <path d="M60 220c40-28 80-28 120 0s80 28 120 0" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg
        className="absolute -bottom-16 -left-16 h-72 w-72 text-gold/10"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M100 178C60 148 38 108 38 78c0-21 17-38 38-38 9 0 18 4 24 11 6-7 15-11 24-11 21 0 38 17 38 38 0 30-22 70-62 100Z"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      {/* drifting gold motes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {[
          { top: '18%', left: '70%', delay: '0s' },
          { top: '32%', left: '85%', delay: '1.4s' },
          { top: '58%', left: '12%', delay: '0.7s' },
          { top: '74%', left: '60%', delay: '2.1s' },
          { top: '46%', left: '40%', delay: '3s' },
        ].map((dot, i) => (
          <span
            key={i}
            className="dola-dot absolute h-1.5 w-1.5 rounded-full bg-gold/40"
            style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-16">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-3 rounded-full border border-gold/30 bg-white/15 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-gold/40 bg-jade-800/80 font-display text-lg text-gold shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
            D
          </span>
          <span className="font-display text-xl tracking-[0.2em] text-ivory">Dola</span>
        </Link>

        <div className="max-w-md rounded-[34px] border border-white/15 bg-white/12 p-8 shadow-[0_26px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 font-script text-sm italic text-gold">
            {eyebrow}
          </span>
          <h2 className="mt-4 font-display text-[2rem] font-semibold leading-snug text-ivory xl:text-[2.25rem]">
            {title}
          </h2>
        </div>

        <div className="max-w-sm rounded-[28px] border border-gold/20 bg-ivory/10 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <p className="font-display text-lg italic leading-relaxed text-ivory/90">“{quote}”</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">{author}</p>
        </div>
      </div>

      <style>{`
        @keyframes dola-drift {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-14px); opacity: 1; }
        }
        .dola-dot { animation: dola-drift 6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
