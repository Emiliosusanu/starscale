import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Target, ShieldCheck, BarChartBig, Zap, Globe } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: BrainCircuit,
      title: 'Predictive AI Engine',
      description: 'Our proprietary AI doesn\'t just analyze the past; it predicts future trends and customer behavior.'
    },
    {
      icon: Target,
      title: 'Actionable Growth-Hacks',
      description: 'Receive concrete, data-backed strategies and "growth-hacks" to implement for immediate impact.'
    },
    {
      icon: ShieldCheck,
      title: 'Bank-Grade Security',
      description: 'Your data is encrypted and protected with the same security standards used by financial institutions.'
    },
    {
      icon: BarChartBig,
      title: 'Holistic Dashboards',
      description: 'Visualize your entire brand reputation in one stunning, intuitive, and fully interactive dashboard.'
    },
    {
      icon: Zap,
      title: 'Real-Time Alerts',
      description: 'Get instant notifications for critical feedback, allowing you to react and manage situations proactively.'
    },
    {
      icon: Globe,
      title: 'Global Sentiment Analysis',
      description: 'Understand nuances in feedback across different languages and cultures with our global analysis models.'
    }
  ];

  return (
    <section id="features" className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="gradient-text">An Unfair</span> <span className="text-white">Advantage.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Starscale is more than a tool; it's your strategic partner for market domination.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="w-14 h-14 bg-cyan-400/10 rounded-xl flex items-center justify-center mb-6 border border-cyan-400/20">
                <feature.icon className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;