import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Star, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, {
      data: { full_name: name },
    });
    if (!error) {
      toast({
        title: 'Account Created! 🎉',
        description: 'Please check your email for a verification link.',
      });
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Register - Starscale</title>
        <meta name="description" content="Create a new Starscale account." />
      </Helmet>
      <div className="container mx-auto px-6 py-24 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'circOut' }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Star className="w-10 h-10 text-cyan-400" />
              <span className="text-3xl font-bold text-white">Starscale</span>
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tighter text-white">Create an Account</h1>
            <p className="text-gray-400 mt-2">Join Starscale to unlock powerful features.</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <Input id="name" name="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white focus:ring-cyan-400" required />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white focus:ring-cyan-400" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white focus:ring-cyan-400" required />
              </div>
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 py-3 font-bold shimmer-button relative overflow-hidden" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
            <div className="mt-6 text-center text-gray-400">
              <p>Already have an account? <Link to="/login" className="font-semibold text-cyan-400 hover:underline">Log in</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;