import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type RedirectionCardProps = {
  imageSrc: string;
  imageAlt: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  href: string;
};

function RedirectionCard({
  imageSrc,
  imageAlt,
  icon: Icon,
  title,
  description,
  cta,
  href,
}: RedirectionCardProps) {
  return (
    <article className="group grid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md sm:grid-cols-2">
      <div className="relative min-h-64 overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col items-start justify-center p-7 lg:p-9">
        <Icon className="size-7 text-orange-600" aria-hidden="true" />
        <h3 className="mt-5 font-serif text-3xl font-semibold text-stone-950">
          {title}
        </h3>
        <p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">
          {description}
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          {cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default RedirectionCard;
