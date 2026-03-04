const PhraserTextLogo = ({
  width,
  className,
}: {
  width?: number;
  className?: string;
}) => {
  return (
    <div
      className={`font-normal tracking-[2px]${className ? ` ${className}` : ""}`}
      style={{
        fontFamily: "'Geist Pixel Circle', monospace",
        fontSize: width ? width / 4.2 : 28,
        width,
      }}
    >
      <span className="text-logo-primary">PHRASER</span>
    </div>
  );
};

export default PhraserTextLogo;
