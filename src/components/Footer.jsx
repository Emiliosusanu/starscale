import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Twitter, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    Product: ['Features', 'Products', 'Integrations', 'API', 'Pricing'],
    Company: ['About Us', 'Careers', 'Blog', 'Press'],
    Resources: ['Case Studies', 'Help Center', 'Privacy Policy', 'Terms of Service'],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' }
  ];

  return (
    <footer className="bg-black/50 border-t border-white/10">
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tighter">Starscale</span>
            </div>
            <p className="text-gray-400 mb-6">Turn reviews into revenue.</p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <span className="text-lg font-semibold text-white mb-4 block">{category}</span>
                <ul className="space-y-3">
                  {links.map((link, index) => (
                    <li key={index}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Starscale Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;