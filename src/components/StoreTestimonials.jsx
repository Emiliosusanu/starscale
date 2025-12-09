import React from 'react';
import { motion } from 'framer-motion';
import { Star, BadgeCheck, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "E-commerce Founder",
    content: "The growth package completely transformed my business. We saw a 300% increase in traffic within the first week. Worth every penny.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    rating: 5
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "Digital Marketer",
    content: "I was skeptical at first, but the results speak for themselves. The analytics tools alone are worth the price of the entire bundle.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 5
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Content Creator",
    content: "Finally, a solution that actually delivers on its promises. The support team is incredible, and the setup was instant.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    rating: 5
  }
];

const StoreTestimonials = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0A0A0A] via-[#111] to-[#0A0A0A] -z-10" />
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-semibold mb-6"
          >
            <Star className="w-4 h-4 fill-yellow-400" />
            Trusted by 10,000+ Customers
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Don't Just Take Our Word For It
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Join thousands of satisfied customers who have leveled up their game with our premium packages.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl relative group hover:border-cyan-500/30 transition-colors"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5 group-hover:text-cyan-500/20 transition-colors" />
              
              <div className="flex items-center gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              <p className="text-gray-300 mb-8 leading-relaxed">"{testimonial.content}"</p>

              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white/10">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    {testimonial.name}
                    <BadgeCheck className="w-4 h-4 text-cyan-400" />
                  </h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreTestimonials;