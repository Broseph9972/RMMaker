import { Button } from "@/components/ui/button";
import { Paintbrush, Eraser } from "lucide-react";

interface ToolPanelProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

export function ToolPanel({ selectedTool, onToolSelect }: ToolPanelProps) {
  const tools = [
    { id: "brush", icon: Paintbrush, title: "Brush - Paint individual stickers (B) or Ctrl+click to fill cube" },
    { id: "eraser", icon: Eraser, title: "Eraser - Clear stickers to white (E)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {tools.map(({ id, icon: Icon, title }) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          className={`p-3 ${
            selectedTool === id 
              ? "bg-primary text-white hover:bg-blue-700" 
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          onClick={() => onToolSelect(id)}
          title={title}
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );
}
