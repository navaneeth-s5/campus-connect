import { useEffect, useState } from "react";
import axios from "axios";
import { UserCog, Users } from "lucide-react";

export function CampusDirectory() {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    fetchDirectory();
    // Setting up an interval to simulate "real-time" polling or we could use socket.io
    const interval = setInterval(fetchDirectory, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDirectory = async () => {
    try {
      const res = await axios.get('/api/auth/directory', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      // Filter for HODs and Principals
      const filtered = res.data.filter((u: any) => u.role === 'principal' || u.isHOD || u.actingHODFor);
      setLeaders(filtered);
    } catch (e) {}
  };

  if (leaders.length === 0) return <div className="text-muted-foreground p-4 text-center">Loading Directory...</div>;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leaders.map(user => {
        const isActing = !!user.actingHODFor;
        return (
          <div key={user._id} className={`p-4 rounded-xl border ${isActing ? 'bg-orange-50/50 border-orange-200' : 'bg-card'}`}>
            <div className="flex items-center gap-3">
               <div className={`p-3 rounded-full ${isActing ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                  {isActing ? <Users className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
               </div>
               <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground uppercase font-medium mt-0.5">
                    {user.role === 'principal' ? 'Principal' : isActing ? `Acting HOD - ${user.department}` : `HOD - ${user.department}`}
                  </div>
               </div>
            </div>
            {isActing && (
              <div className="mt-3 text-xs text-orange-800 bg-orange-100 px-3 py-1.5 rounded-md font-medium">
                Delegated Authority for {user.actingHODFor.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
