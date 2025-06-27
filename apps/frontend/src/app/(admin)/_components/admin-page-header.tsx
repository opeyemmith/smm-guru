"use client";

import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: {
    title: string;
    href: string;
  }[];
  actions?: ReactNode;
  className?: string;
}

export default function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink href={breadcrumb.href}>
                    {breadcrumb.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      
      <Card className="bg-card/50 border shadow-sm">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      </Card>
    </div>
  );
} 