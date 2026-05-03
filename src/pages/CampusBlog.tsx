import { useState, useEffect } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  FileText, 
  Plus, 
  Heart, 
  MessageSquare, 
  Trash2, 
  Send, 
  User as UserIcon,
  Calendar,
  Tag,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { PaginatedSection } from "@/components/PaginatedSection";

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  department: string;
  college: string;
  tags: string[];
  likes: string[];
  createdAt: string;
}

const CampusBlog = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Blog State
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: "",
    tags: ""
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get('/api/blogs');
      setBlogs(res.data);
    } catch (err) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === 'guest') return toast.error("Guests cannot post blogs");

    try {
      await axios.post('/api/blogs', {
        ...newBlog,
        tags: newBlog.tags.split(',').map(t => t.trim()).filter(t => t)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success("Blog posted successfully!");
      setIsCreating(false);
      setNewBlog({ title: "", content: "", tags: "" });
      fetchBlogs();
    } catch (err) {
      toast.error("Failed to post blog");
    }
  };

  const handleLike = async (id: string) => {
    try {
      await axios.put(`/api/blogs/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchBlogs();
    } catch (err) {
      toast.error("Failed to update like");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Blog deleted");
      fetchBlogs();
    } catch (err) {
      toast.error("Failed to delete blog");
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-primary flex items-center gap-3">
              <FileText className="h-10 w-10" /> Campus Blog
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Share your thoughts, news, and stories with the KMCT community.
            </p>
          </div>
          
          {user?.role !== 'guest' && (
            <Button 
              onClick={() => setIsCreating(!isCreating)}
              className="rounded-full px-6 py-6 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              {isCreating ? "Cancel" : <><Plus className="h-5 w-5 mr-2" /> Create Post</>}
            </Button>
          )}
        </div>

        {isCreating && (
          <div className="bg-card border rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Write your story</h2>
            <form onSubmit={handleCreateBlog} className="space-y-6">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  placeholder="A catchy title for your blog..." 
                  value={newBlog.title} 
                  onChange={e => setNewBlog({...newBlog, title: e.target.value})}
                  required
                  className="h-12 text-lg font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Content</Label>
                <textarea 
                  className="w-full min-h-[200px] rounded-2xl border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Share your thoughts here..."
                  value={newBlog.content}
                  onChange={e => setNewBlog({...newBlog, content: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (Comma separated)</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="campus, event, academic, life..." 
                    value={newBlog.tags} 
                    onChange={e => setNewBlog({...newBlog, tags: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-7 text-lg font-bold">
                <Send className="h-5 w-5 mr-2" /> Publish Post
              </Button>
            </form>
          </div>
        )}

        <div className="space-y-6">
          <PaginatedSection
            items={blogs}
            itemsPerPage={5}
            searchPlaceholder="Search blogs by title, author, or tags..."
            renderItem={(paginatedBlogs) => (
              <div className="grid gap-8">
                {paginatedBlogs.map((blog) => (
                  <article key={blog._id} className="group bg-card border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row">
                    <div className="p-8 flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {blog.authorName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{blog.authorName}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                              {blog.authorRole} • {blog.department}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(blog.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>

                      <h2 className="text-2xl font-black group-hover:text-primary transition-colors leading-tight">
                        {blog.title}
                      </h2>
                      
                      <p className="text-muted-foreground leading-relaxed line-clamp-3 text-sm">
                        {blog.content}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {blog.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-6 border-t flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => handleLike(blog._id)}
                            className={`flex items-center gap-2 text-sm font-bold transition-colors ${blog.likes.includes(user?.id || '') ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                          >
                            <Heart className={`h-5 w-5 ${blog.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                            {blog.likes.length}
                          </button>
                          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <MessageSquare className="h-5 w-5" />
                            Comment
                          </div>
                        </div>

                        {(user?.id === blog.authorId || user?.role === 'admin') && (
                          <button 
                            onClick={() => handleDelete(blog._id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Visual decoration side */}
                    <div className="hidden md:block w-3 bg-primary/5 group-hover:bg-primary transition-colors" />
                  </article>
                ))}
              </div>
            )}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default CampusBlog;
