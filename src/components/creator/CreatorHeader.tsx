import { Instagram, Youtube, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/ui/FollowButton";

interface CreatorHeaderProps {
  profile: {
    id: string;
    name: string;
    username: string;
    bio?: string | null;
    avatar_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
    website_url?: string | null;
    is_verified?: boolean;
  };
  followerCount?: number;
}

export function CreatorHeader({ profile, followerCount = 0 }: CreatorHeaderProps) {
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
      <Avatar className="h-24 w-24 border-2 border-border">
        <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
        <AvatarFallback className="text-xl font-sans">{initials}</AvatarFallback>
      </Avatar>

      <div className="space-y-1">
        <h1 className="text-2xl font-sans font-semibold flex items-center justify-center gap-2">
          {profile.name}
          {profile.is_verified && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary rounded-full">
              <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </h1>
        <p className="text-muted-foreground">@{profile.username}</p>
        <p className="text-sm text-muted-foreground">{followerCount.toLocaleString()} seguidores</p>
      </div>

      {profile.bio && (
        <p className="text-sm text-muted-foreground max-w-md">{profile.bio}</p>
      )}

      <div className="flex items-center gap-3">
        {profile.instagram_url && (
          <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Instagram className="h-5 w-5" />
          </a>
        )}
        {profile.tiktok_url && (
          <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
        )}
        {profile.youtube_url && (
          <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Youtube className="h-5 w-5" />
          </a>
        )}
        {profile.website_url && (
          <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Globe className="h-5 w-5" />
          </a>
        )}
      </div>

      <FollowButton creatorId={profile.id} className="mt-2" />
    </div>
  );
}
