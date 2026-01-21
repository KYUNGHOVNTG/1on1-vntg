export interface SnackbarAction {
  label: string;
  onClick: () => void;
}

export interface Snackbar {
  id: string;
  message: string;
  action?: SnackbarAction;
  duration?: number;
}

export interface SnackbarProps extends Snackbar {
  onClose: () => void;
}
