import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  FileText,
  Code,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { DomainGlossary, DomainProcess, DomainExample } from "@shared/schema";

export default function DomainKnowledge() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState("glossary");

  // Dialog states
  const [glossaryDialog, setGlossaryDialog] = useState(false);
  const [processDialog, setProcessDialog] = useState(false);
  const [exampleDialog, setExampleDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [glossaryForm, setGlossaryForm] = useState({ term: "", definition: "", weight: 5 });
  const [processForm, setProcessForm] = useState({ title: "", content: "", category: "process", weight: 5 });
  const [exampleForm, setExampleForm] = useState({ title: "", tags: "", featureContent: "", weight: 5 });

  // Fetch data
  const { data: glossaryTerms = [] } = useQuery({
    queryKey: ["domain-glossary", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const res = await fetch(`/api/domain/glossary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch glossary");
      return res.json();
    },
  });

  const { data: processes = [] } = useQuery({
    queryKey: ["domain-processes", searchTerm, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      const res = await fetch(`/api/domain/processes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch processes");
      return res.json();
    },
  });

  const { data: examples = [] } = useQuery({
    queryKey: ["domain-examples", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const res = await fetch(`/api/domain/examples?${params}`);
      if (!res.ok) throw new Error("Failed to fetch examples");
      return res.json();
    },
  });

  // Mutations
  const createGlossaryMutation = useMutation({
    mutationFn: async (data: typeof glossaryForm) => {
      const res = await fetch("/api/domain/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create glossary term");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-glossary"] });
      setGlossaryDialog(false);
      setGlossaryForm({ term: "", definition: "", weight: 5 });
      toast({ title: "Success", description: "Glossary term created" });
    },
  });

  const createProcessMutation = useMutation({
    mutationFn: async (data: typeof processForm) => {
      const res = await fetch("/api/domain/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create process");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-processes"] });
      setProcessDialog(false);
      setProcessForm({ title: "", content: "", category: "process", weight: 5 });
      toast({ title: "Success", description: "Process created" });
    },
  });

  const createExampleMutation = useMutation({
    mutationFn: async (data: typeof exampleForm) => {
      const res = await fetch("/api/domain/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create example");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-examples"] });
      setExampleDialog(false);
      setExampleForm({ title: "", tags: "", featureContent: "", weight: 5 });
      toast({ title: "Success", description: "Example created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const res = await fetch(`/api/domain/${type}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete ${type}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`domain-${variables.type}`] });
      toast({ title: "Success", description: "Item deleted" });
    },
  });

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    if (type === "glossary") {
      setGlossaryForm({ term: item.term, definition: item.definition, weight: item.weight });
      setGlossaryDialog(true);
    } else if (type === "processes") {
      setProcessForm({ title: item.title, content: item.content, category: item.category, weight: item.weight });
      setProcessDialog(true);
    } else if (type === "examples") {
      setExampleForm({ title: item.title, tags: item.tags, featureContent: item.featureContent, weight: item.weight });
      setExampleDialog(true);
    }
  };

  if (!user || (user.role !== 'admin' && !user.isAdmin)) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only administrators can access domain knowledge management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Domain Knowledge</h1>
          <p className="text-muted-foreground">
            Manage your company's glossary, processes, and approved examples for AI feature generation
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search across all knowledge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeTab === "processes" && (
          <Select value={categoryFilter || undefined} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="process">Processes</SelectItem>
              <SelectItem value="policy">Policies</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="glossary" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Glossary ({glossaryTerms.length})
          </TabsTrigger>
          <TabsTrigger value="processes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Processes & Policies ({processes.length})
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Approved Examples ({examples.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="glossary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Domain Glossary</CardTitle>
                <CardDescription>
                  Define key terms and concepts for your domain
                </CardDescription>
              </div>
              <Dialog open={glossaryDialog} onOpenChange={setGlossaryDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Term
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Term' : 'Add Glossary Term'}
                    </DialogTitle>
                    <DialogDescription>
                      Define a key term for your domain knowledge
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="term">Term</Label>
                      <Input
                        id="term"
                        value={glossaryForm.term}
                        onChange={(e) => setGlossaryForm({ ...glossaryForm, term: e.target.value })}
                        placeholder="e.g., API Gateway"
                      />
                    </div>
                    <div>
                      <Label htmlFor="definition">Definition</Label>
                      <Textarea
                        id="definition"
                        value={glossaryForm.definition}
                        onChange={(e) => setGlossaryForm({ ...glossaryForm, definition: e.target.value })}
                        placeholder="Clear definition of the term..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Priority Weight (1-10)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={1}
                        max={10}
                        value={glossaryForm.weight}
                        onChange={(e) => setGlossaryForm({ ...glossaryForm, weight: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setGlossaryDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => createGlossaryMutation.mutate(glossaryForm)}>
                        {editingItem ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Definition</TableHead>
                    <TableHead className="w-20">Weight</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {glossaryTerms.map((term: DomainGlossary) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.term}</TableCell>
                      <TableCell className="max-w-md truncate">{term.definition}</TableCell>
                      <TableCell>
                        <Badge variant={term.weight >= 8 ? "default" : term.weight >= 5 ? "secondary" : "outline"}>
                          {term.weight}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(term, "glossary")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Term</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{term.term}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ type: "glossary", id: term.id })}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Processes & Policies</CardTitle>
                <CardDescription>
                  Document your business processes and policies
                </CardDescription>
              </div>
              <Dialog open={processDialog} onOpenChange={setProcessDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Process
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Process' : 'Add Process/Policy'}
                    </DialogTitle>
                    <DialogDescription>
                      Document a business process or policy
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={processForm.title}
                        onChange={(e) => setProcessForm({ ...processForm, title: e.target.value })}
                        placeholder="e.g., Customer Onboarding Process"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={processForm.category} 
                        onValueChange={(value) => setProcessForm({ ...processForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="process">Process</SelectItem>
                          <SelectItem value="policy">Policy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={processForm.content}
                        onChange={(e) => setProcessForm({ ...processForm, content: e.target.value })}
                        placeholder="Detailed description of the process or policy..."
                        rows={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Priority Weight (1-10)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={1}
                        max={10}
                        value={processForm.weight}
                        onChange={(e) => setProcessForm({ ...processForm, weight: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setProcessDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => createProcessMutation.mutate(processForm)}>
                        {editingItem ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="w-20">Weight</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.map((process: DomainProcess) => (
                    <TableRow key={process.id}>
                      <TableCell className="font-medium">{process.title}</TableCell>
                      <TableCell>
                        <Badge variant={process.category === 'policy' ? 'secondary' : 'outline'}>
                          {process.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{process.content}</TableCell>
                      <TableCell>
                        <Badge variant={process.weight >= 8 ? "default" : process.weight >= 5 ? "secondary" : "outline"}>
                          {process.weight}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(process, "processes")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Process</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{process.title}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ type: "processes", id: process.id })}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Approved Examples</CardTitle>
                <CardDescription>
                  Store approved Gherkin features as examples for AI generation
                </CardDescription>
              </div>
              <Dialog open={exampleDialog} onOpenChange={setExampleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Example
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Example' : 'Add Approved Example'}
                    </DialogTitle>
                    <DialogDescription>
                      Add a well-crafted Gherkin feature as an example
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={exampleForm.title}
                        onChange={(e) => setExampleForm({ ...exampleForm, title: e.target.value })}
                        placeholder="e.g., User Authentication Flow"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={exampleForm.tags}
                        onChange={(e) => setExampleForm({ ...exampleForm, tags: e.target.value })}
                        placeholder="e.g., authentication, login, security"
                      />
                    </div>
                    <div>
                      <Label htmlFor="featureContent">Gherkin Feature Content</Label>
                      <Textarea
                        id="featureContent"
                        value={exampleForm.featureContent}
                        onChange={(e) => setExampleForm({ ...exampleForm, featureContent: e.target.value })}
                        placeholder="Feature: User Authentication&#10;&#10;Background:&#10;  Given the user is on the login page&#10;&#10;Scenario: Successful login..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Priority Weight (1-10)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={1}
                        max={10}
                        value={exampleForm.weight}
                        onChange={(e) => setExampleForm({ ...exampleForm, weight: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setExampleDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => createExampleMutation.mutate(exampleForm)}>
                        {editingItem ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="w-20">Weight</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examples.map((example: DomainExample) => (
                    <TableRow key={example.id}>
                      <TableCell className="font-medium">{example.title}</TableCell>
                      <TableCell>
                        {example.tags.split(',').map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="mr-1 mb-1">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <pre className="text-xs truncate bg-muted p-2 rounded">
                          {example.featureContent.split('\n').slice(0, 3).join('\n')}
                          {example.featureContent.split('\n').length > 3 && '...'}
                        </pre>
                      </TableCell>
                      <TableCell>
                        <Badge variant={example.weight >= 8 ? "default" : example.weight >= 5 ? "secondary" : "outline"}>
                          {example.weight}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(example, "examples")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Example</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{example.title}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ type: "examples", id: example.id })}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
