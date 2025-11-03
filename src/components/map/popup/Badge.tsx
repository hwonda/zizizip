interface BadgeProps {
  title?: string;
  text: string;
}

export default function Badge({ title, text }: BadgeProps) {
  return (
    <div
      className="flex items-center gap-0.5 border border-dashed border-gray-8 rounded-full px-2 py-0.5 text-sm"
    >
      <span className="text-gray-5">{title}</span>
      <span className="text-gray-2">{text}</span>
    </div>
  );
}
