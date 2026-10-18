import { Clock3, Leaf, Route, ShieldCheck } from "lucide-react";

const benefits = [{ title: "Verified pandals", detail: "Official and authentic information", icon: ShieldCheck }, { title: "Timed entry passes", detail: "Plan your visit, avoid long queues", icon: Clock3 }, { title: "Your own Puja trail", detail: "Create a personalised multi-pandal plan", icon: Route }, { title: "Eco-friendly choices", detail: "Support sustainable celebrations", icon: Leaf }];

export function PandalBenefits() {
  return <section className="grid divide-y divide-orange-100 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">{benefits.map(({ title, detail, icon: Icon }) => <div key={title} className="flex gap-3 p-5"><Icon className="size-7 shrink-0 text-orange-600" aria-hidden="true" /><div><h2 className="font-serif text-lg font-semibold text-stone-950">{title}</h2><p className="mt-1 text-xs leading-5 text-stone-600">{detail}</p></div></div>)}</section>;
}
