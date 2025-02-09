
import React from "react";
import { Button } from "./ui/button";
import { Map } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Map className="w-6 h-6 text-blue-500" />
        <h1 className="text-xl font-semibold text-gray-900">Eco Angler Helper</h1>
      </div>
      <nav className="flex items-center space-x-4">
        <Button variant="ghost">About</Button>
        <Button variant="ghost">Help</Button>
      </nav>
    </header>
  );
};

export default Header;
