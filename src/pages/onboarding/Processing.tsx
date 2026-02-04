import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Processing() {
    const navigate = useNavigate();

    useEffect(() => {
        // Simulate processing time then redirect to Creator Dashboard (Shop)
        const timeout = setTimeout(() => {
            navigate("/creator/shop", { replace: true });
        }, 3000);

        return () => clearTimeout(timeout);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6 animate-fade-in">
                <div className="relative mx-auto h-24 w-24">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Preparando seu dashboard...
                    </h2>
                    <p className="text-muted-foreground">
                        Estamos configurando sua loja e ferramentas.
                    </p>
                </div>
            </div>
        </div>
    );
}
