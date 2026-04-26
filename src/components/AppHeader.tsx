import { Link, useNavigate } from "react-router-dom";
import { LogOut, Plus, FlaskConical } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials =
    user?.user_metadata?.full_name?.slice(0, 1)?.toUpperCase() ??
    user?.email?.slice(0, 1)?.toUpperCase() ??
    "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/dashboard" aria-label="OriginLab AI home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Experiments
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/new")}
            className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New experiment
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="rounded-full ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
                  <AvatarFallback className="bg-secondary text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                <div className="text-sm font-medium">
                  {user?.user_metadata?.full_name ?? "Signed in"}
                </div>
                <div className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
