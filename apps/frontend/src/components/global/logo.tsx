import { ChevronsDown } from "lucide-react";
import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <Link href="/" className="font-bold text-lg flex items-center">
      <ChevronsDown className="bg-gradient-to-tr border-secondary from-primary via-primary/70 to-primary rounded-lg w-9 h-9 mr-2 border text-white" />
      SMM GURU.
    </Link>
  );
};

export default Logo;
