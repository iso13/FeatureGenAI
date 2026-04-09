/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { type User, type LoginInput, type RegisterInput, type ForgotPasswordInput, type ResetPasswordInput } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  forgotPasswordMutation: ReturnType<typeof useForgotPasswordMutation>;
  resetPasswordMutation: ReturnType<typeof useResetPasswordMutation>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
    onError: (error: Error) => {
      // Clean up error message to be more user-friendly
      let errorMessage = error.message;
      if (errorMessage.includes("Invalid email or password")) {
        errorMessage = "Please check your email and password and try again.";
      } else if (errorMessage.includes("400:") || errorMessage.includes("401:")) {
        errorMessage = "Login failed. Please check your credentials.";
      } else if (errorMessage.includes("500:") || errorMessage.includes("Network")) {
        errorMessage = "Unable to connect. Please check your internet connection and try again.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

function useRegisterMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      // Clean up error message for registration
      let errorMessage = error.message;
      if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (errorMessage.includes("400:")) {
        errorMessage = "Please check all fields and try again.";
      } else if (errorMessage.includes("500:") || errorMessage.includes("Network")) {
        errorMessage = "Unable to create account. Please check your internet connection and try again.";
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

function useLogoutMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useForgotPasswordMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      if (errorMessage.includes("not found") || errorMessage.includes("No user")) {
        errorMessage = "No account found with this email address.";
      }
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

function useResetPasswordMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      if (errorMessage.includes("invalid") || errorMessage.includes("expired")) {
        errorMessage = "This reset link has expired or is invalid. Please request a new one.";
      }
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error ?? null,
        loginMutation,
        logoutMutation,
        registerMutation,
        forgotPasswordMutation,
        resetPasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
