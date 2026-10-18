const questions = [
  { question: "Are all pandals ticketed?", answer: "No. Free public-entry details are displayed whenever a club provides them. Paid tickets only apply to club-authorised slots or benefits." },
  { question: "Can I visit multiple pandals?", answer: "Yes. Add available slots from participating pandals to one Puja trail and complete a single checkout." },
  { question: "How do Puja clubs join?", answer: "Clubs can register their interest, complete verification, then create their pandal profile and ticket tiers." },
];

export default function FaqSection() {
  return (
    <section id="about" className="bg-stone-50 py-18 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-orange-600">GOOD TO KNOW</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">A few things to know</h2>
        </div>
        <div className="space-y-3">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group rounded-xl border border-stone-200 bg-white p-5">
              <summary className="cursor-pointer list-none pr-8 font-serif text-lg font-semibold text-stone-900 marker:hidden">{question}</summary>
              <p className="mt-3 text-sm leading-6 text-stone-600">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
