import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, MapPin, Users, MessageSquare, BarChart3 } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: ShoppingBag,
      title: 'E-commerce Intelligence',
      description: 'Analyze Amazon & Shopify reviews to optimize listings, identify product gaps, and outperform competitors.',
      color: 'text-cyan-400'
    },
    {
      icon: Star,
      title: 'Reputation Management',
      description: 'Master your brand image on Trustpilot & G2. Turn feedback into trust and social proof.',
      color: 'text-green-400'
    },
    {
      icon: MapPin,
      title: 'Local Dominance',
      description: 'Dominate local search by analyzing Google Maps & Yelp reviews to enhance customer experience.',
      color: 'text-red-400'
    },
    {
      icon: Users,
      title: 'Gig Economy Mastery',
      description: 'Optimize your Fiverr & Upwork profiles by turning client feedback into a 5-star magnet.',
      color: 'text-purple-400'
    },
    {
      icon: MessageSquare,
      title: 'Social Listening',
      description: 'Tune into conversations on Twitter & Reddit to understand market sentiment and trends.',
      color: 'text-blue-400'
    },
    {
      icon: BarChart3,
      title: 'Enterprise Analytics',
      description: 'Custom, large-scale analysis for your unique data sources, providing deep strategic insights.',
      color: 'text-yellow-400'
    }
  ];

  const handleMouseMove = e => {
    for(const card of document.getElementsByClassName("spotlight-effect")) {
      const rect = card.getBoundingClientRect(),
            x = e.clientX - rect.left,
            y = e.clientY - rect.top;

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--y", `${y}px`);
    }
  }

  return (
    <section id="services" className="py-24 px-6" onMouseMove={handleMouseMove}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="gradient-text">One Platform,</span> <span className="text-white">Infinite Insights.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Starscale connects to all your feedback channels, transforming scattered data into a unified strategy for growth.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-8 spotlight-effect"
            >
              <div className="flex items-center mb-4">
                <service.icon className={`w-8 h-8 mr-4 ${service.color}`} />
                <h3 className="text-2xl font-bold text-white">{service.title}</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;