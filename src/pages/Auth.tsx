import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { LogIn, User, Eye, EyeOff } from "lucide-react";
import { validateEmail, validatePassword, sanitizeErrorMessage } from "@/utils/security";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [birthYear, setBirthYear] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const birthYearOptions = Array.from({ length: 88 }, (_, i) => currentYear - 13 - i);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/");
    };
    checkUser();
  }, [navigate]);

  const validateForm = (): boolean => {
    if (!validateEmail(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return false;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({ title: "Invalid Password", description: passwordValidation.message, variant: "destructive" });
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return false;
    }
    if (!isLogin && !birthYear) {
      toast({ title: "Birth Year Required", description: "Please select your birth year.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          const errorMessage = sanitizeErrorMessage(error);
          toast({
            title: "Login Failed",
            description: errorMessage.includes("Invalid login credentials") ? "Invalid email or password." : "Unable to sign in.",
            variant: "destructive"
          });
        } else {
          toast({ title: "Welcome back!", description: "You've been successfully logged in." });
          navigate("/");
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectUrl } });
        if (error) {
          const errorMessage = sanitizeErrorMessage(error);
          toast({
            title: errorMessage.includes("User already registered") ? "Account Exists" : "Sign Up Failed",
            description: errorMessage.includes("User already registered") ? "Try logging in instead." : "Unable to create account.",
            variant: "destructive"
          });
        } else {
          if (data.user) {
            const userAge = currentYear - parseInt(birthYear);
            await supabase.from('user_preferences').upsert({
              user_id: data.user.id,
              birth_year: parseInt(birthYear),
              allow_adult_content: userAge >= 18
            }, { onConflict: 'user_id' });
          }
          toast({ title: "Account Created!", description: "You can now sign in." });
          setIsLogin(true);
          setPassword("");
          setConfirmPassword("");
          setBirthYear("");
        }
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">TicDia</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Welcome back!" : "Join the community"}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                maxLength={254}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              {!isLogin && (
                <p className="text-xs text-muted-foreground mb-2">
                  Must be 8+ characters with uppercase, lowercase, number, and special character
                </p>
              )}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  maxLength={128}
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    maxLength={128}
                    placeholder="Confirm your password"
                  />
                </div>

                <div>
                  <Label htmlFor="birthYear">Birth Year</Label>
                  <p className="text-xs text-muted-foreground mb-2">Required for content filtering (must be 13+)</p>
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your birth year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {birthYearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isLogin ? <LogIn className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {isLogin ? "Sign In" : "Sign Up"}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setPassword(""); setConfirmPassword(""); setBirthYear(""); }}
              className="text-primary hover:text-primary/80 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50">
            <Button onClick={() => navigate("/")} variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
              Continue without account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
