import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, Button } from "@/components/ui";
import { toUserFacingError } from "@/utils/userError";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const { message, code } = toUserFacingError(
        this.state.error,
        "Нет соединения с ботом, попробуйте позже",
      );
      return (
        <Card className="text-center my-8">
          <p className="text-cr-loss mb-2 font-semibold">{message}</p>
          <p className="text-xs text-cr-muted mb-4">Код ошибки: {code}</p>
          <Button onClick={() => this.setState({ error: null })}>Попробовать снова</Button>
        </Card>
      );
    }
    return this.props.children;
  }
}
