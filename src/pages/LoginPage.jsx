import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Star, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - Starscale</title>
        <meta name="description" content="Log in to your Starscale account." />
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
            <h1 className="text-4xl font-extrabold tracking-tighter text-white">Welcome Back</h1>
            <p className="text-gray-400 mt-2">Enter your credentials to access your account.</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white focus:ring-cyan-400" required />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link to="#" className="text-sm text-cyan-400 hover:underline">Forgot password?</Link>
                </div>
                <Input id="password" name="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white focus:ring-cyan-400" required />
              </div>
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 py-3 font-bold shimmer-button relative overflow-hidden" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log In'}
              </Button>
            </form>
            <div className="mt-6 text-center text-gray-400">
              <p>Don't have an account? <Link to="/register" className="font-semibold text-cyan-400 hover:underline">Sign up</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;