import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import ProductsList from '@/components/ProductsList';
import StoreTestimonials from '@/components/StoreTestimonials';
import TrustSection from '@/components/TrustSection';
import { Button } from '@/components/ui/button';
import { ChevronDown, Sparkles, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

const ComparisonSection = () => {
  const features = [
    { name: "Instant Account Activation", us: true, others: false },
    { name: "24/7 Dedicated Priority Support", us: true, others: false },
    { name: "Money-Back Guarantee Period", us: "60 Days", others: "14 Days", highlight: true },
    { name: "Advanced Analytics Dashboard", us: true, others: "Basic" },
    { name: "Secure SSL Encryption", us: true, others: true },
    { name: "Commercial License Included", us: true, others: false },
  ];

  return (
    <section className="py-24 px-6 bg-[#0c0c0c] border-y border-white/5">
       <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Top Creators Choose Us</h2>
              <p className="text-gray-400">Don't settle for less. See how we stack up against the competition.</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-3 p-6 border-b border-white/10 bg-white/5">
                  <div className="col-span-1 flex items-center font-bold text-gray-400">Feature</div>
                  <div className="col-span-1 text-center">
                      <div className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-bold text-sm">
                          Starscale Premium
                      </div>
                  </div>
                  <div className="col-span-1 text-center font-semibold text-gray-500">Others</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                  {features.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 p-6 hover:bg-white/5 transition-colors">
                          <div className="col-span-1 flex items-center text-sm md:text-base font-medium text-gray-200">
                              {item.name}
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                              {item.us === true ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-400 fill-green-400/20" />
                              ) : (
                                  <span className={`font-bold ${item.highlight ? 'text-green-400' : 'text-white'}`}>{item.us}</span>
                              )}
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                              {item.others === false ? (
                                  <XCircle className="w-6 h-6 text-gray-600" />
                              ) : item.others === true ? (
                                  <CheckCircle2 className="w-6 h-6 text-gray-600" />
                              ) : (
                                  <span className="text-gray-500 text-sm">{item.others}</span>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
       </div>
    </section>
  );
};

const StorePage = () => {
  const scrollToProducts = () => {
    document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Premium Store | Unlock Your Potential</title>
        <meta name="description" content="Browse our exclusive collection of high-growth products. Trusted by 10,000+ creators." />
      </Helmet>
      
      <div className="min-h-screen bg-[#0A0A0A]">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] -z-10 opacity-50" />
            
            <div className="container mx-auto text-center max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8">
                        <Sparkles className="w-3 h-3" /> New Collection Available
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-8 leading-[1.1]">
                        Scale Your Business <br/>
                        <span className="accent-gradient-text">Faster Than Ever.</span>
                    </h1>
                    
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Premium tools and resources designed for serious growth. <br className="hidden md:block" />
                        Join over 10,000+ creators who are already winning.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button 
                            onClick={scrollToProducts} 
                            size="lg" 
                            className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-bold rounded-full"
                        >
                            Browse All Products
                        </Button>
                        <div className="flex -space-x-3">
                             {[1,2,3,4].map(i => (
                                 <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A0A0A] bg-gray-800 overflow-hidden">
                                     <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                 </div>
                             ))}
                             <div className="w-10 h-10 rounded-full border-2 border-[#0A0A0A] bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
                                 +2k
                             </div>
                        </div>
                        <span className="text-sm text-gray-400">Happy Customers</span>
                    </div>
                </motion.div>
            </div>
        </section>

        {/* Trust Indicators */}
        <TrustSection />

        {/* Main Products Grid */}
        <section id="products-grid" className="py-24 px-6">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold text-white mb-3">Featured Products</h2>
                        <p className="text-gray-400">Hand-picked packages optimized for maximum ROI. Act fast—inventory is limited.</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                            <HelpCircle className="w-4 h-4" />
                            <span>Need help choosing? Contact Support</span>
                        </div>
                    </div>
                </div>
                <ProductsList />
            </div>
        </section>

        {/* Comparison Section */}
        <ComparisonSection />

        {/* Social Proof */}
        <StoreTestimonials />

        {/* Bottom CTA */}
        <section className="py-24 px-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 -z-10" />
             <div className="container mx-auto max-w-4xl text-center glass-card p-12 rounded-3xl border border-white/10">
                <h2 className="text-4xl font-bold text-white mb-6">Ready to get started?</h2>
                <p className="text-xl text-gray-300 mb-8">
                    Don't miss out on these limited-time offers. <br/>
                    Secure your package today and get instant access.
                </p>
                <Button onClick={scrollToProducts} size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-6 px-10 text-lg shadow-xl hover:shadow-cyan-500/20 transition-all">
                    Shop Now - Risk Free
                </Button>
                <p className="mt-4 text-sm text-gray-500">60-Day Money Back Guarantee • Instant Delivery</p>
             </div>
        </section>
      </div>
    </>
  );
};

export default StorePage;