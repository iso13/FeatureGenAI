/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, type RegisterInput, type LoginInput, type ForgotPasswordInput, type ResetPasswordInput } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  // Call all hooks unconditionally at the top level
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, forgotPasswordMutation, resetPasswordMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [resetToken, setResetToken] = useState<string>("");

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "developer",
    },
  });

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle navigation with useEffect
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onRegister = useCallback(async (data: RegisterInput) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({
        title: "Registration successful! 🎉",
        description: "Please login with your new account",
      });
      setActiveTab("login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  }, [registerMutation, toast, setActiveTab]);

  const onLogin = useCallback(async (data: LoginInput) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: "Welcome back! 👋",
        description: "Successfully logged in",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      });
    }
  }, [loginMutation, toast, navigate]);

  // Early return if authenticated to avoid rendering the form
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Welcome to Feature Generator</h1>
            <p className="text-muted-foreground">Join our beta testing program</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register" | "forgot" | "reset")}>
            <TabsList className={`grid w-full mb-6 ${activeTab === "forgot" || activeTab === "reset" ? "grid-cols-1" : "grid-cols-2"}`}>
              {(activeTab === "login" || activeTab === "register") && (
                <>
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </>
              )}
              {activeTab === "forgot" && (
                <TabsTrigger value="forgot">Reset Password</TabsTrigger>
              )}
              {activeTab === "reset" && (
                <TabsTrigger value="reset">Set New Password</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" data-testid="email-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" data-testid="password-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting} data-testid="login-button">
                    {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("forgot")}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          >
                            <option value="developer">Developer</option>
                            <option value="tester">Tester</option>
                            <option value="business_analyst">Business Analyst</option>
                            <option value="stakeholder">Stakeholder</option>
                            <option value="product_manager">Product Manager (Requires Approval)</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                    {registerForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="forgot">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold">Reset Your Password</h2>
                  <p className="text-muted-foreground text-sm">Enter your email and we'll send you a reset link</p>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get("email") as string;
                  if (email) {
                    forgotPasswordMutation.mutateAsync({ email });
                  }
                }} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="text-sm font-medium">Email</label>
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-sm text-primary hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="reset">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold">Set New Password</h2>
                  <p className="text-muted-foreground text-sm">Enter your new password below</p>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const password = formData.get("password") as string;
                  const confirmPassword = formData.get("confirmPassword") as string;
                  
                  if (password !== confirmPassword) {
                    toast({
                      title: "Password Mismatch",
                      description: "Passwords don't match. Please try again.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (resetToken && password) {
                    resetPasswordMutation.mutateAsync({ 
                      token: resetToken, 
                      password, 
                      confirmPassword 
                    }).then(() => {
                      setActiveTab("login");
                    });
                  }
                }} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="text-sm font-medium">New Password</label>
                    <Input
                      id="new-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
                    {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-sm text-primary hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Right side - Feature highlights */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold mb-4">Generate Cucumber Features with AI</h2>
          <ul className="space-y-4 text-lg">
            <li>✨ AI-powered feature generation</li>
            <li>📝 Comprehensive test scenarios</li>
            <li>🔄 Real-time processing</li>
            <li>📊 Analytics and insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}