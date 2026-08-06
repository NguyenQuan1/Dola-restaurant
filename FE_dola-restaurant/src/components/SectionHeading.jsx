export default function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="ornament">
        <span className={`font-script text-lg italic tracking-widest ${light ? 'text-gold-light' : 'text-gold-dark'}`}>
          {eyebrow}
        </span>
      </div>
      <h2
        className={`mt-3 font-display text-3xl font-semibold sm:text-4xl ${
          light ? 'text-ivory' : 'text-jade-700'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-[15px] leading-relaxed ${light ? 'text-ivory/70' : 'text-ink-soft'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
