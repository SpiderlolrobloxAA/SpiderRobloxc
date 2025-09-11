import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isBanner = props.variant === "banner";
        return (
          <Toast key={id} {...props}>
            {isBanner && (
              <div
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-3"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0 6px, rgba(255,255,255,0.06) 6px 12px)",
                }}
              />
            )}
            <div className={isBanner ? "ml-3 grid gap-1" : "grid gap-1"}>
              {title && (
                <ToastTitle
                  className={isBanner ? "text-lg font-extrabold" : ""}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className={isBanner ? "opacity-95" : ""}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
