import React from 'react';
import { Star, Quote } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sabbir Ahmed',
      role: 'Founder & CEO',
      business: "Sabbir's Store Ltd (Dhanmondi, Dhaka)",
      image: 'SA',
      quote:
        'Before Fulfillio, we had 4 full-time packers and still made mistakes during Eid campaigns. With Fulfillio, we fulfilled 1,200+ orders daily with 99.9% accuracy. Weekly COD payouts straight into our bank account made cash flow effortless.',
      rating: 5,
    },
    {
      name: 'Tanvir Hasan',
      role: 'Operations Director',
      business: 'TechGear Electronics BD (Panthapath, Dhaka)',
      image: 'TH',
      quote:
        'The custom Memo Code engine is phenomenal for our dropshipping resellers. Each sub-merchant gets their own branded packing slip automatically printed when the warehouse operator scans the barcode. Zero manual coordination.',
      rating: 5,
    },
    {
      name: 'Nusrat Jahan',
      role: 'Co-Founder',
      business: 'Modest Wear Boutique (Mirpur, Dhaka)',
      image: 'NJ',
      quote:
        'Their Courier Fraud Shield saved us over ৳ 50,000 in courier delivery charges in the first two months alone. It proactively detects fake COD customers before we dispatch parcels with Steadfast or Pathao.',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-slate-900/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Merchant Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
            Trusted by Leading Bangladeshi E-Commerce Brands
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            See how merchants are scaling their fulfillment speed, cutting return costs, and growing daily order volume with Fulfillio.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-7 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md relative"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <Quote className="h-8 w-8 text-slate-700 mb-3" />

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  {t.image}
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">
                    {t.name}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {t.role} • {t.business}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
