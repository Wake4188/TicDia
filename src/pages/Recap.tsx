import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Recap = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      </div>
      <div className="text-center">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-4xl font-bold mb-4 text-foreground">Recap Saved</h1>
        <p className="text-muted-foreground">This feature is currently disabled to save storage.</p>
      </div>
    </div>
  );
};

export default Recap;
