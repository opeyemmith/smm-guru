"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/better-auth/auth-client";
import {
  CircleUser,
  LogOut,
  ReceiptText,
  ShieldUser,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Session } from "@/lib/better-auth/type.auth";
import Link from "next/link";

const SidebarProfile = () => {
  const route = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data, isPending } = useSession();

  return (
    <>
      {!isPending && data && (
        <div className="flex items-center gap-3">
          <ProfileDropdown data={data} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {data?.user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {data?.user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={isSigningOut}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              signOut({
                fetchOptions: {
                  onSuccess: () => {
                    route.push("/");
                  },
                  onRequest: () => {
                    setIsSigningOut(true);
                  },
                  onResponse: () => {
                    setIsSigningOut(false);
                  },
                },
              });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isPending && !data && <ProfileSkeleton />}
    </>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-14 mb-1" />
        <Skeleton className="h-3 w-11" />
      </div>
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
};

export const ProfileDropdown = ({ data }: { data: Session }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {data?.user.name.slice(0, 1) || "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CircleUser />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ReceiptText />
          Billing
        </DropdownMenuItem>
        <Link href="/admin">
          <DropdownMenuItem>
            <ShieldUser />
            Admin
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SidebarProfile;
