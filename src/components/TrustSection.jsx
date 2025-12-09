import React from 'react';
import { ShieldCheck, Clock, Zap, Award } from 'lucide-react';

const TrustSection = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "Secure Payment",
      desc: "256-bit SSL Encrypted Checkout"
    },
    {
      icon: Award,
      title: "Money-Back Guarantee",
      desc: "30-Day Risk-Free Trial"
    },
    {
      icon: Zap,
      title: "Instant Delivery",
      desc: "Get Access Immediately"
    },
    {
      icon: Clock,
      title: "24/7 Support",
      desc: "Expert Help Anytime"
    }
  ];

  return (
    <div className="border-y border-white/5 bg-white/[0.02] py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustSection;