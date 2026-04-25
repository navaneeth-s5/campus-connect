import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";

const KioskBrowser = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get("url") || "https://kmct.org";
  const title = searchParams.get("title") || "Campus Portal";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Kiosk Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card shadow-sm z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate("/dashboard")}
            className="rounded-full shadow-md hover:shadow-lg transition-all font-bold gap-2"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Home
          </Button>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.location.reload()}
            className="rounded-full"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            className="rounded-full"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Browser Frame */}
      <div className="flex-1 w-full bg-white relative">
        <iframe 
          src={url} 
          className="w-full h-full border-none"
          title="Campus Browser"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
        
        {/* Protection Overlay (Optional - to prevent some clickjacking/nav issues if needed) */}
        {/* <div className="absolute inset-0 pointer-events-none border-t-2 border-primary/20" /> */}
      </div>
      
      {/* Kiosk Status Bar */}
      <div className="px-4 py-2 bg-muted/30 border-t text-[10px] text-muted-foreground flex justify-between items-center uppercase tracking-widest">
         <span>KMCT Kiosk System • Secure Browser Mode</span>
         <span>Session Active</span>
      </div>
    </div>
  );
};

export default KioskBrowser;
