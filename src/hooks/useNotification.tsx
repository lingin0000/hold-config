import {
  useId,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  ToastIntent,
} from "@fluentui/react-components";

export const useNotification = () => {
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const showNotification = (
    type: "success" | "error" | "warning",
    message: string,
    title?: string
  ) => {
    const intent: ToastIntent =
      type === "success" ? "success" : type === "error" ? "error" : "warning";

    dispatchToast(
      <Toast>
        <ToastTitle>{title || "通知"}</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent, timeout: 3000 }
    );
  };

  return {
    toasterId,
    showNotification,
  };
};

export const NotificationToaster = ({ toasterId }: { toasterId: string }) => {
  return <Toaster toasterId={toasterId} />;
};