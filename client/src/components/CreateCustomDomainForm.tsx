
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCustomDomainSchema, type InsertCustomDomain } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, ChevronDown, ChevronRight, Info, Users, Target, Shield, Settings } from "lucide-react";

const complianceStandards = [
  { id: "HIPAA", label: "HIPAA", description: "Health Insurance Portability and Accountability Act" },
  { id: "CMS", label: "CMS", description: "Centers for Medicare & Medicaid Services" },
  { id: "NCQA", label: "NCQA", description: "National Committee for Quality Assurance" },
  { id: "GDPR", label: "GDPR", description: "General Data Protection Regulation" },
  { id: "FDA", label: "FDA", description: "Food and Drug Administration" },
  { id: "SOC2", label: "SOC 2", description: "Service Organization Control 2" },
  { id: "SOX", label: "SOX", description: "Sarbanes-Oxley Act" },
  { id: "PCI-DSS", label: "PCI DSS", description: "Payment Card Industry Data Security Standard" },
  { id: "None", label: "None", description: "No specific compliance requirements" },
];

const scenarioStyleOptions = [
  { value: "Declarative", label: "Declarative (Recommended)", description: "Focus on business outcomes and what should happen" },
  { value: "Imperative", label: "Imperative", description: "Focus on specific actions and how things should be done" },
  { value: "Hybrid", label: "Hybrid", description: "Mix of declarative and imperative approaches" },
];

interface CreateCustomDomainFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateCustomDomainForm({ onSuccess, onCancel }: CreateCustomDomainFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [primaryActorTags, setPrimaryActorTags] = useState<string[]>([]);
  const [useCaseTags, setUseCaseTags] = useState<string[]>([]);
  const [currentPrimaryActor, setCurrentPrimaryActor] = useState("");
  const [currentUseCase, setCurrentUseCase] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const form = useForm<InsertCustomDomain>({
    resolver: zodResolver(insertCustomDomainSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      primaryActors: "",
      businessUseCases: "",
      complianceContext: ["None"],
      stepStyle: "Declarative",
      auditabilityRequired: false,
      instructions: "",
      isPublic: false,
    },
  });

  const createDomainMutation = useMutation({
    mutationFn: async (data: InsertCustomDomain) => {
      const res = await apiRequest("POST", "/api/custom-domains", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create custom domain");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Custom domain created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains/my"] });
      form.reset();
      setPrimaryActorTags([]);
      setUseCaseTags([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create custom domain",
        variant: "destructive",
      });
    },
  });

  const addPrimaryActor = () => {
    if (currentPrimaryActor.trim() && !primaryActorTags.includes(currentPrimaryActor.trim())) {
      const newTags = [...primaryActorTags, currentPrimaryActor.trim()];
      setPrimaryActorTags(newTags);
      form.setValue("primaryActors", newTags.join(", "));
      setCurrentPrimaryActor("");
    }
  };

  const removePrimaryActor = (actor: string) => {
    const newTags = primaryActorTags.filter(tag => tag !== actor);
    setPrimaryActorTags(newTags);
    form.setValue("primaryActors", newTags.join(", "));
  };

  const addUseCase = () => {
    if (currentUseCase.trim() && !useCaseTags.includes(currentUseCase.trim())) {
      const newTags = [...useCaseTags, currentUseCase.trim()];
      setUseCaseTags(newTags);
      form.setValue("businessUseCases", newTags.join(", "));
      setCurrentUseCase("");
    }
  };

  const removeUseCase = (useCase: string) => {
    const newTags = useCaseTags.filter(tag => tag !== useCase);
    setUseCaseTags(newTags);
    form.setValue("businessUseCases", newTags.join(", "));
  };

  const onSubmit = (data: InsertCustomDomain) => {
    createDomainMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Domain Key *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="healthcare-emr" 
                        className="focus:ring-2 focus:ring-blue-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-600">
                      Machine-readable identifier (lowercase, hyphens allowed)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Display Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Healthcare EMR System" 
                        className="focus:ring-2 focus:ring-blue-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-600">
                      Human-readable name shown in domain selector
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this domain covers and its key characteristics..." 
                      rows={3}
                      className="focus:ring-2 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-600">
                    Brief overview of the domain's purpose and scope
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Domain Context Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Domain Context</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="primaryActors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Primary Actors *</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Patient, Doctor, Nurse"
                            value={currentPrimaryActor}
                            onChange={(e) => setCurrentPrimaryActor(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addPrimaryActor();
                              }
                            }}
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                          <Button type="button" onClick={addPrimaryActor} size="sm" variant="outline">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-gray-50">
                          {primaryActorTags.map((actor) => (
                            <Badge key={actor} variant="secondary" className="flex items-center gap-1">
                              {actor}
                              <X 
                                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                                onClick={() => removePrimaryActor(actor)} 
                              />
                            </Badge>
                          ))}
                          {primaryActorTags.length === 0 && (
                            <span className="text-sm text-gray-400">No actors added yet</span>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-gray-600">
                      Key user roles who interact with your system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessUseCases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Key Use Cases *</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Schedule Appointment, Record Vitals"
                            value={currentUseCase}
                            onChange={(e) => setCurrentUseCase(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addUseCase();
                              }
                            }}
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                          <Button type="button" onClick={addUseCase} size="sm" variant="outline">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-gray-50">
                          {useCaseTags.map((useCase) => (
                            <Badge key={useCase} variant="secondary" className="flex items-center gap-1">
                              {useCase}
                              <X 
                                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                                onClick={() => removeUseCase(useCase)} 
                              />
                            </Badge>
                          ))}
                          {useCaseTags.length === 0 && (
                            <span className="text-sm text-gray-400">No use cases added yet</span>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-gray-600">
                      High-level business workflows and operations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="complianceContext"
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Compliance Standards *
                  </FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-md bg-gray-50">
                    {complianceStandards.map((standard) => (
                      <FormField
                        key={standard.id}
                        control={form.control}
                        name="complianceContext"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(standard.id)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (standard.id === "None") {
                                    if (checked) {
                                      field.onChange(["None"]);
                                    } else {
                                      field.onChange([]);
                                    }
                                  } else {
                                    let newValue;
                                    if (checked) {
                                      newValue = [...currentValue.filter(v => v !== "None"), standard.id];
                                    } else {
                                      newValue = currentValue.filter(v => v !== standard.id);
                                    }
                                    field.onChange(newValue.length === 0 ? ["None"] : newValue);
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium cursor-pointer text-gray-900">
                                {standard.label}
                              </FormLabel>
                              <p className="text-xs text-gray-600">
                                {standard.description}
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormDescription className="text-xs text-gray-600">
                    Select all applicable regulatory frameworks and compliance requirements
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {/* AI Instructions Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">AI Instructions</h3>
            </div>

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">AI Generation Instructions *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide detailed instructions for how AI should generate feature files in this domain. Include specific terminology, patterns, data elements, integration considerations, and any domain-specific testing approaches..." 
                      rows={8}
                      className="focus:ring-2 focus:ring-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-600">
                    Detailed guidance for AI feature generation (minimum 20 characters, maximum 2000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Advanced Settings - Collapsible */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto text-sm font-medium">
                <Settings className="w-4 h-4" />
                Advanced Settings
                {advancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 mt-4 p-4 border rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="stepStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-900">Preferred Scenario Style</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="Select scenario style" />
                          </SelectTrigger>
                          <SelectContent>
                            {scenarioStyleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-gray-500">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600">
                        Choose how scenario steps should be structured
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auditabilityRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-semibold text-gray-900">Auditability Required</FormLabel>
                        <FormDescription className="text-xs text-gray-700">
                          Include audit trails and compliance logging in scenarios
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-gray-900">Public Domain</FormLabel>
                      <FormDescription className="text-xs text-gray-700">
                        Allow other users to use this domain for feature generation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={createDomainMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createDomainMutation.isPending ? "Creating..." : "Create Domain"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="px-8">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
