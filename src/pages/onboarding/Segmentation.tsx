import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Eye, ArrowRight, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function Segmentation() {
    const navigate = useNavigate();
    const { switchRole, refreshSession } = useAuth();
    const [loading, setLoading] = useState<"creator" | "follower" | null>(null);

    const handleSelection = async (role: "creator" | "follower") => {
        setLoading(role);
        try {
            // In a real app, we might want to just set a preference meta-data here
            // But we'll use switchRole to formally set them in the database
            const { error } = await switchRole(role);

            if (error) throw error;

            // Force session refresh to ensure role is in state
            await refreshSession();

            if (role === "follower") {
                navigate("/me/feed");
            } else {
                navigate("/onboarding/plan");
            }
        } catch (error) {
            console.error("Error setting role:", error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SiteHeader />

            <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
                <div className="max-w-4xl w-full space-y-8 text-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Como você quer usar o Diderot?
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Escolha a experiência ideal para você.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
                        {/* Creator Card */}
                        <Card
                            className="relative overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 group p-6 md:p-8 flex flex-col items-center text-center space-y-4 hover:shadow-lg"
                            onClick={() => handleSelection("creator")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold">Sou Creator</h3>
                                <p className="text-muted-foreground">
                                    Quero monetizar meu conteúdo
                                </p>
                            </div>

                            <ul className="text-sm space-y-2 pt-4 text-muted-foreground">
                                <li className="flex items-center justify-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Criar links, produtos e páginas
                                </li>
                            </ul>

                            <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                <Button disabled={!!loading}>
                                    {loading === "creator" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            Escolher Creator <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {/* Follower Card */}
                        <Card
                            className="relative overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 group p-6 md:p-8 flex flex-col items-center text-center space-y-4 hover:shadow-lg"
                            onClick={() => handleSelection("follower")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Eye className="h-8 w-8 text-foreground" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold">Sou Seguidor</h3>
                                <p className="text-muted-foreground">
                                    Quero descobrir creators
                                </p>
                            </div>

                            <ul className="text-sm space-y-2 pt-4 text-muted-foreground">
                                <li className="flex items-center justify-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                    Consumir conteúdos e links
                                </li>
                            </ul>

                            <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                <Button variant="secondary" disabled={!!loading}>
                                    {loading === "follower" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            Escolher Seguidor <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
