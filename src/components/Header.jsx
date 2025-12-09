
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, LogOut, User as UserIcon, LayoutDashboard, Crown, Settings, Heart, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut
} from '@/components/ui/dropdown-menu';
import EnhancedNotificationBell from '@/components/EnhancedNotificationBell';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const Header = ({ onCartClick }) => {
  const { cartItems } = useCart();
  const { user, profile, signOut } = useAuth();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = profile?.role === 'admin';

  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-200 hover:text-cyan-300 ${isActive ? 'text-cyan-400 font-semibold' : 'text-gray-300'}`;

  const guestLinks = (
    <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
      <NavLink to="/" className={navLinkClass} end>Home</NavLink>
      <NavLink to="/store" className={navLinkClass}>Store</NavLink>
      <a href="/#packages" className="text-gray-300 transition-colors hover:text-cyan-300">Pricing</a>
      <a href="/#how-it-works" className="text-gray-300 transition-colors hover:text-cyan-300">How It Works</a>
    </nav>
  );

  const userLinks = (
     <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
      <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
      <NavLink to="/store" className={navLinkClass}>Store</NavLink>
    </nav>
  );

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'circOut' }}
      className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-white/5 shadow-sm"
    >
      <div className="container mx-auto px-6 h-16 flex justify-between items-center">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="relative">
             <Star className="w-6 h-6 text-cyan-400 transition-transform group-hover:rotate-180 duration-700" />
             <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Starscale</span>
        </Link>

        {user ? userLinks : guestLinks}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <EnhancedNotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-transparent hover:border-white/10 focus:border-cyan-500/50 transition-all p-0 overflow-hidden ring-offset-2 ring-offset-black focus:ring-2 focus:ring-cyan-500">
                     <Avatar className="h-full w-full">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || user.email} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-900 to-blue-900 text-white text-xs font-bold">
                             {profile?.full_name ? profile.full_name.substring(0,2).toUpperCase() : user.email.substring(0,2).toUpperCase()}
                        </AvatarFallback>
                     </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2 bg-[#121212] border border-white/10 shadow-2xl rounded-xl p-1" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                         <p className="text-sm font-bold leading-none text-white truncate max-w-[180px]">
                           {profile?.full_name || 'User'}
                         </p>
                         {isAdmin && <Crown className="h-3 w-3 text-yellow-400" />}
                      </div>
                      <p className="text-xs leading-none text-gray-400 truncate font-medium mt-1">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="focus:bg-cyan-500/10 focus:text-cyan-400 cursor-pointer rounded-lg m-1 text-gray-300">
                        <Link to="/settings?tab=account" className="w-full flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-cyan-500/10 focus:text-cyan-400 cursor-pointer rounded-lg m-1 text-gray-300">
                        <Link to="/dashboard" className="w-full flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-cyan-500/10 focus:text-cyan-400 cursor-pointer rounded-lg m-1 text-gray-300">
                        <Link to="/settings?tab=preferences" className="w-full flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-cyan-500/10 focus:text-cyan-400 cursor-pointer rounded-lg m-1 text-gray-300">
                        <Link to="/dashboard?tab=orders" className="w-full flex items-center">
                            <History className="mr-2 h-4 w-4" />
                            <span>Order History</span>
                        </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer rounded-lg m-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
            <Button asChild variant="ghost" className="hidden sm:inline-flex text-gray-300 hover:text-white hover:bg-white/10">
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex bg-white text-black hover:bg-gray-200 font-semibold">
              <Link to="/register">Sign Up</Link>
            </Button>
            </>
          )}

          <div className="h-6 w-px bg-white/10 mx-1" />

          <Button onClick={onCartClick} variant="ghost" size="icon" className="relative text-gray-300 hover:text-white hover:bg-white/10 rounded-full group">
            <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-lg animate-in zoom-in duration-300">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
