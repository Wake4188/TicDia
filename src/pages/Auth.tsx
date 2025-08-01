import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { LogIn, User, Eye, EyeOff } from "lucide-react";
import { validateEmail, validatePassword, sanitizeErrorMessage } from "@/utils/security";
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);
  const validateForm = (): boolean => {
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: passwordValidation.message,
        variant: "destructive"
      });
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) {
          const errorMessage = sanitizeErrorMessage(error);
          if (errorMessage.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Login Failed",
              description: "Unable to sign in. Please try again.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been successfully logged in."
          });
          navigate("/");
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const {
          error
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (error) {
          const errorMessage = sanitizeErrorMessage(error);
          if (errorMessage.includes("User already registered")) {
            toast({
              title: "Account Exists",
              description: "An account with this email already exists. Try logging in instead.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: "Unable to create account. Please try again.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account."
          });
          setIsLogin(true);
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSkip = () => {
    navigate("/");
  };
  return <div className="min-h-screen bg-wikitok-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-wikitok-red mb-2">TicDia</h1>
          <p className="text-white/60">
            {isLogin ? "Welcome back!" : "Join the community"}
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} className="bg-white/5 border-white/20 text-white placeholder:text-white/40" placeholder="Enter your email" />
            </div>

            <div>
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required maxLength={128} className="bg-white/5 border-white/20 text-white placeholder:text-white/40 pr-10" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && <div>
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm Password
                </Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required maxLength={128} className="bg-white/5 border-white/20 text-white placeholder:text-white/40" placeholder="Confirm your password" />
              </div>}

            <Button type="submit" disabled={loading} className="w-full bg-wikitok-red hover:bg-wikitok-red/90 text-white">
              {loading ? <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </div> : <div className="flex items-center gap-2">
                  {isLogin ? <LogIn className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {isLogin ? "Sign In" : "Sign Up"}
                </div>}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => {
            setIsLogin(!isLogin);
            setPassword("");
            setConfirmPassword("");
          }} className="text-wikitok-blue hover:text-wikitok-blue/80 text-sm">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Button onClick={handleSkip} variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5">
              Continue without account
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;