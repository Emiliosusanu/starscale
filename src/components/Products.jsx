import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Products = () => {
  return (
    <section id="products" className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="text-white">Our Review</span> <span className="accent-gradient-text">Packages.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Ready-to-buy packages for a quick and easy start. Explore our store for more options.
          </p>
        </motion.div>
        
        <div className="text-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-200 py-4 px-10 font-bold text-lg shimmer-button relative overflow-hidden">
                <Link to="/store">Explore The Store</Link>
            </Button>
        </div>
      </div>
    </section>
  );
};

export default Products;