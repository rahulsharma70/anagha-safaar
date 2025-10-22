import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { PasswordStrengthIndicator, validatePassword } from "@/components/auth/PasswordStrengthIndicator";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CaptchaComponent from "@/components/CaptchaComponent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EnhancedAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const requireCaptcha = attemptCount >= 2;

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from || '/dashboard';
      navigate(from);
    }
  }, [user, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requireCaptcha && !captchaToken) {
      toast.error("Please complete the CAPTCHA verification");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      setAttemptCount(prev => prev + 1);
      
      // Check for account lockout
      if (error.message?.toLowerCase().includes('locked') || 
          error.message?.toLowerCase().includes('too many requests') ||
          error.message?.toLowerCase().includes('rate limit')) {
        toast.error("Account locked. Try again after 15 minutes.", {
          duration: 8000,
          description: "Multiple failed login attempts detected. For security, your account has been temporarily locked."
        });
      } else if (error.message?.toLowerCase().includes('invalid')) {
        toast.error("Invalid email or password", {
          description: `${5 - attemptCount} attempts remaining before account lock`
        });
      } else {
        toast.error("Unable to sign in. Please check your credentials.");
      }
      
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password strength
    if (!validation.isValid) {
      toast.error("Password does not meet security requirements", {
        description: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      });
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (requireCaptcha && !captchaToken) {
      toast.error("Please complete the CAPTCHA verification");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      // Check for password-related errors from backend
      if (error.message?.toLowerCase().includes('password')) {
        toast.error("Password is too weak or commonly used", {
          description: "Please choose a stronger, unique password"
        });
      } else if (error.message?.toLowerCase().includes('email')) {
        toast.error("Email is already registered", {
          description: "Please sign in or use a different email"
        });
      } else {
        toast.error("Unable to create account. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-primary">
                Anagha <span className="text-accent">Safar</span>
              </h1>
            </Link>
            <p className="text-muted-foreground mt-2">Your secure journey starts here</p>
          </div>

          <Card className="shadow-lg animate-scale-in">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {requireCaptcha && (
                      <div className="animate-fade-in">
                        <CaptchaComponent onVerify={setCaptchaToken} />
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || (requireCaptcha && !captchaToken)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <PasswordRequirements />
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={password} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword && !passwordsMatch && (
                        <p className="text-sm text-destructive animate-fade-in">Passwords do not match</p>
                      )}
                    </div>

                    {requireCaptcha && (
                      <div className="animate-fade-in">
                        <CaptchaComponent onVerify={setCaptchaToken} />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !validation.isValid || !passwordsMatch || (requireCaptcha && !captchaToken)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-smooth">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EnhancedAuth;
