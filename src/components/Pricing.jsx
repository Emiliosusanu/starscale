import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Pricing = () => {
  const { toast } = useToast();

  const handlePurchase = (planName) => {
    toast({
      title: "🚧 Payment Processing Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      duration: 5000,
    });
  };

  const plans = [
    {
      name: 'Starter',
      icon: Star,
      price: '$49',
      period: 'per analysis',
      description: 'Perfect for small businesses getting started with review analysis',
      features: [
        'Single platform analysis',
        'Basic sentiment analysis',
        'PDF report delivery',
        '48-hour turnaround',
        'Email support',
        'Up to 100 reviews'
      ],
      buttonText: 'Get Started',
      popular: false,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Professional',
      icon: Zap,
      price: '$149',
      period: 'per analysis',
      description: 'Comprehensive analysis for growing businesses',
      features: [
        'Multi-platform analysis',
        'Advanced sentiment analysis',
        'Interactive dashboard',
        '24-hour turnaround',
        'Priority support',
        'Up to 500 reviews',
        'Competitor comparison',
        'Action plan included'
      ],
      buttonText: 'Choose Professional',
      popular: true,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Enterprise',
      icon: Crown,
      price: '$399',
      period: 'per analysis',
      description: 'Complete solution for large businesses and agencies',
      features: [
        'Unlimited platform analysis',
        'AI-powered insights',
        'Custom reporting',
        '12-hour turnaround',
        'Dedicated account manager',
        'Unlimited reviews',
        'White-label reports',
        'API access',
        'Monthly strategy calls'
      ],
      buttonText: 'Go Enterprise',
      popular: false,
      gradient: 'from-yellow-500 to-orange-500'
    }
  ];

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-black mb-6">
            <span className="text-white">Simple,</span>
            <br />
            <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your business needs. No hidden fees, no long-term contracts.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`pricing-card glass-effect rounded-3xl p-8 relative ${
                plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-16 h-16 bg-gradient-to-r ${plan.gradient} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-300">
                    <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(plan.name)}
                className={`w-full py-4 rounded-xl font-bold text-lg ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white neon-glow'
                    : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white'
                }`}
              >
                {plan.buttonText}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-4">Need a custom solution?</p>
          <Button
            variant="outline"
            className="border-2 border-gray-600 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-bold"
            onClick={() => handlePurchase('Custom')}
          >
            Contact Sales
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;