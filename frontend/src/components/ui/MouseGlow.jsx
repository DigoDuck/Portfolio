import { useEffect, useRef } from "react";

export default function MouseGlow() {
  const blobRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      
      if (blobRef.current) {
        blobRef.current.animate(
          {
            left: `${clientX}px`,
            top: `${clientY}px`,
          },
          { duration: 100, fill: "forwards" }
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={blobRef}
      className="pointer-events-none fixed top-0 left-0 w-52 h-52 bg-sky-500/20 dark:bg-sky-400/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 z-0"
    />
  );
}