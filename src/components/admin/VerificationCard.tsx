import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  User,
  Building2,
  ExternalLink,
  FileText,
  Instagram,
  Youtube,
  Globe,
  Users,
  ShoppingBag,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

interface VerificationRequest {
  id: string;
  type: "creator" | "brand";
  name: string;
  username?: string;
  avatar?: string;
  followers?: number;
  products?: number;
  hasProfileComplete?: boolean;
  hasMinFollowers?: boolean;
  hasMinProducts?: boolean;
  hasNoWarnings?: boolean;
  documents?: string[];
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  // Brand specific
  cnpj?: string;
  website?: string;
  segment?: string;
  companySize?: string;
  createdAt: string;
}

interface VerificationCardProps {
  request: VerificationRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestInfo: (id: string) => void;
  isLoading?: boolean;
}

export function VerificationCard({
  request,
  onApprove,
  onReject,
  onRequestInfo,
  isLoading,
}: VerificationCardProps) {
  const isCreator = request.type === "creator";

  return (
    <Card className="border-admin-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar/Logo */}
          <Avatar className="h-16 w-16">
            <AvatarImage src={request.avatar} />
            <AvatarFallback>
              {isCreator ? <User className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{request.name}</h4>
              {request.username && (
                <span className="text-sm text-muted-foreground">@{request.username}</span>
              )}
              <Badge variant="outline" className="ml-auto">
                {isCreator ? "Creator" : "Brand"}
              </Badge>
            </div>

            {isCreator ? (
              <>
                {/* Creator Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{request.followers?.toLocaleString("pt-BR")} followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>{request.products} produtos</span>
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {request.hasMinFollowers ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Mínimo 1000 followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.hasProfileComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Perfil completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.hasMinProducts ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Mínimo 10 produtos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.hasNoWarnings ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Sem warnings</span>
                  </div>
                </div>

                {/* Social Links */}
                {request.socialLinks && (
                  <div className="flex items-center gap-3">
                    {request.socialLinks.instagram && (
                      <a
                        href={request.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {request.socialLinks.youtube && (
                      <a
                        href={request.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Youtube className="h-4 w-4" />
                      </a>
                    )}
                    {request.socialLinks.website && (
                      <a
                        href={request.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Brand Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">CNPJ:</span>{" "}
                    <span className="font-mono">{request.cnpj}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Segmento:</span>{" "}
                    <span>{request.segment}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Porte:</span>{" "}
                    <span>{request.companySize}</span>
                  </div>
                  {request.website && (
                    <div>
                      <a
                        href={request.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    </div>
                  )}
                </div>

                {/* CNPJ Status */}
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>CNPJ ativo (verificado)</span>
                </div>
              </>
            )}

            {/* Documents */}
            {request.documents && request.documents.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{request.documents.length} documento(s) anexado(s)</span>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  Ver documentos
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(request.id)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(request.id, "")}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRequestInfo(request.id)}
              disabled={isLoading}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Mais Info
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
