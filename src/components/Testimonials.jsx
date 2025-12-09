import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Jenna Smith',
      role: 'Founder, Glow Cosmetics',
      content: 'Starscale is our secret weapon. We went from 3.8 to 4.9 stars on Amazon and saw a 200% increase in sales. The insights are pure gold.',
      avatar: 'Confident female founder in a modern office'
    },
    {
      name: 'Carlos Gomez',
      role: 'CEO, TechNova',
      content: 'The competitor analysis feature alone is worth the price. We identified a market gap and launched a new feature that captured 15% market share in 3 months.',
      avatar: 'Male CEO in a tech company boardroom'
    },
    {
      name: 'Aisha Khan',
      role: 'Top Seller, Fiverr',
      content: 'I thought I knew my clients, but Starscale showed me what they *really* wanted. My gig orders tripled, and I\'m now a Pro seller.',
      avatar: 'Creative female freelancer working on a laptop'
    }
  ];

  return (
    <section id="testimonials" className="py-24 px-6 bg-black/20">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="text-white">Don't Just Take</span> <span className="accent-gradient-text">Our Word For It.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Hear from the brands that are scaling to new heights with Starscale.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: index * 0.15, duration: 0.6, ease: 'circOut' }}
              className="glass-card rounded-2xl p-8 flex flex-col"
            >
              <Quote className="w-10 h-10 text-cyan-400/50 mb-4" />
              <p className="text-xl text-white mb-6 leading-relaxed flex-grow">
                "{testimonial.content}"
              </p>
              <div className="flex items-center mt-auto">
                <img 
                  alt={testimonial.avatar}
                  className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-cyan-400/50"
                 src="https://images.unsplash.com/photo-1649399045831-40bfde3ef21d" />
                <div>
                  <div className="font-bold text-white text-lg">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;